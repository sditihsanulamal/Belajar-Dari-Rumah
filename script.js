/* ============================================================
   RUANG KELAS ONLINE — script.js
   UI BARU : Gatekeeper (toggle Murid/Pendidik) + Dashboard Tab
   ------------------------------------------------------------
   Alur login:
   - Murid    : Cek Sandi Kelas -> pilih nama -> Masuk Kelas
   - Pendidik : peran + username + password -> Masuk Dashboard
   Data memakai SUPABASE (tabel relasional: master_kelas,
   master_murid, master_pendidik) bila tersedia, dan otomatis
   FALLBACK ke data demo lokal agar aplikasi selalu bisa dipakai.
   ============================================================ */

/* ---------- Konfigurasi Supabase (lazy & non-blocking) ---------- */
const SUPABASE_URL = 'https://pqbxrrtsgrbyyrdpeglt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ODg9vaJgA-lOWT7DU7V1Sg_sILIvypM';
let db = null;   // client `db` (dipakai lazy oleh inisialisasiDb)

function muatScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = function () { resolve(); };
    el.onerror = function () { reject(new Error('Gagal memuat ' + src)); };
    document.head.appendChild(el);
  });
}

// TIDAK PERNAH melempar error supaya aplikasi tetap jalan.
async function inisialisasiDb() {
  try {
    if (typeof window.supabase === 'undefined') {
      try {
        await muatScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      } catch (err1) {
        await muatScript('https://unpkg.com/@supabase/supabase-js@2');
      }
    }
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Supabase terhubung.');
    }
  } catch (err) {
    console.warn('⚠ Gagal inisialisasi Supabase:', err);
  }
}

async function tungguSupabase(ms = 6000) {
  if (db) return true;
  await Promise.race([inisialisasiDb(), new Promise((r) => setTimeout(r, ms))]);
  return !!db;
}

/* ---------- Helper ---------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg, icon = 'fa-circle-check') {
  const area = $('#toast-area');
  if (!area) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  area.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 2600);
}

// Tampilkan pesan status pada elemen form (tipe: ok | err)
function tampilkanStatus(el, teks, tipe) {
  if (!el) return;
  el.textContent = teks;
  el.className = 'form-status ' + (tipe || '');
}

/* ============================================================
   DATA DEMO / FALLBACK
   (dipakai kalau database belum terisi atau tidak bisa diakses)
   ============================================================ */
const KELAS_DEMO = [
  { kode: 'kelas-1a', nama: 'Kelas 1A', sandi: 'kelas-1a' },
  { kode: 'kelas-4a', nama: 'Kelas 4A', sandi: 'kelas-4a' },
];

const MURID_DEMO = {
  'kelas-1a': ['Ahmad', 'Budi', 'Siti', 'Zahra'],
  'kelas-4a': ['Dewi', 'Fajar', 'Hana', 'Raka'],
};

// Peran & akun pendidik demo. PENTING: semua password = 123
const PERAN_PENDIDIK = [
  { peran: 'walikelas',   label: 'Wali Kelas' },
  { peran: 'guru-mapel',  label: 'Guru Mapel' },
  { peran: 'guru-quran',  label: "Guru Qur'an" },
  { peran: 'koordinator', label: 'Koordinator' },
];

const PENDIDIK_DEMO = [
  { peran: 'walikelas',   username: 'walikelas',   password: '123', nama: 'Pak Budi' },
  { peran: 'guru-mapel',  username: 'gurumapel',   password: '123', nama: 'Bu Siti' },
  { peran: 'guru-quran',  username: 'guruquran',   password: '123', nama: 'Ust. Ahmad' },
  { peran: 'koordinator', username: 'koordinator', password: '123', nama: 'Pak Hasan' },
];

function labelPeran(peran) {
  const p = PERAN_PENDIDIK.find((x) => x.peran === peran);
  return p ? p.label : peran;
}

/* ============================================================
   STATE APLIKASI & SESI
   ============================================================ */
let sesiAktif = null;   // { rol: 'murid'|'pendidik', ... }

const SESI_KEY = 'rukob_session';

function simpanSesi(rincian) {
  localStorage.setItem(SESI_KEY, JSON.stringify(rincian));
  sesiAktif = rincian;
}

function hapusSesi() {
  localStorage.removeItem(SESI_KEY);
  sesiAktif = null;
}

/* ============================================================
   TOGGLE LOGIN : Murid <-> Pendidik
   ============================================================ */
const loginToggle = $('#login-toggle');
const panelMurid  = $('#panel-murid');
const panelPendidik = $('#panel-pendidik');

if (loginToggle) {
  loginToggle.addEventListener('click', (e) => {
    const opt = e.target.closest('.toggle-option');
    if (!opt || opt.classList.contains('active')) return;

    // Ganti status aktif tombol + aria
    loginToggle.querySelectorAll('.toggle-option').forEach((o) => {
      o.classList.toggle('active', o === opt);
      o.setAttribute('aria-selected', o === opt ? 'true' : 'false');
    });

    // Geser indikator & tukar panel (fade-in)
    const kePendidik = opt.dataset.role === 'pendidik';
    loginToggle.classList.toggle('pendidik', kePendidik);
    panelMurid.classList.toggle('active', !kePendidik);
    panelPendidik.classList.toggle('active', kePendidik);

    // Bersihkan status error lama supaya tidak membingungkan
    const ps = $('#pesan-murid');
    if (ps) ps.classList.add('hidden');
  });
}

/* ============================================================
   LANGKAH 1 MURID : CEK SANDI KELAS
   ============================================================ */
async function cariKelas(sandi) {
  const s = String(sandi || '').trim().toLowerCase();

  // 1) Coba database relasional (master_kelas) bila tersedia
  if (await tungguSupabase()) {
    try {
      const { data, error } = await db.from('master_kelas').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const ketemu = data.find((k) =>
          String(k.sandi_kelas || k.sandi || k.kode || '').toLowerCase() === s ||
          String(k.kode || '').toLowerCase() === s
        );
        if (ketemu) {
          return {
            kode: ketemu.kode || ketemu.id || s,
            nama: ketemu.nama || 'Kelas',
            sandi: s,
            dariDb: true,
          };
        }
      }
    } catch (err) {
      console.warn('⚠ master_kelas tidak terbaca, pakai demo:', err);
    }
  }

  // 2) Fallback data demo
  return KELAS_DEMO.find((k) => k.sandi === s || k.kode === s) || null;
}

const formCekKelas = $('#form-cek-kelas');
if (formCekKelas) {
  formCekKelas.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#sandi-kelas');
    const pesan = $('#pesan-murid');
    const sandi = (input ? input.value : '').trim();

    if (!sandi) {
      tampilkanStatus(pesan, 'Ketik sandi kelas dulu ya!', 'err');
      pesan.classList.remove('hidden');
      return;
    }

    const btn = $('#btn-cek-kelas');
    if (btn) btn.disabled = true;

    const kelas = await cariKelas(sandi);

    if (btn) btn.disabled = false;

    if (!kelas) {
      tampilkanStatus(pesan, 'Sandi kelas tidak ditemukan. Coba "kelas-1a" ya!', 'err');
      pesan.classList.remove('hidden');
      return;
    }

    // Simpan kelas yang ditemukan utk langkah berikutnya
    sesiAktif = { rol: 'murid', kelas: kelas };

    // Isi dropdown nama murid untuk kelas tsb
    await isiDaftarNamaMurid(kelas);
    $('#select-murid').selectedIndex = 0;

    // Tampilkan panel pilih nama
    $('#panel-pilih-murid').classList.remove('hidden');
    tampilkanStatus(pesan, '', 'ok');
    pesan.classList.add('hidden');

    toast(`Kelas ditemukan: ${kelas.nama} 🎉`, 'fa-circle-check');
  });
}

/* ============================================================
   ISI DROPDOWN NAMA MURID (dari master_murid / demo)
   ============================================================ */
async function isiDaftarNamaMurid(kelas) {
  const select = $('#select-murid');
  if (!select) return;
  select.innerHTML = '<option value="">— Pilih nama kamu —</option>';

  let daftar = [];

  // Coba database relasional (master_murid) bila tersedia
  if (await tungguSupabase()) {
    try {
      const kolomKelas = ['kelas_id', 'kelas_kode', 'kode_kelas', 'nama_kelas_id'];
      const { data, error } = await db.from('master_murid').select('*');
      if (!error && Array.isArray(data) && data.length) {
        daftar = data
          .filter((m) => {
            const val = kolomKelas.map((k) => String(m[k] || '')).join('|');
            return val.toLowerCase().includes(kelas.kode.toLowerCase()) ||
                   String(m.kelas || '').toLowerCase() === kelas.nama.toLowerCase();
          })
          .map((m) => m.nama || m.nama_murid || '');
        daftar = daftar.filter(Boolean);
      }
    } catch (err) {
      console.warn('⚠ master_murid tidak terbaca, pakai demo:', err);
    }
  }

  // Fallback demo
  if (!daftar.length) {
    daftar = MURID_DEMO[kelas.kode] || MURID_DEMO[kelas.sandi] || [];
  }

  daftar.forEach((nama) => {
    const opt = document.createElement('option');
    opt.value = nama;
    opt.textContent = nama;
    select.appendChild(opt);
  });
}

/* ============================================================
   LANGKAH 2 MURID : MASUK KELAS
   ============================================================ */
const btnMasukKelas = $('#btn-masuk-kelas');
if (btnMasukKelas) {
  btnMasukKelas.addEventListener('click', () => {
    const nama = $('#select-murid').value;
    const pesan = $('#pesan-murid');

    if (!nama) {
      tampilkanStatus(pesan, 'Pilih namamu dulu ya!', 'err');
      pesan.classList.remove('hidden');
      return;
    }

    if (!(sesiAktif && sesiAktif.kelas)) {
      tampilkanStatus(pesan, 'Silakan cek sandi kelas dulu.', 'err');
      pesan.classList.remove('hidden');
      return;
    }

    // Simpan sesi & buka dashboard
    const kelas = sesiAktif.kelas;
    simpanSesi({ rol: 'murid', nama, kelasKode: kelas.kode, kelasNama: kelas.nama });
    bukaDashboard();
  });
}

/* ============================================================
   LOGIN PENDIDIK
   ============================================================ */
async function cariPendidik(peran, username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '');

  // 1) Coba database relasional (master_pendidik) bila tersedia
  if (await tungguSupabase()) {
    try {
      const { data, error } = await db.from('master_pendidik').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const ketemu = data.find((x) =>
          String(x.peran || '').toLowerCase() === peran &&
          String(x.username || '').toLowerCase() === u &&
          String(x.password || '') === p
        );
        if (ketemu) {
          return {
            peran,
            username: ketemu.username || u,
            nama: ketemu.nama || ketemu.nama_pendidik || u,
          };
        }
      }
    } catch (err) {
      console.warn('⚠ master_pendidik tidak terbaca, pakai demo:', err);
    }
  }

  // 2) Fallback data demo
  const akun = PENDIDIK_DEMO.find(
    (x) => x.peran === peran && x.username.toLowerCase() === u && x.password === p
  );
  return akun || null;
}

const formLoginPendidik = $('#form-login-pendidik');
if (formLoginPendidik) {
  formLoginPendidik.addEventListener('submit', async (e) => {
    e.preventDefault();

    const peran    = $('#peran-pendidik').value;
    const username = $('#username-pendidik').value.trim();
    const password = $('#password-pendidik').value;
    const btn      = $('#btn-masuk-dashboard');

    if (!peran)  { toast('Pilih peranmu dulu ya!', 'fa-triangle-exclamation'); return; }
    if (!username || !password) { toast('Username & password wajib diisi!', 'fa-triangle-exclamation'); return; }

    if (btn) btn.disabled = true;
    const akun = await cariPendidik(peran, username, password);
    if (btn) btn.disabled = false;

    if (!akun) {
      toast('Peran / username / password salah. Coba akun demo di bawah!', 'fa-triangle-exclamation');
      return;
    }

    simpanSesi({
      rol: 'pendidik',
      peran: akun.peran,
      nama: akun.nama || akun.username,
      username: akun.username,
    });
    bukaDashboard();
  });
}

/* ============================================================
   DASHBOARD : buka layar, sapaan, & siapkan tab
   ============================================================ */
function bukaDashboard() {
  const s = sesiAktif;
  if (!s) return;

  $('#screen-gatekeeper').classList.add('hidden');
  $('#screen-dashboard').classList.remove('hidden');

  // Sapaan dinamis di header
  const welcome = $('#welcome-text');
  if (s.rol === 'murid') {
    welcome.textContent = `Halo, ${s.nama} - ${s.kelasNama}`;
  } else {
    welcome.textContent = `Halo, ${s.nama} (${labelPeran(s.peran)})`;
  }

  // Buka tab pertama secara default
  pilihTab('tab-quran');

  toast(s.rol === 'murid'
    ? `${s.nama}, selamat belajar! 🌟`
    : `Selamat bekerja, ${s.nama}! ✨`, 'fa-star');
}

/* ============================================================
   NAVIGASI TAB (Al-Qur'an / Mata Pelajaran / Harian)
   ============================================================ */
function pilihTab(id) {
  $$('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === id);
  });
  $$('.tab-content').forEach((c) => {
    c.classList.toggle('active', c.id === id);
  });
}

$$('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => pilihTab(btn.dataset.tab));
});

/* ============================================================
   LOGOUT
   ============================================================ */
const btnLogout = $('#btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    if (!confirm('Yakin ingin keluar?')) return;
    hapusSesi();
    $('#screen-dashboard').classList.add('hidden');
    $('#screen-gatekeeper').classList.remove('hidden');

    // Kembalikan form murid ke kondisi awal
    $('#panel-pilih-murid').classList.add('hidden');
    const pesan = $('#pesan-murid');
    if (pesan) { pesan.textContent = ''; pesan.className = 'form-status hidden'; }
    $('#sandi-kelas').value = '';
    $('#select-murid').selectedIndex = 0;

    // Kembalikan form pendidik
    $('#peran-pendidik').selectedIndex = 0;
    $('#username-pendidik').value = '';
    $('#password-pendidik').value = '';

    toast('Kamu sudah keluar. Sampai jumpa! 👋', 'fa-right-from-bracket');
  });
}

/* ============================================================
   PENGECEKAN SESI SAAT HALAMAN DIMUAT
   ============================================================ */
function cekSession() {
  try {
    const raw = localStorage.getItem(SESI_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);

    if (s && s.rol === 'murid' && s.nama && s.kelasNama) {
      sesiAktif = { rol: 'murid', nama: s.nama, kelas: { kode: s.kelasKode, nama: s.kelasNama } };
      bukaDashboard();
      return;
    }
    if (s && s.rol === 'pendidik' && s.peran && s.nama) {
      sesiAktif = s;
      bukaDashboard();
      return;
    }
  } catch (err) {
    hapusSesi();
  }
}

/* ============================================================
   INISIALISASI
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  cekSession();
});