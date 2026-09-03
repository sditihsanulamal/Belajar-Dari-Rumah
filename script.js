/* ============================================================
   RUANG KELAS ONLINE — script.js
   AUTENTIKASI & ROLE-BASED ROUTING
   ------------------------------------------------------------
   Tabel Supabase (relasional):
   - master_kelas : id, kode, sandi_kelas, nama
   - master_murid : id, nama / nama_murid, kelas_id
   - master_guru  : id, nama / nama_guru, username, password,
                    peran (walikelas | guru-mapel | guru-quran | koordinator),
                    kelas_id (opsional, utk wali kelas)

   Sesi disimpan di sessionStorage (otomatis terhapus saat tab ditutup).
   ============================================================ */

/* ---------- Konfigurasi Supabase ---------- */
const SUPABASE_URL = 'https://pqbxrrtsgrbyyrdpeglt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ODg9vaJgA-lOWT7DU7V1Sg_sILIvypM';
let db = null;

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

// Beri kesempatan CDN load; kembalikan true bila db siap.
async function tungguSupabase(ms) {
  if (db) return true;
  const timeout = ms || 6000;
  await Promise.race([
    inisialisasiDb(),
    new Promise(function (r) { setTimeout(r, timeout); }),
  ]);
  return !!db;
}

/* ---------- Helper ---------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg, icon) {
  const area = $('#toast-area');
  if (!area) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<i class="fa-solid ' + (icon || 'fa-circle-check') + '"></i> ' + msg;
  area.appendChild(t);
  requestAnimationFrame(function () { t.classList.add('show'); });
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () { t.remove(); }, 350);
  }, 2600);
}

function tampilkanStatus(el, teks, tipe) {
  if (!el) return;
  el.textContent = teks;
  el.className = 'form-status ' + (tipe || '');
}

/* ---------- Sesi: sessionStorage ---------- */
const SESI = {
  set: function (k, v) {
    if (v !== null && v !== undefined) sessionStorage.setItem(k, String(v));
  },
  get: function (k) { return sessionStorage.getItem(k); },
  clear: function () { sessionStorage.clear(); },
};

function labelPeran(peran) {
  const map = {
    walikelas: 'Wali Kelas',
    'guru-mapel': 'Guru Mapel',
    'guru-quran': "Guru Qur'an",
    koordinator: 'Koordinator',
  };
  return map[peran] || peran || 'Pendidik';
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

    loginToggle.querySelectorAll('.toggle-option').forEach((o) => {
      o.classList.toggle('active', o === opt);
      o.setAttribute('aria-selected', o === opt ? 'true' : 'false');
    });

    const kePendidik = opt.dataset.role === 'pendidik';
    loginToggle.classList.toggle('pendidik', kePendidik);
    panelMurid.classList.toggle('active', !kePendidik);
    panelPendidik.classList.toggle('active', kePendidik);

    const ps = $('#pesan-murid');
    if (ps) ps.classList.add('hidden');
  });
}

/* ============================================================
   MURID — LANGKAH 1 : CEK SANDI KELAS
   Cari master_kelas berdasarkan sandi kelas -> simpan kelas sementara.
   ============================================================ */
let sesiSementaraKelas = null;   // menyimpan objek kelas hasil "Cek Kelas"

async function cariKelasBySandi(sandi) {
  const s = String(sandi || '').trim().toLowerCase();
  if (!(await tungguSupabase())) return null;

  try {
    const { data, error } = await db
      .from('master_kelas')
      .select('*')
      .or('sandi_kelas.eq.' + s + ',kode.eq.' + s + ',sandi.eq.' + s);
    if (error) throw error;
    if (Array.isArray(data) && data.length) return data[0];
  } catch (err) {
    console.warn('⚠ master_kelas tidak terbaca:', err);
  }
  return null;
}

const formCekKelas = $('#form-cek-kelas');
if (formCekKelas) {
  formCekKelas.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = $('#sandi-kelas');
    const pesan = $('#pesan-murid');
    const sandi = (input ? input.value : '').trim();

    if (!sandi) {
      alert('Silakan ketik Sandi Kelas terlebih dahulu.');
      tampilkanStatus(pesan, 'Ketik sandi kelas dulu ya!', 'err');
      return;
    }

    const btn = $('#btn-cek-kelas');
    if (btn) btn.disabled = true;                 // mencegah klik ganda

    const kelas = await cariKelasBySandi(sandi);

    if (btn) btn.disabled = false;

    // EROR: sandi salah / tidak ditemukan
    if (!kelas) {
      tampilkanStatus(pesan, 'Sandi kelas tidak ditemukan.', 'err');
      alert('Sandi kelas salah / tidak ditemukan. Silakan periksa kembali!');
      return;
    }

    // Simpan kelas hasil pencarian utk langkah berikutnya
    sesiSementaraKelas = kelas;

    // Ambil daftar murid di kelas tsb lalu isi dropdown
    const daftarMurid = await ambilMuridByKelasId(kelas.id || kelas.kelas_id);
    isiDropdownMurid(daftarMurid);

    // Tampilkan panel "pilih nama + Masuk Kelas"
    const panelPilih = $('#panel-pilih-murid');
    if (panelPilih) panelPilih.classList.remove('hidden');
    tampilkanStatus(pesan, '', 'ok');
    pesan.classList.add('hidden');

    toast('Kelas ditemukan: ' + (kelas.nama || 'Kelas') + ' 🎉', 'fa-circle-check');
  });
}

/* ============================================================
   MURID — AMBIL & ISI DROPDOWN NAMA MURID
   ============================================================ */
async function ambilMuridByKelasId(kelasId) {
  if (!kelasId) return [];
  try {
    const { data, error } = await db
      .from('master_murid')
      .select('*')
      .eq('kelas_id', kelasId);
    if (error) throw error;

    if (Array.isArray(data) && data.length) {
      return data
        .map((m) => ({
          murid_id: m.id || m.murid_id,
          nama: m.nama || m.nama_murid || '',
        }))
        .filter((x) => x.murid_id !== undefined && x.nama);
    }
  } catch (err) {
    console.warn('⚠ master_murid tidak terbaca:', err);
  }
  return [];
}

function isiDropdownMurid(daftar) {
  const select = $('#select-murid');
  if (!select) return;
  select.innerHTML = '<option value="">— Pilih nama kamu —</option>';

  daftar.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.murid_id;      // simpan murid_id sebagai value
    opt.textContent = m.nama;    // tampilkan nama
    select.appendChild(opt);
  });
}

/* ============================================================
   MURID — LANGKAH 2 : MASUK KELAS
   Simpan nama_murid, murid_id, kelas_id, role='MURID' -> renderDashboard()
   ============================================================ */
const btnMasukKelas = $('#btn-masuk-kelas');
if (btnMasukKelas) {
  btnMasukKelas.addEventListener('click', () => {
    const select = $('#select-murid');
    const pesan  = $('#pesan-murid');
    const murid_id = select ? select.value : '';

    if (!murid_id) {
      tampilkanStatus(pesan, 'Pilih namamu dulu ya!', 'err');
      alert('Pilih nama murid terlebih dahulu sebelum masuk kelas.');
      return;
    }

    if (!sesiSementaraKelas) {
      tampilkanStatus(pesan, 'Silakan cek sandi kelas dulu.', 'err');
      alert('Silakan lakukan "Cek Kelas" terlebih dahulu.');
      return;
    }

    const nama_murid = select.options[select.selectedIndex]
      ? select.options[select.selectedIndex].textContent.trim()
      : '';

    // Simpan sesi murid ke sessionStorage (sesuai spesifikasi)
    SESI.set('role', 'MURID');
    SESI.set('nama_murid', nama_murid);
    SESI.set('murid_id', murid_id);
    SESI.set('kelas_id', sesiSementaraKelas.id || sesiSementaraKelas.kelas_id);
    SESI.set('nama_kelas', sesiSementaraKelas.nama || 'Kelas');

    renderDashboard();
  });
}

/* ============================================================
   PENDIDIK — LOGIN TIM KELAS & KOORDINATOR
   Cek master_guru dengan .eq(username).eq(password),
   lalu pastikan peran dari dropdown cocok dengan akun.
   ============================================================ */
async function cariGuru(peran, username, password) {
  const u = String(username || '').trim();
  const p = String(password || '');
  if (!(await tungguSupabase())) return null;

  try {
    const { data, error } = await db
      .from('master_guru')
      .select('*')
      .eq('username', u)
      .eq('password', p);
    if (error) throw error;

    if (Array.isArray(data) && data.length) {
      // Pastikan peran yang dipilih cocok dengan baris akun
      const cocok = data.find(function (g) {
        return String(g.peran || '').toLowerCase() === String(peran || '').toLowerCase();
      });
      if (cocok) return cocok;
    }
  } catch (err) {
    console.warn('⚠ master_guru tidak terbaca:', err);
  }
  return null;
}

const formLoginPendidik = $('#form-login-pendidik');
if (formLoginPendidik) {
  formLoginPendidik.addEventListener('submit', async (e) => {
    e.preventDefault();

    const peran    = $('#peran-pendidik').value;
    const username = $('#username-pendidik').value.trim();
    const password = $('#password-pendidik').value;

    if (!peran)   { alert('Silakan pilih peran terlebih dahulu.'); return; }
    if (!username || !password) {
      alert('Username dan password wajib diisi.');
      return;
    }

    const btn = $('#btn-masuk-dashboard');
    if (btn) btn.disabled = true;

    const guru = await cariGuru(peran, username, password);

    if (btn) btn.disabled = false;

    // EROR: akun tidak ditemukan / tidak cocok
    if (!guru) {
      alert('Login gagal: peran / username / password tidak cocok. Periksa kembali!');
      return;
    }

    // Simpan sesi pendidik ke sessionStorage
    SESI.set('role', 'GURU');
    SESI.set('peran', guru.peran || peran);
    SESI.set('username', guru.username || username);
    SESI.set('nama_guru', guru.nama || guru.nama_guru || guru.username || username);
    if (guru.kelas_id) SESI.set('kelas_id', guru.kelas_id);   // opsional (wali kelas)

    renderDashboard();
  });
}

/* ============================================================
   RENDER DASHBOARD — role-based routing
   ------------------------------------------------------------
   - Koordinator : sembunyikan 3 tab, tampilkan Panel Koordinator
   - Murid / Tim Kelas : tampilkan 3 tab + sapaan dinamis
   ============================================================ */
function renderDashboard() {
  const role  = (SESI.get('role') || '').toUpperCase();
  const peran = (SESI.get('peran') || '').toLowerCase();

  // 1) Sembunyikan layar login, tampilkan dashboard
  const gate = $('#screen-gatekeeper');
  const dash = $('#screen-dashboard');
  if (gate) gate.classList.add('hidden');
  if (dash) dash.classList.remove('hidden');

  const isKoordinator = role === 'KOORDINATOR' || peran === 'koordinator';

  // 2) Atur navigasi & panel sesuai peran
  const tabNav      = $('.tab-nav');
  const panelKoord  = $('#panel-koordinator');
  const kontenTab   = $$('.tab-content');

  if (isKoordinator) {
    if (tabNav) tabNav.classList.add('hidden');
    if (panelKoord) panelKoord.classList.remove('hidden');
    kontenTab.forEach((c) => c.classList.remove('active'));
  } else {
    if (tabNav) tabNav.classList.remove('hidden');
    if (panelKoord) panelKoord.classList.add('hidden');
    pilihTab('tab-quran');   // tampilkan tab pertama (Al-Qur'an)
  }

  // 3) Sapaan dinamis di header
  const welcome = $('#welcome-text');
  if (welcome) {
    if (role === 'MURID') {
      const nama      = SESI.get('nama_murid') || 'Murid';
      const kelasNama = SESI.get('nama_kelas') || '';
      welcome.textContent = kelasNama
        ? 'Halo, ' + nama + ' - ' + kelasNama
        : 'Halo, ' + nama;
    } else {
      const nama = SESI.get('nama_guru') || SESI.get('username') || 'Pendidik';
      welcome.textContent = 'Halo, ' + nama + ' - ' + labelPeran(peran);
    }
  }

  toast(role === 'MURID'
    ? 'Selamat datang, ' + (SESI.get('nama_murid') || '') + '! 🌟'
    : 'Selamat bekerja! ✨', 'fa-star');
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

    SESI.clear();
    sesiSementaraKelas = null;

    $('#screen-dashboard').classList.add('hidden');
    $('#screen-gatekeeper').classList.remove('hidden');

    // Reset form murid
    $('#panel-pilih-murid').classList.add('hidden');
    const pesan = $('#pesan-murid');
    if (pesan) { pesan.textContent = ''; pesan.className = 'form-status hidden'; }
    $('#sandi-kelas').value = '';
    $('#select-murid').selectedIndex = 0;

    // Reset form pendidik
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
    const role = (SESI.get('role') || '').toUpperCase();
    const peran = SESI.get('peran');
    const namaMurid = SESI.get('nama_murid');
    const namaGuru  = SESI.get('nama_guru');

    if (!role) return;

    if (role === 'MURID' && namaMurid && SESI.get('kelas_id')) {
      renderDashboard();
      return;
    }
    if (role === 'GURU' && peran && (namaGuru || SESI.get('username'))) {
      renderDashboard();
      return;
    }
  } catch (err) {
    SESI.clear();
  }
}

/* ============================================================
   INISIALISASI
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  cekSession();
});