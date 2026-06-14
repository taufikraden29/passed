# Product Requirement Document (PRD)
## Aplikasi Pencatatan Akun Penting (SecurePass / PassKeep)

| Status | Draft |
| :--- | :--- |
| **Author** | Developer / Antigravity |
| **Tanggal** | 14 Juni 2026 |
| **Versi** | 1.0.0 |

---

## 1. Ringkasan Produk (Product Overview)
Aplikasi Pencatatan Akun Penting adalah aplikasi pengelola kredensial (Password Manager) berbasis web lokal-pertama (local-first) yang dirancang untuk menyimpan, mengelola, dan mengamankan informasi akun penting pengguna (seperti username, email, password, URL, dan catatan rahasia). 

Aplikasi ini berfokus pada **keamanan tinggi**, **privasi penuh (Zero-Knowledge)**, dan **pengalaman pengguna (UX) yang sangat mulus dan modern** dengan desain visual premium.

---

## 2. Tujuan & Sasaran (Objectives & Goals)
- **Keamanan Tanpa Kompromi**: Mengamankan data kredensial langsung pada perangkat pengguna menggunakan enkripsi standar industri (AES-GCM 256-bit).
- **Kemudahan Akses**: Memudahkan pengguna mencari, menyalin (copy), dan mengorganisasi ratusan akun dengan cepat.
- **Desain Premium**: Menyajikan antarmuka visual yang menakjubkan (clean, modern, dark mode, glassmorphism) dan responsif.
- **Kemandirian Data**: Pengguna memiliki kontrol penuh atas data mereka dengan fitur ekspor/impor terenkripsi.

---

## 3. Alur Pengguna (User Persona & Flow)
### Persona Pengguna:
- Pengguna yang memiliki banyak akun online dan ingin berhenti menggunakan password yang sama atau mencatatnya di buku catatan fisik/notepad yang tidak aman.
- Pengguna yang peduli dengan privasi dan tidak ingin data password mereka disimpan di server cloud pihak ketiga tanpa enkripsi end-to-end.

### Alur Utama Pengguna (User Journey):
1. **Registrasi/Inisialisasi Master Password**: Pengguna membuka aplikasi pertama kali dan membuat *Master Password* yang kuat.
2. **Halaman Kunci (Unlock Screen)**: Setiap kali aplikasi dibuka kembali, pengguna harus memasukkan *Master Password* untuk mendekripsi data.
3. **Dashboard Utama**: 
   - Melihat daftar akun yang tersimpan dalam format grid/list interaktif.
   - Menyalin username/password dengan sekali klik tanpa menampilkan password secara eksplisit.
4. **Tambah/Edit Akun**: Form untuk memasukkan nama layanan, kategori, username, password, URL, dan catatan tambahan. Fitur *Password Generator* terintegrasi.
5. **Manajemen Kategori & Pencarian**: Filter cepat berdasarkan kategori (Finansial, Media Sosial, Pekerjaan, dll.) atau pencarian teks instan.

---

## 4. Spesifikasi Fungsional (Functional Requirements)

### FR-1: Sistem Enkripsi & Master Password (Zero-Knowledge)
- Aplikasi harus menggunakan *Web Crypto API* di browser untuk melakukan enkripsi dan dekripsi.
- Kunci enkripsi diturunkan dari *Master Password* menggunakan algoritma derivasi kunci **PBKDF2** (dengan iterasi minimal 100.000 dan salt unik).
- Data akun dienkripsi menggunakan **AES-GCM (256-bit)** sebelum disimpan ke penyimpanan lokal (`localStorage` atau `IndexedDB`).
- **PENTING**: Master password tidak boleh disimpan di mana pun dalam bentuk teks biasa (plain text).

### FR-2: Manajemen Kredensial (Create, Read, Update, Delete)
- **Tambah Akun**: Kolom input meliputi Judul Akun, Kategori, Username/Email, Password, Website URL, dan Catatan Penting.
- **Lihat Akun**: Detail akun ditampilkan secara aman (password disembunyikan secara default dengan tombol toggle mata untuk melihat).
- **Salin Cepat (Quick Copy)**: Tombol satu klik untuk menyalin username atau password ke clipboard dengan feedback visual (micro-interaction).
- **Edit & Hapus**: Kemampuan untuk memperbarui informasi akun atau menghapusnya secara permanen.

### FR-3: Password Generator (Pembangkit Sandi)
- Fitur untuk membuat password acak yang kuat dengan opsi panjang karakter (8 - 64 karakter) dan pilihan tipe karakter (huruf besar, huruf kecil, angka, simbol).

### FR-4: Manajemen Data (Ekspor & Impor)
- **Ekspor Data**: Mengunduh seluruh data dalam bentuk file JSON terenkripsi (membutuhkan password saat ini) atau CSV (plain text - dengan peringatan keamanan yang jelas).
- **Impor Data**: Mengunggah kembali file cadangan JSON terenkripsi/CSV untuk memulihkan data akun.

### FR-5: Auto-Lock & Pengatur Waktu Keamanan
- Aplikasi akan otomatis terkunci kembali setelah periode tidak aktif (inactivity timeout) tertentu (misalnya, 5 menit) untuk melindungi data jika perangkat ditinggalkan.

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### NFR-1: Keamanan & Privasi
- **Lokal-Pertama**: Semua proses enkripsi, dekripsi, dan penyimpanan data terjadi 100% secara lokal di browser klien. Tidak ada data sensitif yang dikirim ke server luar.
- **Proteksi Clipboard**: Menyediakan opsi untuk membersihkan clipboard secara otomatis beberapa detik setelah menyalin password.

### NFR-2: Desain Visual & UI/UX (Aesthetics)
- **Skema Warna**: Palet warna gelap modern (deep dark/slate blue) dipadukan dengan aksen neon/cyan untuk nuansa futuristik namun elegan.
- **Glassmorphism**: Menggunakan efek blur latar belakang (`backdrop-filter: blur`) pada kartu-kartu dashboard dan modal.
- **Tipografi**: Menggunakan font sans-serif modern (seperti Inter atau Outfit via Google Fonts).
- **Responsif**: Bekerja dengan sempurna baik di perangkat desktop maupun mobile.

### NFR-3: Kinerja (Performance)
- Dekripsi data saat login harus cepat (kurang dari 1 detik) meskipun data akun yang disimpan mencapai ratusan.

---

## 6. Rencana Teknologi & Arsitektur
- **Frontend**: Single Page Application (SPA) menggunakan HTML5, Vanilla CSS (Custom Properties), dan Vanilla Javascript (ES6+).
- **Penyimpanan**: `localStorage` atau `IndexedDB` untuk persistensi data terenkripsi pada browser.
- **Library Keamanan**: Menggunakan Web Crypto API bawaan browser modern (tanpa library eksternal untuk menjamin keamanan kode dari serangan supply chain).

---

## 7. Rencana Rilis & Fase Pengembangan
- **Fase 1 (MVP)**:
  - Setup struktur HTML/CSS dengan desain premium.
  - Implementasi Master Password dan Web Crypto API (Enkripsi/Dekripsi).
  - CRUD Akun di local storage.
  - Fitur pencarian dan copy.
- **Fase 2**:
  - Integrasi Password Generator.
  - Fitur Auto-Lock.
  - Kategori kustom dan ikon untuk setiap akun.
- **Fase 3**:
  - Fitur ekspor/impor terenkripsi.
  - Dukungan multi-bahasa dan statistik keamanan password.
