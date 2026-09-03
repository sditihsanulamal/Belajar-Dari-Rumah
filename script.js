/* ============================================================
   RUANG KELAS ONLINE — script.js
   AUTENTIKASI & ROLE-BASED ROUTING (dengan fallback demo)
   ------------------------------------------------------------
   Tabel Supabase (relasional):
   - master_kelas : id, sandi_kelas/kode, nama
   - master_murid : id, nama/nama_murid, kelas_id
   - master_guru  : username, password, peran, nama, kelas_id?

   Strategi:
   1) Coba SUMBER DATABASE (Supabase) bila terhubung.
   2) Bila gagal/offline/kolom beda -> FALLBACK DATA DEMO
      sehingga akun contoh (kelas-1a, walikelas/123, dll)
      SELALU bisa dipakai.
   ============================================================ */

/* ---------- Konfigurasi Supabase ---------- */
const SUPABASE_URL = 'https://pqbxrrtsgrbyyrdpeglt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ODg9vaJgA-lOWT7DU7V1Sg_sILIvypM';
let db = null;
let dbGagal = false;   // bila true, lewati percobaan koneksi berikutnya

function muatScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = function () { resolve(); };
    el.onerror = function () { reject(new Error('Gagal memuat ' + src)); };
    document.head.appendChild(el);
  });
}

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
      return;
    }
    dbGagal = true;
  } catch (err) {
    console.warn('⚠ Gagal inisialisasi Supabase:', err);
    dbGagal = true;
  }
}

async function tungguSupabase(ms) {
  if (db) return true;
  if (dbGagal) return false;
  const timeout = ms || 6000;
  await Promise.race([
    inisialisasiDb(),
    new Promise(function (r) { setTimeout(r, timeout); }),
  ]);
  if (!db) dbGagal = true;
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
   DATA DEMO (fallback) — SELALU tersedia
   ============================================================ */
const KELAS_DEMO = [
  { id: 'kelas-1a',  kode: 'kelas-1a',  sandi: 'kelas-1a', nama: 'Kelas 1A' },
  { id: 'kelas-4a',  kode: 'kelas-4a',  sandi: 'kelas-4a', nama: 'Kelas 4A' },
];

const MURID_DEMO = {
  'kelas-1a': [
    { murid_id: 'm1', nama: 'Ahmad' },
    { murid_id: 'm2', nama: 'Budi' },
    { murid_id: 'm3', nama: 'Siti' },
    { murid_id: 'm4', nama: 'Zahra' },
  ],
  'kelas-4a': [
    { murid_id: 'm5', nama: 'Dewi' },
    { murid_id: 'm6', nama: 'Fajar' },
    { murid_id: 'm7', nama: 'Hana' },
    { murid_id: 'm8', nama: 'Raka' },
  ],
};

const GURU_DEMO = [
  { peran: 'walikelas',   username: 'walikelas',   password: '123', nama: 'Pak Budi',   kelas_id: 'kelas-1a' },
  { peran: 'guru-mapel',  username: 'gurumapel',   password: '123', nama: 'Bu Siti',    kelas_id: '' },
  { peran: 'guru-quran',  username: 'guruquran',   password: '123', nama: 'Ust. Ahmad', kelas_id: '' },
  { peran: 'koordinator', username: 'koordinator', password: '123', nama: 'Pak Hasan',  kelas_id: '' },
];

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
   ============================================================ */
let sesiSementaraKelas = null;

// Cari kelas di DB (toleran terhadap nama kolom), atau fallback demo.
async function cariKelasBySandi(sandi) {
  const s = String(sandi || '').trim().toLowerCase();

  // 1) Sumber DATABASE
  if (await tungguSupabase()) {
    try {
      const { data, error } = await db.from('master_kelas').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const ketemu = data.find(function (k) {
          const kandidat = [
            k.sandi_kelas, k.sandi, k.kode, k.kode_kelas, k.nama,
          ].map(function (v) { return String(v || '').toLowerCase(); });
          return kandidat.indexOf(s) !== -1;
        });
        if (ketemu) return ketemu;
      }
      console.warn('⚠ master_kelas tidak cocok/tidak ada, fallback demo.');
    } catch (err) {
      console.warn('⚠ master_kelas tidak terbaca:', err);
    }
  }

  // 2) FALLBACK DEMO (selalu jalan)
  return KELAS_DEMO.find(function (k) {
    return String(k.sandi || '').toLowerCase() === s ||
           String(k.kode || '').toLowerCase() === s ||
           String(k.nama || '').toLowerCase() === s;
  }) || null;
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
    if (btn) btn.disabled = true;

    const kelas = await cariKelasBySandi(sandi);

    if (btn) btn.disabled = false;

    if (!kelas) {
      tampilkanStatus(pesan, 'Sandi kelas tidak ditemukan.', 'err');
      alert('Sandi kelas salah / tidak ditemukan. Coba: kelas-1a');
      return;
    }

    sesiSementaraKelas = kelas;

    // Ambil & isi dropdown nama murid
    const daftarMurid = await ambilMuridByKelas(kelas);
    isiDropdownMurid(daftarMurid);

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
async function ambilMuridByKelas(kelas) {
  const daftar = [];

  // 1) Sumber DATABASE
  if (await tungguSupabase()) {
    try {
      const { data, error } = await db.from('master_murid').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const targetKelasId = String(kelas.id || kelas.kelas_id || kelas.kode || '').toLowerCase();
        const targetNama    = String(kelas.nama || '').toLowerCase();

        data.forEach(function (m) {
          // cocokkan lewat beberapa kemungkinan nama kolom kelas di master_murid
          const kelasRef = String(m.kelas_id || m.kelas_kode || m.kode_kelas || m.nama_kelas_id || m.kelas || '');
          const muridNama = m.nama || m.nama_murid || '';
          if (!muridNama) return;

          const cocok =
            targetKelasId && kelasRef.toLowerCase() === targetKelasId ||
            targetNama && (kelasRef.toLowerCase() === targetNama || String(m.kelas_nama || '').toLowerCase() === targetNama);

          if (cocok) {
            daftar.push({ murid_id: m.id || m.murid_id || muridNama, nama: muridNama });
          }
        });
        if (daftar.length) return daftar;
      }
      console.warn('⚠ master_murid tidak cocok/tidak ada, fallback demo.');
    } catch (err) {
      console.warn('⚠ master_murid tidak terbaca:', err);
    }
  }

  // 2) FALLBACK DEMO
  const kode = String(kelas.id || kelas.kode || kelas.sandi || '').toLowerCase();
  return MURID_DEMO[kode] || [];
}

function isiDropdownMurid(daftar) {
  const select = $('#select-murid');
  if (!select) return;
  select.innerHTML = '<option value="">— Pilih nama kamu —</option>';

  daftar.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.murid_id;
    opt.textContent = m.nama;
    select.appendChild(opt);
  });
}

/* ============================================================
   MURID — LANGKAH 2 : MASUK KELAS
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

    SESI.set('role', 'MURID');
    SESI.set('nama_murid', nama_murid);
    SESI.set('murid_id', murid_id);
    SESI.set('kelas_id', sesiSementaraKelas.id || sesiSementaraKelas.kelas_id || sesiSementaraKelas.kode);
    SESI.set('nama_kelas', sesiSementaraKelas.nama || 'Kelas');

    renderDashboard();
  });
}

/* ============================================================
   PENDIDIK — LOGIN TIM KELAS & KOORDINATOR
   ============================================================ */
async function cariGuru(peran, username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '');

  // 1) Sumber DATABASE (toleran nama kolom)
  if (await tungguSupabase()) {
    try {
      const { data, error } = await db.from('master_guru').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const ketemu = data.find(function (g) {
          const peranCocok = String(g.peran || '').toLowerCase() === String(peran || '').toLowerCase();
          const userCocok  = String(g.username || g.user || '').toLowerCase() === u;
          const passCocok  = String(g.password || g.pass || '') === p;
          return peranCocok && userCocok && passCocok;
        });
        if (ketemu) return ketemu;
      }
      console.warn('⚠ master_guru tidak cocok/tidak ada, fallback demo.');
    } catch (err) {
      console.warn('⚠ master_guru tidak terbaca:', err);
    }
  }

  // 2) FALLBACK DEMO (selalu jalan)
  return GURU_DEMO.find(function (g) {
    return String(g.peran || '').toLowerCase() === String(peran || '').toLowerCase() &&
           String(g.username || '').toLowerCase() === u &&
           String(g.password || '') === p;
  }) || null;
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

    if (!guru) {
      alert('Login gagal: peran / username / password tidak cocok.');
      return;
    }

    SESI.set('role', 'GURU');
    SESI.set('peran', guru.peran || peran);
    SESI.set('username', guru.username || guru.user || username);
    SESI.set('nama_guru', guru.nama || guru.nama_guru || guru.username || username);
    if (guru.kelas_id) SESI.set('kelas_id', guru.kelas_id);

    renderDashboard();
  });
}

/* ============================================================
   RENDER DASHBOARD — role-based routing
   ============================================================ */
function renderDashboard() {
  const role  = (SESI.get('role') || '').toUpperCase();
  const peran = (SESI.get('peran') || '').toLowerCase();

  const gate = $('#screen-gatekeeper');
  const dash = $('#screen-dashboard');
  if (gate) gate.classList.add('hidden');
  if (dash) dash.classList.remove('hidden');

  const isKoordinator = role === 'KOORDINATOR' || peran === 'koordinator';

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
    pilihTab('tab-quran');
  }

  // KERANGKA KHUSUS GURU QUR'AN — tampil hanya utk peran Guru Qur'an
  const peranUpper = String(peran || '').toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
  const isGuruQuran = peranUpper === 'GURU_QURAN';

  if (isGuruQuran) {
    renderDasborGuruQuran();
  } else {
    const alatGuruQuran = $('#perangkat-guru-quran');
    if (alatGuruQuran) alatGuruQuran.classList.add('hidden');
  }

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
   NAVIGASI TAB
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
   DASBOR KHUSUS GURU QUR'AN (di dalam Tab Al-Qur'an)
   ============================================================ */
const NILAI_QURAN = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];

function escapeHtml(teks) {
  return String(teks || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTanggal(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Peta id murid -> nama (dari master_murid)
async function petaNamaMurid() {
  const peta = {};
  if (!(await tungguSupabase())) return peta;
  try {
    const { data, error } = await db.from('master_murid').select('id, nama, nama_murid');
    if (!error && Array.isArray(data)) {
      data.forEach(function (m) {
        if (m.id !== undefined && m.id !== null) {
          peta[String(m.id)] = m.nama || m.nama_murid || '';
        }
      });
    }
  } catch (err) {
    console.warn('⚠ master_murid (nama) tidak terbaca:', err);
  }
  return peta;
}

// Buat satu kartu setoran
function buatKartuSetoran(setoran, petaNama) {
  const idSetoran = setoran.id || setoran.setoran_id;
  const mediaUrl  = setoran.media_url || setoran.url_media || setoran.link_media || setoran.link || '';
  const tgl       = setoran.tanggal || setoran.tanggal_setoran || setoran.created_at;

  const namaMurid =
    (setoran.murid_id ? petaNama[String(setoran.murid_id)] : '') ||
    setoran.nama_murid ||
    'Murid #' + (setoran.murid_id || '?');

  const kartu = document.createElement('div');
  kartu.className = 'setoran-card';

  // 1) Kepala kartu : nama murid & tanggal
  const kepala = document.createElement('div');
  kepala.className = 'setoran-card-head';
  kepala.innerHTML =
    '<span class="setoran-nama">' + escapeHtml(namaMurid) + '</span>' +
    '<span class="setoran-tanggal">' + escapeHtml(formatTanggal(tgl)) + '</span>';
  kartu.appendChild(kepala);

  // 2) Pemutar media (audio/video) sesuai jenis URL
  if (mediaUrl) {
    const isVideo = /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(mediaUrl);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    media.className = 'setoran-media';
    media.controls = true;
    media.preload = 'metadata';
    media.src = mediaUrl;
    kartu.appendChild(media);
  } else {
    const kosong = document.createElement('p');
    kosong.className = 'muted setoran-tanpa-media';
    kosong.textContent = '(tidak ada media setoran)';
    kartu.appendChild(kosong);
  }

  // 3) Dropdown penilaian ketat
  const nilaiWrap = document.createElement('div');
  nilaiWrap.className = 'setoran-nilai';
  const lbl = document.createElement('label');
  lbl.className = 'field-label';
  lbl.textContent = 'Penilaian';
  const select = document.createElement('select');
  select.className = 'select-nilai';
  select.appendChild(new Option('— Pilih nilai —', ''));
  NILAI_QURAN.forEach(function (n) {
    const op = new Option(n, n);
    if (setoran.nilai_huruf && String(setoran.nilai_huruf) === String(n)) op.selected = true;
    select.appendChild(op);
  });
  nilaiWrap.appendChild(lbl);
  nilaiWrap.appendChild(select);
  kartu.appendChild(nilaiWrap);

  // 4) Tombol Simpan Nilai -> UPDATE tabel setoran_quran
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-murid btn-glow btn-simpan-nilai';
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Nilai';
  btn.addEventListener('click', async function () {
    const nilai = select.value;
    if (!nilai) {
      alert('Silakan pilih nilai terlebih dahulu.');
      return;
    }
    const { error } = await db
      .from('setoran_quran')
      .update({ nilai_huruf: nilai })
      .eq('id', idSetoran);
    if (error) {
      console.warn('⚠ Gagal menyimpan nilai:', error);
      alert('Gagal menyimpan nilai. Coba lagi.');
      return;
    }
    alert('Nilai berhasil disimpan!');
    toast('Nilai ' + escapeHtml(namaMurid) + ' disimpan: ' + nilai, 'fa-check');
  });
  kartu.appendChild(btn);

  return kartu;
}

// Fungsi utama: tampilkan kerangka & render kartu setoran
async function renderDasborGuruQuran() {
  const alat = $('#perangkat-guru-quran');
  if (alat) alat.classList.remove('hidden');

  const list = $('#list-setoran-quran');
  if (!list) return;
  list.innerHTML = '';

  if (!(await tungguSupabase())) {
    list.innerHTML = '<p class="form-status err">Database setoran_quran tidak terhubung.</p>';
    return;
  }

  // Ambil data setoran (coba join nama murid; fallback peta manual)
  let data = [];
  try {
    const { data: baris, error } = await db.from('setoran_quran').select('*, master_murid(nama)');
    if (!error && Array.isArray(baris) && baris.length) {
      data = baris;
    } else {
      const ulang = await db.from('setoran_quran').select('*');
      data = (ulang.error || !Array.isArray(ulang.data)) ? [] : ulang.data;
    }
  } catch (err) {
    console.warn('⚠ setoran_quran tidak terbaca:', err);
  }

  if (!data.length) {
    list.innerHTML = '<p class="muted">Belum ada setoran hari ini. 🎧</p>';
    return;
  }

  const petaNama = await petaNamaMurid();

  data.forEach(function (setoran) {
    // Bila join berhasil, ambil nama dari hasil join
    if (!setoran.nama_murid && setoran.master_murid && setoran.master_murid.nama) {
      setoran.nama_murid = setoran.master_murid.nama;
    }
    list.appendChild(buatKartuSetoran(setoran, petaNama));
  });
}

/* ============================================================
   FORM TAUTAN GMEET WAFA / TALAQQI
   ============================================================ */
const formTautanGMeet = $('#form-tautan-gmeet');
if (formTautanGMeet) {
  formTautanGMeet.addEventListener('submit', (e) => {
    e.preventDefault();

    const input  = $('#tautan-gmeet');
    const status = $('#status-tautan');
    const tautan = (input ? input.value : '').trim();

    if (!tautan) {
      if (status) {
        status.textContent = 'Masukkan tautan GMeet terlebih dahulu.';
        status.className = 'form-status err';
        status.classList.remove('hidden');
      }
      return;
    }

    // Sementara: simpan & tampilkan; siap dihubungkan ke kolom tabel kapan pun.
    sessionStorage.setItem('tautan_gmeet_quran', tautan);
    if (status) {
      status.textContent = 'Tautan GMeet berhasil dipublikasikan!';
      status.className = 'form-status ok';
      status.classList.remove('hidden');
    }
    toast('Tautan GMeet dipublikasikan!', 'fa-paper-plane');
  });
}

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

    $('#panel-pilih-murid').classList.add('hidden');
    const pesan = $('#pesan-murid');
    if (pesan) { pesan.textContent = ''; pesan.className = 'form-status hidden'; }
    $('#sandi-kelas').value = '';
    $('#select-murid').selectedIndex = 0;

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