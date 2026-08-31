/* ============================================================
   RUANG KELAS ONLINE — script.js
   SPA sederhana (show/hide section) + data dummy
   ============================================================ */

/* ---------- Helper singkat ---------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- DATA DUMMY (tanpa database asli) ---------- */

// Daftar nama murid (dipakai di banyak tempat)
const daftarMurid = [
  { nama: 'Ahmad Fauzi',       kelas: 'Kelas 4A' },
  { nama: 'Siti Nurhaliza',    kelas: 'Kelas 4A' },
  { nama: 'Budi Santoso',      kelas: 'Kelas 4A' },
  { nama: 'Aisyah Putri',      kelas: 'Kelas 4A' },
  { nama: 'Rizky Ramadhan',    kelas: 'Kelas 4A' },
  { nama: 'Dewi Lestari',      kelas: 'Kelas 4A' },
];

// Checklist harian murid
const checklistItems = [
  { icon: 'fa-mosque',              label: 'Shalat Subuh berjamaah' },
  { icon: 'fa-book-quran',          label: "Muroja'ah Al-Qur'an 1 halaman" },
  { icon: 'fa-book-open',           label: 'Membaca buku/materi 20 menit' },
  { icon: 'fa-pen',                 label: 'Mengerjakan tugas dari guru' },
  { icon: 'fa-hand-holding-heart',  label: 'Membantu pekerjaan rumah' },
  { icon: 'fa-dumbbell',            label: 'Olahraga / menggerakkan badan' },
  { icon: 'fa-moon',                label: 'Istirahat & tidur yang cukup' },
];

// Galeri foto tugas (kurikulum wali kelas)
const tugasSiswa = [
  { nama: 'Ahmad Fauzi',    judul: 'Gambar Pemandangan Alam',   mapel: 'SBdP',         tgl: 'Senin, 20 Mei', status: 'Dikumpulkan', likes: 12, komentar: 3 },
  { nama: 'Siti Nurhaliza', judul: 'Bangun Datar dari Karton',  mapel: 'Matematika',   tgl: 'Senin, 20 Mei', status: 'Dikumpulkan', likes: 8,  komentar: 5 },
  { nama: 'Budi Santoso',   judul: 'Membuat Jam Dinding',       mapel: 'Matematika',   tgl: 'Senin, 20 Mei', status: 'Dikumpulkan', likes: 5,  komentar: 1 },
  { nama: 'Aisyah Putri',   judul: 'Kolase Daun Kering',        mapel: 'SBdP',         tgl: 'Selasa, 21 Mei', status: 'Mendekati',    likes: 15, komentar: 4 },
  { nama: 'Rizky Ramadhan', judul: 'Membuat Poster Hemat Air',  mapel: 'PPKn',         tgl: 'Selasa, 21 Mei', status: 'Dikumpulkan', likes: 6,  komentar: 2 },
  { nama: 'Dewi Lestari',   judul: 'Kerajinan dari Plastisin',  mapel: 'SBdP',         tgl: 'Rabu, 22 Mei',   status: 'Dikumpulkan', likes: 10, komentar: 6 },
];

// Checklist harian versi wali kelas (rekap siswa)
const checklistWali = [
  { nama: 'Ahmad Fauzi',    shalat: true,  murojaah: true,  tugas: true },
  { nama: 'Siti Nurhaliza', shalat: true,  murojaah: true,  tugas: true },
  { nama: 'Budi Santoso',   shalat: false, murojaah: true,  tugas: true },
  { nama: 'Aisyah Putri',   shalat: true,  murojaah: false, tugas: false },
  { nama: 'Rizky Ramadhan', shalat: true,  murojaah: true,  tugas: true },
  { nama: 'Dewi Lestari',   shalat: false, murojaah: false, tugas: true },
];

// Akun guru demo
const AKUN_GURU = { email: 'guru@sd.sch.id', password: '1234' };

/* ---------- State aplikasi ---------- */
let muridAktif = null;          // murid yang sedang login
let daftarNilai = {};           // { nama: { kelancaran, hafalan, wafa } }

/* ============================================================
   NAVIGASI SPA (show / hide section)
   ============================================================ */
const OFFSET_HEADER_PAGES = ['landing-page', 'login-guru'];

function showPage(id) {
  $$('.page').forEach((page) => {
    page.classList.toggle('hidden', page.id !== id);
  });

  // Header hanya tampil saat sudah "masuk"
  $('#app-header').classList.toggle('hidden', OFFSET_HEADER_PAGES.includes(id));

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Delegasi: semua elemen dengan atribut data-go berpindah halaman */
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-go]');
  if (trigger) showPage(trigger.dataset.go);
});

/* ============================================================
   HALAMAN 1 -> MASUK MURID (pilih nama, tanpa password)
   ============================================================ */
function openModalMurid() {
  renderListMurid();
  $('#modal-pilih-murid').classList.remove('hidden');
}

function closeModalMurid() {
  $('#modal-pilih-murid').classList.add('hidden');
}

function renderListMurid() {
  const list = $('#list-murid');
  list.innerHTML = '';
  daftarMurid.forEach((m) => {
    const li = document.createElement('li');
    const inisial = m.nama.split(' ').map(w => w[0]).join('').toUpperCase();
    li.innerHTML = `
      <span class="mini-avatar">${inisial}</span>
      <span class="kelas-badge">${m.kelas}</span>
      <span style="flex:1">${m.nama}</span>
      <i class="fa-solid fa-chevron-right" style="color:var(--biru-4);font-size:.8rem"></i>
    `;
    li.addEventListener('click', () => masukSebagaiMurid(m));
    list.appendChild(li);
  });
}

function masukSebagaiMurid(m) {
  muridAktif = m;
  closeModalMurid();
  showPage('dashboard-murid');

  // Isi profil
  $('#murid-nama').textContent = m.nama;
  $('#murid-kelas').textContent = `Kelas ${m.kelas.split(' ')[1]} — SDN Harapan 01`;
  const avatar = $('#murid-avatar');
  avatar.innerHTML = `<span style="font-size:.95rem;font-weight:800">${m.nama.split(' ').map(w => w[0]).join('').toUpperCase()}</span>`;
  $('#tanggal-today').textContent = '📅 ' + new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  renderChecklistMurid();
  toast(`Halo, ${m.nama}! Selamat belajar 🌟`);
}

$('#btn-role-murid').addEventListener('click', openModalMurid);
$('#btn-batal-murid').addEventListener('click', closeModalMurid);
$('#modal-pilih-murid').addEventListener('click', (e) => {
  if (e.target === $('#modal-pilih-murid')) closeModalMurid();
});

/* ============================================================
   DASHBOARD MURID — CHECKLIST HARIAN
   ============================================================ */
function renderChecklistMurid() {
  const ul = $('#checklist-murid');
  ul.innerHTML = '';

  checklistItems.forEach((item, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="check-box"><i class="fa-solid fa-check"></i></span>
      <span class="label"><i class="fa-solid ${item.icon}"></i>${item.label}</span>
    `;
    li.addEventListener('click', () => {
      li.classList.toggle('done');
      updateProgress();
    });
    ul.appendChild(li);
  });

  updateProgress();
}

function updateProgress() {
  const total = $$('#checklist-murid li').length;
  const done  = $$('#checklist-murid li.done').length;
  const persen = Math.round((done / total) * 100);

  $('#check-progress-text').textContent = `${done}/${total}`;
  $('#check-progress-bar').style.width = persen + '%';

  if (done === total) {
    toast('Alhamdulillah, checklist hari ini lengkap! 🎉', 'fa-star');
  }
}

/* ---------- Upload tugas (simulasi) ---------- */
$('#btn-upload-murid').addEventListener('click', () => $('#file-tugas').click());

$('#file-tugas').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    toast(`Tugas "${file.name}" berhasil diupload! 📤`, 'fa-cloud-arrow-up');
    e.target.value = '';
  }
});

/* ============================================================
   HALAMAN 2 -> LOGIN GURU (password)
   ============================================================ */
$('#toggle-pass').addEventListener('click', () => {
  const input = $('#password');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  $('#toggle-pass i').className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
});

$('#form-login-guru').addEventListener('submit', (e) => {
  e.preventDefault();
  const email    = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;

  if (email === AKUN_GURU.email && password === AKUN_GURU.password) {
    $('#login-error').classList.add('hidden');
    $('#email').value = '';
    $('#password').value = '';
    showPage('dashboard-guru');
    toast('Selamat datang, Ustadz Adam! 👋');
  } else {
    $('#login-error').classList.remove('hidden');
  }
});

/* ============================================================
   HALAMAN 5 -> BUKU NILAI GURU AL-QUR'AN
   ============================================================ */
function renderTabelNilai() {
  const tbody = $('#tbody-nilai');
  tbody.innerHTML = '';

  daftarMurid.forEach((m, i) => {
    const inisial = m.nama.split(' ').map(w => w[0]).join('').toUpperCase();
    const nilai = daftarNilai[m.nama] || {};

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <div class="cell-nama">
          <span class="mini-avatar">${inisial}</span>${m.nama}
        </div>
      </td>
      <td><input type="number" class="nilai-input" min="0" max="100"
                 placeholder="-" data-nama="${m.nama}" data-kolom="kelancaran"
                 value="${nilai.kelancaran ?? ''}"></td>
      <td><input type="number" class="nilai-input" min="0" max="100"
                 placeholder="-" data-nama="${m.nama}" data-kolom="hafalan"
                 value="${nilai.hafalan ?? ''}"></td>
      <td><input type="number" class="nilai-input" min="0" max="100"
                 placeholder="-" data-nama="${m.nama}" data-kolom="wafa"
                 value="${nilai.wafa ?? ''}"></td>
      <td>
        <button class="btn btn-small btn-primary btn-simpan-nilai" data-nama="${m.nama}">
          <i class="fa-solid fa-floppy-disk"></i> Simpan
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

    // Batasi angka input 0–100 supaya nilai tetap valid
  $$('#tbody-nilai .nilai-input').forEach((inp) => {
    inp.addEventListener('input', () => batasiNilai(inp));
  });
}

function batasiNilai(inp) {
  const v = parseInt(inp.value, 10);
  if (v < 0) inp.value = 0;
  if (v > 100) inp.value = 100;
}

function ambilNilaiRow(nama) {
  return {
    kelancaran: parseInt($(`input[data-nama="${CSS.escape(nama)}"][data-kolom="kelancaran"]`)?.value || 0, 10),
    hafalan:    parseInt($(`input[data-nama="${CSS.escape(nama)}"][data-kolom="hafalan"]`)?.value || 0, 10),
    wafa:       parseInt($(`input[data-nama="${CSS.escape(nama)}"][data-kolom="wafa"]`)?.value || 0, 10),
  };
}

function tandaiRowTersimpan(nama) {
  const btn = $(`.btn-simpan-nilai[data-nama="${CSS.escape(nama)}"]`);
  const tr  = btn?.closest('tr');
  if (!tr) return;
  tr.classList.add('saved-row');
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Tersimpan';
  btn.classList.add('btn-success');
  btn.classList.remove('btn-primary');
  setTimeout(() => {
    tr.classList.remove('saved-row');
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-primary');
  }, 1800);
}

// Simpan per baris
$('#tbody-nilai').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-simpan-nilai');
  if (!btn) return;
  const nama = btn.dataset.nama;
  daftarNilai[nama] = ambilNilaiRow(nama);
  tandaiRowTersimpan(nama);
  toast(`Nilai ${nama} disimpan ✅`);
});

// Simpan semua sekaligus
$('#btn-simpan-semua').addEventListener('click', () => {
  let kosong = 0;

  daftarMurid.forEach((m) => {
    const nilai = ambilNilaiRow(m.nama);
    if (!nilai.kelancaran && !nilai.hafalan && !nilai.wafa) kosong++;
    daftarNilai[m.nama] = nilai;
    tandaiRowTersimpan(m.nama);
  });

  if (kosong === daftarMurid.length) {
    toast('Belum ada nilai yang diisi.', 'fa-triangle-exclamation');
  } else {
    toast('Semua nilai berhasil disimpan! 💾');
  }
});

// Reset nilai
$('#btn-reset-nilai').addEventListener('click', () => {
  if (!confirm('Yakin ingin menghapus semua nilai?')) return;
  daftarNilai = {};
  renderTabelNilai();
  toast('Nilai di-reset ke awal.', 'fa-rotate-left');
});

/* ============================================================
   HALAMAN 6 -> WALI KELAS (tab galeri & checklist)
   ============================================================ */
function renderGaleriTugas() {
  const grid = $('#gallery-grid');
  grid.innerHTML = '';

  tugasSiswa.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
      <div class="photo">
        <span class="photo-icon"><i class="fa-solid fa-image"></i></span>
        <img src="https://picsum.photos/seed/tugas${i + 1}/400/300" alt="Foto tugas ${t.nama}" loading="lazy">
        <span class="status-pill ${t.status === 'Mendekati' ? 'mendekati' : ''}">${t.status}</span>
      </div>
      <div class="gallery-body">
        <div class="g-name">${t.nama}</div>
        <div class="g-title">${t.judul}</div>
        <div class="g-meta"><i class="fa-solid fa-book-bookmark"></i> ${t.mapel} &nbsp;•&nbsp; ${t.tgl}</div>
        <div class="gallery-actions">
          <button class="act btn-like" data-idx="${i}">
            <i class="fa-regular fa-thumbs-up"></i> <span>${t.likes}</span>
          </button>
          <button class="act">
            <i class="fa-regular fa-comment"></i> <span>${t.komentar}</span>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Suka / like (dummy)
$('#gallery-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-like');
  if (!btn) return;
  const idx = btn.dataset.idx;
  btn.classList.toggle('liked');
  const icon = btn.querySelector('i');
  const span = btn.querySelector('span');
  icon.className = btn.classList.contains('liked')
    ? 'fa-solid fa-thumbs-up'
    : 'fa-regular fa-thumbs-up';
  let n = parseInt(tugasSiswa[idx].likes, 10);
  n += btn.classList.contains('liked') ? 1 : -1;
  tugasSiswa[idx].likes = n;
  span.textContent = n;
});

// Tab: Galeri <-> Checklist
$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    const target = tab.dataset.tab;
    $('#panel-gallery').classList.toggle('hidden', target !== 'gallery');
    $('#panel-checklist').classList.toggle('hidden', target !== 'checklist');
  });
});

// Tabel checklist harian untuk wali kelas
function renderChecklistWali() {
  const tbody = $('#tbody-checklist-wali');
  tbody.innerHTML = '';

  checklistWali.forEach((c) => {
    const jumlah = [c.shalat, c.murojaah, c.tugas].filter(Boolean).length;
    const lengkap = jumlah === 3;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><b>${c.nama}</b></td>
      <td>${c.shalat  ? '<i class="fa-solid fa-circle-check icon-yes"></i>' : '<i class="fa-regular fa-circle icon-no"></i>'}</td>
      <td>${c.murojaah ? '<i class="fa-solid fa-circle-check icon-yes"></i>' : '<i class="fa-regular fa-circle icon-no"></i>'}</td>
      <td>${c.tugas    ? '<i class="fa-solid fa-circle-check icon-yes"></i>' : '<i class="fa-regular fa-circle icon-no"></i>'}</td>
      <td><span class="status-chip ${lengkap ? 'lengkap' : 'kurang'}">${lengkap ? 'Lengkap 🎉' : 'Belum lengkap'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ============================================================
   LOGOUT
   ============================================================ */
$('#btn-logout').addEventListener('click', () => {
  if (!confirm('Yakin ingin keluar?')) return;
  muridAktif = null;
  showPage('landing-page');
  toast('Kamu sudah keluar. Sampai jumpa! 👋', 'fa-right-from-bracket');
});

/* ============================================================
   TOAST (notifikasi kecil)
   ============================================================ */
function toast(msg, icon = 'fa-circle-check') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  $('#toast-area').appendChild(t);

  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 2400);
}

/* ============================================================
   INISIALISASI
   ============================================================ */
function init() {
  renderListMurid();
  renderTabelNilai();
  renderGaleriTugas();
  renderChecklistWali();
  showPage('landing-page');
}

document.addEventListener('DOMContentLoaded', init);