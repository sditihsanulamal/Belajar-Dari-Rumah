/* ============================================================
   RUANG KELAS ONLINE — script.js
   SPA sederhana (show/hide section) + data dummy
   ============================================================ */

/* ---------- Helper singkat ---------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- DATA DUMMY (tanpa database asli) ---------- */

// Daftar nama murid (digunakan untuk dropdown login murid)
const daftarNamaMurid = ['Ahmad', 'Budi', 'Siti', 'Zahra'];

// Data murid lengkap (dipakai tabel nilai, galeri, checklist, dll.)
const daftarMurid = daftarNamaMurid.map((nama) => ({ nama, kelas: 'Kelas 4A' }));

// Checklist harian murid
const checklistItems = [
  { icon: 'fa-mosque',              label: 'Shalat Subuh berjamaah' },
  { icon: 'fa-book-quran',          label: "Muroja'ah Al-Qur'an 1 halaman" },
  { icon: 'fa-book-open',           label: 'Membaca buku/materi 20 menit' },
  { icon: 'fa-pen',                 label: 'Mengerjakan tugas dari guru' },
  { icon: 'fa-hand-holding-heart',  label: 'Membantu pekerjaan rumah' },
    { icon: 'fa-dumbbell',            label: 'Olahraga / menggerakkan badan' },
    { icon: 'fa-sun',                 label: 'Sholat Dhuha berjamaah' },
    { icon: 'fa-hand-sparkles',       label: 'Life Skill: keterampilan harian' },
    { icon: 'fa-moon',                label: 'Istirahat & tidur yang cukup' },
  ];

// Catatan: galeri foto tugas kini dibaca dari studentTasks (localStorage)
// lihat fungsi renderGaleriTugas() di bagian Wali Kelas.

// Checklist harian versi wali kelas (rekap siswa)
const checklistWali = [
  { nama: 'Ahmad', shalat: true,  murojaah: true,  tugas: true },
  { nama: 'Budi',  shalat: false, murojaah: true,  tugas: true },
  { nama: 'Siti',  shalat: true,  murojaah: true,  tugas: true },
  { nama: 'Zahra', shalat: true,  murojaah: false, tugas: false },
];

// Akun guru demo (validasi hardcode sederhana)
const AKUN_GURU = { email: 'guru@sekolah.com', password: '123' };

/* ---------- State aplikasi (Fase 3: + localStorage) ---------- */
let muridAktif = null;          // nama murid yang sedang login (string)
let quranGrades = [];           // [{ nama, murajaah, hafalan, wafa }]
let studentTasks = [];          // [{ nama, kegiatan, fotoUrl, waktu }]

// Kunci penyimpanan di localStorage
const KUNCI_QURAN = 'quranGrades';
const KUNCI_TUGAS = 'studentTasks';

/* ---------- Helper baca/tulis localStorage (Fase 3: BARU) ---------- */
function bacaQuranGrades() {
  try { quranGrades = JSON.parse(localStorage.getItem(KUNCI_QURAN)) || []; }
  catch (err) { quranGrades = []; }
}
function tulisQuranGrades() {
  localStorage.setItem(KUNCI_QURAN, JSON.stringify(quranGrades));
}
function bacaStudentTasks() {
  try { studentTasks = JSON.parse(localStorage.getItem(KUNCI_TUGAS)) || []; }
  catch (err) { studentTasks = []; }
}
function tulisStudentTasks() {
  localStorage.setItem(KUNCI_TUGAS, JSON.stringify(studentTasks));
}

/* ============================================================
   NAVIGASI SPA (show / hide section)
   ============================================================ */
const OFFSET_HEADER_PAGES = ['landing-page', 'login-murid', 'login-guru'];

function showPage(id) {
  $$('.page').forEach((page) => {
    page.classList.toggle('hidden', page.id !== id);
  });

  // Header hanya tampil saat sudah "masuk"
  $('#app-header').classList.toggle('hidden', OFFSET_HEADER_PAGES.includes(id));

  // Fase 3: render ulang data saat dashboard tertentu dibuka
  if (id === 'dashboard-walikelas') renderGaleriTugas();   // baca studentTasks
  if (id === 'dashboard-quran')     renderTabelNilai();    // baca quranGrades

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Delegasi: semua elemen dengan atribut data-go berpindah halaman */
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-go]');
  if (trigger) showPage(trigger.dataset.go);
});

/* ============================================================
   HALAMAN 2A -> LOGIN MURID (dropdown nama, tanpa password)
   ============================================================ */
function isiDropdownMurid() {
  const select = $('#select-murid');
  select.innerHTML = '<option value="">— Pilih nama kamu —</option>';
  daftarNamaMurid.forEach((nama) => {
    const opt = document.createElement('option');
    opt.value = nama;
    opt.textContent = nama;
    select.appendChild(opt);
  });
}

function masukSebagaiMurid(nama) {
  // Simpan sesi ke localStorage (contoh: { role: 'student', name: 'Budi' })
  localStorage.setItem('session', JSON.stringify({ role: 'student', name: nama }));
  muridAktif = nama;

  // Sapaan di dashboard murid
  $('#sapaan-murid').textContent = `Selamat datang, ${nama}! 👋`;
  $('#murid-nama').textContent = nama;
  $('#murid-kelas').textContent = 'Kelas 4A — SDN Harapan 01';
  const avatar = $('#murid-avatar');
  avatar.innerHTML = `<span style="font-size:.95rem;font-weight:800">${nama[0].toUpperCase()}</span>`;
  $('#tanggal-today').textContent = '📅 ' + new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  renderChecklistMurid();
  showPage('dashboard-murid');
  toast(`Halo, ${nama}! Selamat belajar 🌟`);
}

// Submit form login murid
$('#form-login-murid').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = $('#select-murid').value;
  if (!nama) {
    toast('Pilih nama kamu dulu ya!', 'fa-triangle-exclamation');
    return;
  }
  masukSebagaiMurid(nama);
});

// Landing: tombol pilih peran
$('#btn-role-murid').addEventListener('click', () => showPage('login-murid'));
$('#btn-role-guru').addEventListener('click', () => showPage('login-guru'));

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
   FASE 3 (BARU): UPLOAD BUKTI KEGIATAN BERFOTO
   (Sholat Dhuha & Life Skill) -> studentTasks di localStorage
   ============================================================ */
// Label tampilan untuk masing-masing jenis kegiatan
const LABEL_KEGIATAN = {
  'sholat-dhuha': 'Sholat Dhuha',
  'life-skill':   'Life Skill',
};

// Delegasi: tombol "Upload Foto" -> memicu input file tersembunyi
$('#dashboard-murid').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-upload-foto');
  if (!btn) return;
  const key = btn.dataset.kegiatan;
  const input = document.querySelector(`.file-foto[data-kegiatan="${CSS.escape(key)}"]`);
  if (input) input.click();
});

// Delegasi: setelah murid memilih foto, tampilkan preview & simpan log
$('#dashboard-murid').addEventListener('change', (e) => {
  const input = e.target.closest('.file-foto');
  if (!input) return;

  const file = input.files[0];
  if (!file) return;

  const key = input.dataset.kegiatan;
  const previewUrl = URL.createObjectURL(file);   // URL pratinjau lokal (session)

  // Simpan log tugas (Nama Murid, Jenis Kegiatan, URL Pratinjau) ke localStorage
  studentTasks.push({
    nama: muridAktif || 'Murid',
    kegiatan: LABEL_KEGIATAN[key] || key,
    fotoUrl: previewUrl,
    waktu: new Date().toLocaleString('id-ID'),
  });
  tulisStudentTasks();

  // Tampilkan pratinjau kecil di layar murid
  const prev = $(`#preview-${key}`);
  if (prev) {
    prev.src = previewUrl;
    prev.classList.remove('hidden');
  }
  const status = $(`#status-${key}`);
  if (status) status.textContent = '✓ Berhasil diserahkan!';

  toast('Berhasil diserahkan! 📸', 'fa-circle-check');
  input.value = '';
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
      // Simpan sesi guru ke localStorage (contoh: { role: 'teacher' })
      localStorage.setItem('session', JSON.stringify({ role: 'teacher' }));
      $('#login-error').classList.add('hidden');
      $('#email').value = '';
      $('#password').value = '';
      showPage('dashboard-guru');
      toast('Selamat datang, Guru! 👋');
    } else {
      $('#login-error').classList.remove('hidden');
    }
  });

/* ============================================================
   HALAMAN 5 -> BUKU NILAI GURU AL-QUR'AN (FASE 3: BARU)
   Tabel dirender 100% dinamis via innerHTML, tanpa HTML statis.
   Data disimpan ke array quranGrades di localStorage.
   ============================================================ */
function renderTabelNilai() {
  const wrap = $('#wrap-tabel-nilai');
  if (!wrap) return;

  let rows = '';
  daftarMurid.forEach((m, i) => {
    const inisial = (m.nama[0] || '?').toUpperCase();
    const nilai = quranGrades.find((g) => g.nama === m.nama) || {};

    // Opsi dropdown Muraja'ah: bintang 1-5
    const opsiBintang = [1, 2, 3, 4, 5]
      .map((b) => `<option value="${b}" ${String(nilai.murajaah) === String(b) ? 'selected' : ''}>${'★'.repeat(b)}</option>`)
      .join('');

    rows += `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div class="cell-nama">
            <span class="mini-avatar">${inisial}</span>${m.nama}
          </div>
        </td>
        <td>
          <select class="form-select select-murajaah" data-nama="${m.nama}" data-kolom="murajaah">
            <option value="">—</option>
            ${opsiBintang}
          </select>
        </td>
        <td>
          <select class="form-select select-hafalan" data-nama="${m.nama}" data-kolom="hafalan">
            <option value="">—</option>
            <option value="Lulus" ${nilai.hafalan === 'Lulus' ? 'selected' : ''}>Lulus</option>
            <option value="Mengulang" ${nilai.hafalan === 'Mengulang' ? 'selected' : ''}>Mengulang</option>
          </select>
        </td>
        <td>
          <input type="text" class="form-input input-wafa" data-nama="${m.nama}" data-kolom="wafa"
                 placeholder="Hal. 14" value="${nilai.wafa ?? ''}">
        </td>
        <td>
          <button class="btn btn-small btn-primary btn-simpan-nilai" data-nama="${m.nama}">
            <i class="fa-solid fa-floppy-disk"></i> Simpan Nilai
          </button>
        </td>
      </tr>`;
  });

  wrap.innerHTML = `
    <table id="tabel-nilai">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama Murid</th>
          <th>Muraja'ah</th>
          <th>Hafalan</th>
          <th>Wafa</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Baca nilai satu baris dari input yang sedang tampil di layar
function ambilNilaiRow(nama) {
  return {
    murajaah: Number($(`.select-murajaah[data-nama="${CSS.escape(nama)}"]`)?.value || 0),
    hafalan:  $(`.select-hafalan[data-nama="${CSS.escape(nama)}"]`)?.value || '',
    wafa:     $(`.input-wafa[data-nama="${CSS.escape(nama)}"]`)?.value.trim() || '',
  };
}

// Efek visual: baris & tombol berubah hijau sesaat setelah tersimpan
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
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Nilai';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-primary');
  }, 1600);
}

// FASE 3 (BARU): simpan nilai per murid -> array quranGrades -> localStorage
// (delegasi lewat #wrap-tabel-nilai karena tbody dirender dinamis)
$('#wrap-tabel-nilai').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-simpan-nilai');
  if (!btn) return;

  const nama = btn.dataset.nama;
  let rec = quranGrades.find((g) => g.nama === nama);
  if (!rec) { rec = { nama }; quranGrades.push(rec); }
  Object.assign(rec, ambilNilaiRow(nama));

  tulisQuranGrades();          // tulis ulang ke localStorage
  tandaiRowTersimpan(nama);
  toast(`Nilai ${nama} berhasil disimpan! ✅`);
});

// Simpan semua sekaligus
$('#btn-simpan-semua').addEventListener('click', () => {
  let kosong = 0;

  daftarMurid.forEach((m) => {
    const n = ambilNilaiRow(m.nama);
    if (!n.murajaah && !n.hafalan && !n.wafa) { kosong++; return; }

    let rec = quranGrades.find((g) => g.nama === m.nama);
    if (!rec) { rec = { nama: m.nama }; quranGrades.push(rec); }
    Object.assign(rec, n);
  });

  tulisQuranGrades();
  renderTabelNilai();

  if (kosong === daftarMurid.length) {
    toast('Belum ada nilai yang diisi.', 'fa-triangle-exclamation');
  } else {
    toast('Semua nilai berhasil disimpan! 💾');
  }
});

// Reset semua nilai
$('#btn-reset-nilai').addEventListener('click', () => {
  if (!confirm('Yakin ingin menghapus semua nilai?')) return;
  quranGrades = [];
  tulisQuranGrades();
  renderTabelNilai();
  toast('Nilai di-reset ke awal.', 'fa-rotate-left');
});

/* ============================================================
   HALAMAN 6 -> WALI KELAS (Galeri Tugas dari studentTasks)
   ============================================================ */
// FASE 3 (BARU): galeri membaca array studentTasks dari localStorage
function renderGaleriTugas() {
  const grid = $('#gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Belum ada kiriman -> tampilkan pesan kosong
  if (!studentTasks.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>Belum ada bukti kegiatan yang diserahkan murid.</p>
        <span class="muted">Coba login sebagai murid lalu upload foto.</span>
      </div>`;
    return;
  }

  studentTasks.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
      <div class="photo">
        <span class="photo-icon"><i class="fa-solid fa-camera"></i></span>
        <img src="${t.fotoUrl}" alt="Bukti foto ${t.nama}" loading="lazy" onerror="this.remove()">
        <span class="status-pill">Diserahkan</span>
      </div>
      <div class="gallery-body">
        <div class="g-name">${t.nama || 'Murid'}</div>
        <div class="g-title"><i class="fa-solid fa-tag"></i> ${t.kegiatan || 'Kegiatan'}</div>
        <div class="g-meta"><i class="fa-regular fa-clock"></i> ${t.waktu || ''}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

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
  localStorage.clear();          // hapus sesi dari localStorage
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
   PENGECEKAN SESI (localStorage) SAAT HALAMAN DIMUAT
   ============================================================ */
function cekSession() {
  const raw = localStorage.getItem('session');

  // Tidak ada sesi -> kembali ke landing page
  if (!raw) {
    showPage('landing-page');
    return;
  }

  try {
    const sesi = JSON.parse(raw);

    // Role student -> langsung tampilkan dashboard murid
    if (sesi.role === 'student' && sesi.name) {
      masukSebagaiMurid(sesi.name);
      return;
    }

    // Role teacher -> langsung tampilkan dashboard guru (pilih modul)
    if (sesi.role === 'teacher') {
      showPage('dashboard-guru');
      return;
    }
  } catch (err) {
    // Data di localStorage rusak -> bersihkan dan kembali ke landing
  }

  localStorage.clear();
  showPage('landing-page');
}

/* ============================================================
   INISIALISASI
   ============================================================ */
function init() {
  // Fase 3: muat data persisten dari localStorage terlebih dahulu
  bacaQuranGrades();
  bacaStudentTasks();

  isiDropdownMurid();
  renderTabelNilai();
  renderGaleriTugas();
  renderChecklistWali();
  cekSession();   // periksa localStorage saat halaman dimuat
}

document.addEventListener('DOMContentLoaded', init);