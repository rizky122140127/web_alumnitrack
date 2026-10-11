# Dokumentasi Sistem Alumni Tracker

**Aplikasi:** Alumni Tracker SMAN 1 Talang Padang
**Tujuan:** Mengelola data alumni, tracer study, peluang karier, notifikasi WhatsApp, dan ringkasan data untuk evaluasi serta akreditasi.
**Status dokumentasi:** Disusun dari implementasi aplikasi saat ini. Fitur yang masih memerlukan layanan eksternal atau belum tersedia ditandai secara eksplisit.

## Daftar Isi

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Teknologi dan Struktur Aplikasi](#2-teknologi-dan-struktur-aplikasi)
3. [Akun, Login, dan Hak Akses](#3-akun-login-dan-hak-akses)
4. [Panduan Penggunaan Admin](#4-panduan-penggunaan-admin)
5. [Panduan Penggunaan Alumni](#5-panduan-penggunaan-alumni)
6. [API dan Alur Data](#6-api-dan-alur-data)
7. [Skema Database](#7-skema-database)
8. [Konfigurasi dan Menjalankan Aplikasi](#8-konfigurasi-dan-menjalankan-aplikasi)
9. [WhatsApp, Antrean, dan Penjadwalan](#9-whatsapp-antrean-dan-penjadwalan)
10. [Ekspor, Batasan, dan Catatan Operasional](#10-ekspor-batasan-dan-catatan-operasional)
11. [Pengujian dan Referensi Kode](#11-pengujian-dan-referensi-kode)

## 1. Ringkasan Sistem

Alumni Tracker adalah aplikasi web dengan frontend React/Vite dan backend Laravel API. Pengguna utama:

- **Admin:** mengelola alumni, admin lain, pertanyaan tracer study, moderasi karier, notifikasi, dan laporan.
- **Alumni:** mengisi atau memperbarui tracer study, memperbarui profil, mencari informasi peluang, dan mengirim posting karier untuk dimoderasi.

Data akun disimpan di `users`. Detail sekolah dan status studi/kerja alumni disimpan terpisah di `alumni_profiles`. Aplikasi tidak menyediakan akun, halaman, atau API untuk siswa yang belum lulus.

## 2. Teknologi dan Struktur Aplikasi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, Axios, Chart.js |
| Backend | PHP 8.3+, Laravel 13, Laravel Sanctum |
| OAuth Google | Laravel Socialite |
| Database bawaan lokal | SQLite |
| Antrean bawaan | Database queue Laravel |
| WhatsApp Gateway | Fonnte API |

Folder utama:

- `frontend/src/pages/`: halaman autentikasi, admin, dan alumni.
- `frontend/src/components/layout/`: layout, navbar, sidebar.
- `frontend/src/contexts/`: autentikasi dan notifikasi toast frontend.
- `backend/routes/api.php`: endpoint JSON aplikasi.
- `backend/routes/web.php`: callback OAuth Google.
- `backend/app/Http/Controllers/`: validasi request dan operasi API.
- `backend/app/Services/`: logika pengingat dan targeted push.
- `backend/app/Jobs/`: pengiriman WhatsApp melalui queue.
- `backend/app/Models/`: model dan relasi Eloquent.
- `backend/database/migrations/`: perubahan skema database.
- `backend/database/seeders/`: data demo dan instrumen tracer awal.

## 3. Akun, Login, dan Hak Akses

### 3.1 Halaman autentikasi

| Kebutuhan | URL frontend |
|---|---|
| Login umum/alumni | `/auth/login` |
| Login ringkas (tautan pengingat WA) | `/login` |
| Login admin khusus | `/auth/admin` |
| Registrasi | `/auth/register` |
| Callback hasil login Google | `/auth/google/callback` |

Login alumni menggunakan NISN dan password. Login admin menggunakan email atau nomor WhatsApp dan password.

### 3.2 Metode autentikasi

#### NISN dan password (alumni)

1. Frontend mengirim `nisn` dan `password` ke `POST /api/auth/login`.
2. Backend mencari akun alumni melalui NISN dan memeriksa hash bcrypt.
3. Alumni dengan approval `pending` atau `rejected` tidak memperoleh token.
4. Token baru dibuat menggunakan Sanctum. Token lama pada akun yang sama dicabut.
5. Frontend menyimpan token dan profil user di `localStorage`, lalu mengarahkan:
   - `admin` ke `/admin/dashboard`
   - alumni ke portal `/alumni/dashboard`

#### Admin

- Login admin tetap melalui `/auth/admin` dengan `login` berisi email atau nomor telepon dan password.
- Endpoint hanya mencari akun `admin` untuk kredensial admin.

WhatsApp hanya digunakan sebagai saluran notifikasi. Pesan pengingat tracer mengarahkan alumni ke halaman login resmi dan tidak memberikan akses autentikasi langsung.

#### Google OAuth

- Tombol Google mengarahkan browser ke backend `/auth/google/redirect`.
- Backend menerima callback di `/auth/google/callback`.
- Akun yang email Google-nya cocok dengan akun terdaftar dapat dipasangkan dengan `google_id`.
- Kode autentikasi acak sekali pakai disimpan sementara di cache, lalu frontend menukarnya di `POST /api/auth/google/exchange`. Token akses Sanctum tidak ditempatkan di URL.
- Akun Google baru dapat melanjutkan pendaftaran alumni dengan nomor WhatsApp, NISN, tahun lulus, dan status saat ini. Pendaftaran menunggu approval admin; NISN disimpan pada akun `users`.
- Login Google dari `/auth/admin` membawa intent admin. Akun Google non-admin atau Google yang belum ditautkan ke akun admin akan ditolak.
- Google OAuth **baru aktif setelah** Client ID, Client Secret, dan redirect URI di Google Cloud serta `.env` backend dikonfigurasi.

Konfigurasi yang diperlukan:

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

URI callback harus persis sama dengan URI yang didaftarkan pada OAuth Client Google. Untuk deployment, gunakan HTTPS dan domain resmi frontend/backend.
Di Google Cloud Console, buat OAuth Client bertipe **Web application**, siapkan consent screen, dan tambahkan callback persis sesuai `GOOGLE_REDIRECT_URI` (lokal: `http://localhost:8000/auth/google/callback`). Untuk origin browser lokal, izinkan `http://localhost:5173`. Isi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REDIRECT_URI` hanya di `backend/.env`, lalu jalankan `php artisan config:clear` dan mulai ulang backend. Pada deployment, gunakan URL HTTPS backend/frontend yang benar; daftar callback di Google harus identik dengan URL backend tersebut. Jangan memasukkan Client Secret ke frontend.

Sebelum kredensial Google diisi, tombol OAuth menampilkan pesan bahwa login belum dikonfigurasi; tes feature menggunakan provider Google tiruan untuk memverifikasi callback, registrasi alumni, pertukaran kode satu kali, dan penerbitan token API.

### 3.3 Role dan approval

| Role/status | Perilaku |
|---|---|
| `admin` | Dapat membuka semua halaman admin dan endpoint dalam middleware `EnsureIsAdmin`. |
| `alumni` + `approved` | Dapat masuk ke portal alumni; tampil pada direktori, analitik, dan pengingat tracer. |
| `alumni` + `pending` | Menunggu verifikasi. Login NISN/password serta Google login ditolak. |
| `alumni` + `rejected` | Login ditolak; token aktif dicabut saat admin menolak pendaftaran. |

Pendaftaran hanya untuk alumni yang telah lulus dan selalu menunggu approval admin. Role admin tidak dapat dipilih dari form publik; akun admin dibuat dari endpoint admin-only dan menu Pengelola Admin. Akun `siswa` lama, bila ada di database, dipertahankan sebagai data historis tetapi tidak dapat login atau mengakses API portal.

## 4. Panduan Penggunaan Admin

Setelah login admin, aplikasi membuka dashboard. Sidebar dapat disembunyikan atau ditampilkan menggunakan tombol navigasi di navbar.

| Halaman | Fungsi yang tersedia |
|---|---|
| `/admin/dashboard` | Ringkasan total alumni approved, response rate tracer, posting karier aktif, log WA terkirim, distribusi status, dan kampus populer. |
| `/admin/alumni` | Cari/filter alumni berdasarkan nama, NISN, telepon, kampus/perusahaan, tahun lulus, dan status. Aksi Profil dan Edit tersedia pada baris alumni. |
| `/admin/registrations` | Melihat antrean registrasi alumni serta menyetujui atau menolak pendaftar. |
| `/admin/tracer-questions` | Membuat, mengedit, menghapus, dan mengatur urutan pertanyaan tracer. |
| `/admin/rekap` | Melihat ringkasan tracer per tahun/status; dapat mengunduh CSV atau menggunakan cetak browser/Simpan sebagai PDF. |
| `/admin/career` | Meninjau postingan lowongan dan beasiswa pending, menyetujui/menolak, menghapus, serta membuat info resmi sekolah. Persetujuan dapat memicu targeted push WhatsApp. |
| `/admin/events` | Membuat dan memoderasi event sekolah/alumni, webinar, reuni, atau kegiatan mahasiswa. Admin menetapkan status akan datang/sudah berlangsung dan dapat mengunggah foto. Event tidak mengirim notifikasi WhatsApp. |
| `/admin/notifications` | Melihat statistik dan log notifikasi WhatsApp, memicu antrean pengingat tracer, serta mengirim broadcast dengan memilih satu atau beberapa status alumni. |
| `/admin/users` | Melihat daftar admin dan menambahkan akun admin baru dengan password. |

### 4.1 Menambahkan admin

1. Masuk melalui `/auth/admin`.
2. Pilih menu **Pengelola Admin**.
3. Klik **Tambah Admin**.
4. Isi nama, nomor WhatsApp, email (opsional), password minimal 8 karakter, dan konfirmasi.
5. Akun baru langsung memiliki role `admin`; kredensial harus disampaikan secara aman kepada pemilik akun.

### 4.2 Melihat/mengedit profil alumni

1. Buka **Direktori Alumni**.
2. Klik **Profil** untuk melihat identitas, kontak, NISN, tahun lulus, status, institusi, status WA, dan jawaban tracer.
3. Klik **Edit** atau **Edit data** untuk memperbarui identitas, kontak, data sekolah/karier, dan status notifikasi WA.
4. Simpan perubahan. Backend memvalidasi keunikan email, nomor telepon, dan NISN.

### 4.3 Moderasi dan approval alumni

- Registrasi alumni baru disimpan sebagai `pending`.
- Admin mengubah status ke `approved` atau `rejected`.
- Hanya alumni approved yang ditampilkan pada direktori operasional dan dihitung pada rekap tracer.
- Status approval lama diberi default `approved` melalui migrasi agar akun alumni lama tetap dapat digunakan.

## 5. Panduan Penggunaan Alumni

| Halaman | Fungsi yang tersedia |
|---|---|
| `/alumni/dashboard` | Ringkasan/beranda portal alumni. |
| `/alumni/tracer` | Mengisi, melihat, dan memperbarui jawaban tracer study. Indikator progres dihitung dari jumlah pertanyaan yang dijawab. |
| `/alumni/career` | Menjelajah lowongan dan beasiswa yang telah disetujui, mencari berdasarkan kategori, serta mengirim informasi karier untuk moderasi. |
| `/alumni/events` | Menjelajahi event yang telah berlangsung dan disetujui; alumni juga dapat mengirim event mahasiswa atau event umum untuk dimoderasi admin. |
| `/alumni/profile` | Memperbarui identitas, NISN, kontak, data profil pendidikan/pekerjaan, preferensi WA, dan password dengan verifikasi password saat ini. |

Menu lowongan dan event dipisahkan. `/admin/career` dan `/alumni/career` hanya menampilkan `magang`, `full_time`, `part_time`, `beasiswa`; `/admin/events` dan `/alumni/events` hanya menampilkan `event_mahasiswa`, `event_umum`. Event berstatus `upcoming` yang sudah disetujui hanya ditampilkan di dashboard alumni. Event berstatus `completed` yang sudah disetujui ditampilkan di `/alumni/events` dan pratinjau publik sebelum login. Admin memilih status event saat membuat posting resmi dan dapat mengubah fasenya kemudian, misalnya setelah agenda selesai. Postingan alumni dibuat dengan status `pending` dan default status fase `upcoming`; posting admin langsung `approved`. Admin dapat mengunggah foto event (maksimal 5 MB), yang disimpan pada disk `public`. Pastikan `php artisan storage:link` sudah dijalankan agar foto dapat diakses melalui web. Event tidak membuat notifikasi WA saat dipublikasikan atau disetujui.

Tipe pertanyaan tracer: `text`, `radio`, `checkbox`, `scale`. Pertanyaan berstatus wajib diperiksa frontend sebelum submit. Jawaban lama dapat diperbarui karena penyimpanan menggunakan pasangan unik user dan pertanyaan.

## 6. API dan Alur Data

Semua endpoint JSON memiliki prefix `/api`. Endpoint yang memerlukan akun memakai Sanctum; endpoint admin dilindungi middleware `EnsureIsAdmin`.

### 6.1 Publik dan autentikasi

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/auth/register` | Publik | Registrasi alumni yang telah lulus; menunggu approval admin. Field `role` tidak diterima. |
| POST | `/api/auth/login` | Publik | Login alumni dengan `nisn` + password; akun admin memakai `login` + password (email/telepon). |
| POST | `/api/auth/google/exchange` | Publik + kode sekali pakai | Menukar kode Google menjadi sesi Sanctum. |
| POST | `/api/auth/google/register` | Publik + kode registrasi | Menyelesaikan pendaftaran alumni dari Google. |
| GET | `/auth/google/redirect` | Browser | Memulai redirect OAuth. Mendukung query `intent=admin`. |
| GET | `/auth/google/callback` | Browser/provider | Callback Google OAuth. |

### 6.2 Akun terautentikasi

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/profile` | Profil user saat ini. |
| PUT | `/api/profile` | Memperbarui data profil sendiri. |
| POST | `/api/auth/logout` | Mencabut token saat ini. |
| GET | `/api/tracer-questions` | Daftar pertanyaan tracer terurut. |
| GET | `/api/tracer-questions/{id}` | Detail pertanyaan. |
| POST | `/api/tracer-answers` | Membuat/memperbarui jawaban tracer. |
| GET | `/api/tracer-answers/my` | Jawaban user saat ini. |
| GET | `/api/career-posts` | Daftar posting. Alumni hanya melihat approved; admin dapat memfilter status. |
| GET | `/api/career-posts/{id}` | Detail posting. |
| POST | `/api/career-posts` | Mengirim posting baru. Alumni pending approval, admin auto-approve. |

### 6.3 Khusus admin

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/alumni` | Daftar alumni approved dengan pencarian/filter/paginasi. |
| GET | `/api/alumni/{user}` | Profil lengkap alumni dan jawaban tracer. |
| PUT | `/api/alumni/{user}` | Memperbarui data alumni dan preferensi WA. |
| GET/POST | `/api/admin-users` | Daftar admin / membuat akun admin. |
| GET | `/api/alumni-registrations` | Antrean pendaftaran; query `status` dapat berupa pending/approved/rejected/all. |
| PATCH | `/api/alumni-registrations/{user}` | Menyetujui/menolak pendaftar alumni. |
| POST/PUT/DELETE | `/api/tracer-questions` dan `/api/tracer-questions/{id}` | CRUD pertanyaan. |
| PUT/DELETE | `/api/career-posts/{id}` | Moderasi/edit/hapus posting. |
| GET | `/api/tracer-answers/recap` | Agregat distribusi, response rate, dan kampus teratas. |
| GET | `/api/wa-notifications` | Log WA dengan filter status/tipe dan paginasi. |
| GET | `/api/wa-notifications/stats` | Statistik queued/sent/failed. |
| POST | `/api/wa-notifications/send-tracer-reminders` | Memasukkan pengingat tracer ke antrean. |
| POST | `/api/wa-notifications/send-targeted` | Mengantrekan pesan admin kepada alumni aktif WA yang approved dengan status terpilih (`statuses[]`, `message`). |

## 7. Skema Database

Tabel aplikasi dikelola melalui migrasi di `backend/database/migrations`. Skema default lokal menggunakan SQLite. `id` adalah primary key kecuali disebut lain; tabel aplikasi utama umumnya memiliki `created_at` dan `updated_at`.

Enam tabel domain utama adalah `users`, `alumni_profiles`, `tracer_questions`, `tracer_answers`, `career_posts`, dan `wa_notifications`. Tabel bawaan Laravel/Sanctum/queue/cache tetap diperlukan dan tidak termasuk hitungan enam tabel domain.

### 7.1 Diagram relasi

```text
users 1 ─── 0..1 alumni_profiles
users 1 ─── * tracer_answers * ─── 1 tracer_questions
users 1 ─── * career_posts (author_id)
users 1 ─── * wa_notifications
career_posts 1 ─── 0..* wa_notifications

Laravel/Sanctum:
users polymorphic 1 ─── * personal_access_tokens
```

Penghapusan user menghapus profil, jawaban tracer, posting karier, dan notifikasi terkait sesuai foreign key `cascade`. Penghapusan posting karier mengosongkan `career_post_id` notifikasi (`set null`).

### 7.2 Tabel domain

#### `users`

| Kolom | Tipe/aturan | Keterangan |
|---|---|---|
| `id` | bigint, PK | ID user. |
| `name` | string | Nama lengkap. |
| `email` | string nullable, unique | Email login/kontak. |
| `phone_number` | string, unique | Nomor WhatsApp; dipakai sebagai alternatif identitas login. |
| `nisn` | string(10), nullable unique/index | Kredensial username alumni; kosong untuk admin. |
| `password` | string | Password bcrypt; OAuth menetapkan hash acak untuk akun yang tidak memakai login password. |
| `role` | enum pada skema historis `admin`, `alumni`, `siswa`; default `alumni` | Aplikasi hanya membuat dan menerima role admin/alumni; `siswa` merupakan nilai legacy yang diblokir. |
| `alumni_approval_status` | string(20), index, default `approved` | Approval alumni: `pending`, `approved`, `rejected`. |
| `google_id` | string nullable, unique | ID akun Google yang dihubungkan. |
| `is_wa_active` | boolean, default true | Persetujuan menerima notifikasi WhatsApp. |
| `email_verified_at` | timestamp nullable | Waktu email terverifikasi (mis. melalui Google). |
| `remember_token` | string nullable | Kolom Laravel. |
| `created_at`, `updated_at` | timestamp | Waktu pembuatan/perubahan. |

#### `alumni_profiles`

| Kolom | Tipe/aturan | Keterangan |
|---|---|---|
| `id` | bigint, PK | ID profil. |
| `user_id` | FK ke `users.id`, unique, cascade, relasi satu-ke-satu | User pemilik data. |
| `graduation_year` | year | Tahun lulus. |
| `current_status` | enum `mahasiswa`, `gap_year`, `bekerja`, `wirausaha`, `belum_kerja`; default `belum_kerja` | Status saat ini. |
| `campus_name` | string nullable | Nama perguruan tinggi. |
| `major_name` | string nullable | Jurusan/program studi. |
| `company_name` | string nullable | Perusahaan/instansi. |
| `job_title` | string nullable | Jabatan/posisi. |
| `created_at`, `updated_at` | timestamp | Waktu pembuatan/perubahan. |

Tabel profil menyimpan data alumni saja.

#### `tracer_questions`

`id`; `question_text` text; `question_type` enum (`text`, `radio`, `checkbox`, `scale`); `options` JSON nullable; `is_required` boolean default true; `order_number` integer; timestamps.

#### `tracer_answers`

`id`; `user_id` FK cascade; `question_id` FK ke `tracer_questions` cascade; `answer_value` text; `submitted_at` timestamp nullable; timestamps. Ada unique constraint (`user_id`, `question_id`), sehingga satu user memiliki satu jawaban terkini per pertanyaan.

#### `career_posts`

`id`; `author_id` FK ke `users` cascade; `title` string; `category` enum (`magang`, `full_time`, `part_time`, `beasiswa`, `event_mahasiswa`, `event_umum`); `event_phase` enum nullable (`upcoming`, `completed`, hanya event); `company_or_institution` string; `description` text; `registration_link` string nullable; `event_image_path` string nullable; `status` enum (`pending`, `approved`, `rejected`) default `pending`; timestamps.

#### `wa_notifications`

`id`; `user_id` FK ke `users` cascade; `career_post_id` FK nullable ke `career_posts` (`set null` saat posting dihapus); `notification_type` enum (`reminder_tracer`, `targeted_push`); `message_content` text; `status` enum (`queued`, `sent`, `failed`) default `queued`; `sent_at` timestamp nullable; timestamps.

### 7.3 Tabel Laravel/infrastruktur

| Tabel | Fungsi |
|---|---|
| `personal_access_tokens` | Token API Sanctum (`tokenable_type/id`, nama, hash token, abilities, tanggal pemakaian/expired). |
| `password_reset_tokens` | Penyimpanan token reset password standar Laravel. |
| `sessions` | Penyimpanan sesi Laravel; pemakaian tergantung `SESSION_DRIVER`. |
| `cache`, `cache_locks` | Cache dan lock Laravel; antara lain dipakai untuk kode sementara Google OAuth. |
| `jobs` | Antrean job database. |
| `job_batches` | Metadata batch queue. |
| `failed_jobs` | Job yang gagal setelah percobaan ulang. |
| `migrations` | Riwayat migrasi skema Laravel. |

### 7.4 Konsistensi data yang perlu dijaga

- Email, nomor WhatsApp, Google ID, NISN harus unik sesuai constraint. NISN wajib untuk alumni dan nullable pada admin.
- Approval di `users` menentukan apakah alumni dapat login dan masuk direktori operasional.
- `tracer_answers` bergantung pada pertanyaan yang ada; penghapusan pertanyaan menghapus jawaban terkait karena foreign key cascade.
- Gunakan migrasi untuk mengubah skema; jangan mengubah database produksi secara manual.

## 8. Konfigurasi dan Menjalankan Aplikasi

### 8.1 Prasyarat

- PHP 8.3 atau yang lebih baru sesuai Composer.
- Composer.
- Node.js/npm yang sesuai dengan Vite proyek.
- SQLite untuk konfigurasi lokal default.

### 8.2 Backend

```powershell
Set-Location backend
Copy-Item .env.example .env
composer install
php artisan key:generate
if (!(Test-Path database/database.sqlite)) { New-Item -ItemType File database/database.sqlite }
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Jika file SQLite sudah tersedia, jangan menimpanya. Untuk data baru gunakan migrasi/seed sesuai kebutuhan; `migrate:fresh --seed` menghapus semua tabel/data dan hanya boleh dipakai pada database lokal yang memang boleh direset.

### 8.3 Frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Frontend berjalan default di `http://127.0.0.1:5173`. Proxy Vite meneruskan `/api` dan `/auth/google` ke backend `http://127.0.0.1:8000`.

Untuk produksi:

```powershell
npm run build
```

Konfigurasi environment frontend opsional:

- `VITE_API_URL`: base API (umumnya diakhiri `/api`).
- `VITE_BACKEND_URL`: root backend untuk memulai OAuth jika backend berbeda origin. Jika tidak disetel, URL OAuth mengikuti origin frontend dan konfigurasi proxy/server.

### 8.4 Variabel environment penting

| Variabel | Fungsi/default |
|---|---|
| `APP_URL` | URL backend Laravel. |
| `FRONTEND_URL` | URL frontend untuk redirect/cetak tautan; default lokal `http://localhost:5173`. |
| `DB_CONNECTION`, `DB_DATABASE` | Driver dan lokasi database; template menggunakan SQLite. |
| `QUEUE_CONNECTION` | Driver antrean; template menggunakan `database`. |
| `CACHE_STORE` | Driver cache; template menggunakan database. |
| `FONNTE_API_TOKEN` | Token gateway WhatsApp. Jangan commit nilainya. |
| `GOOGLE_CLIENT_ID` | OAuth Client ID Google. |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret Google. Jangan commit nilainya. |
| `GOOGLE_REDIRECT_URI` | Callback OAuth; default `${APP_URL}/auth/google/callback`. |
| `VITE_API_URL` / `VITE_BACKEND_URL` | URL frontend menuju API/backend. |

Simpan nilai rahasia di `.env` yang tidak dimasukkan ke version control atau di secret manager lingkungan deployment. Jangan menyalin kredensial produksi ke dokumentasi, issue, atau log.

## 9. WhatsApp, Antrean, dan Penjadwalan

### 9.1 Pengingat tracer

Service pengingat memilih user dengan role `alumni`, status approval `approved`, `is_wa_active=true`, dan belum mempunyai jawaban tracer. Per user:

1. Dirangkai pesan standar dengan tautan login resmi `https://alumni.sman1talangpadang.sch.id/login`.
2. Dibuat record `wa_notifications` bertipe `reminder_tracer`, status `queued`.
3. Job pengiriman WhatsApp masuk antrean.

Pengingat manual tersedia di halaman WA Gateway Log. Perintah:

```powershell
php artisan alumni:send-tracer-reminders
```

Perintah dijadwalkan mingguan pada Senin pukul 08:00 di zona waktu server. Untuk jadwal aktif, deployment perlu menjalankan Laravel scheduler secara berkala (misalnya cron/Task Scheduler yang menjalankan `php artisan schedule:run` setiap menit).

### 9.2 Targeted push karier

Saat posting berubah menjadi approved, penerima dipilih berdasarkan kategori:

| Kategori | Status alumni sasaran |
|---|---|
| `magang` | Mahasiswa, gap year, belum bekerja |
| `full_time` | Belum bekerja, gap year |
| `part_time` | Mahasiswa, belum bekerja, gap year |
| `beasiswa` | Semua alumni approved dengan WA aktif |

Event (`event_mahasiswa`, `event_umum`) tidak memicu pengiriman WhatsApp. Event approved dengan fase `upcoming` hanya ditampilkan di dashboard alumni; fase `completed` tampil di halaman event alumni dan daftar publik sebelum login.

Setiap pesan dicatat di `wa_notifications` dan dikirim melalui `SendWaNotificationJob`. Job mencoba maksimal 3 kali dengan backoff 60 detik. Hasil akhirnya menandai notifikasi `sent` atau `failed`.

### 9.3 Worker dan integrasi Fonnte

Jalankan worker pada proses terpisah ketika menggunakan `QUEUE_CONNECTION=database`:

```powershell
php artisan queue:work
```

`FONNTE_API_TOKEN` kosong menyebabkan pesan tidak benar-benar dikirim; service mencatat peringatan dan status menjadi failed. Pastikan nomor memakai format internasional yang diterima provider (contoh `62812...`) dan perangkat/gateway Fonnte siap.

## 10. Ekspor, Batasan, dan Catatan Operasional

- Ekspor rekap saat ini tersedia sebagai **CSV**.
- Tombol Cetak/PDF memakai dialog print browser (misalnya pilih “Save as PDF”); tidak ada generator file PDF khusus backend yang teridentifikasi.
- Tidak ada ekspor Excel `.xlsx` khusus yang teridentifikasi; CSV dapat dibuka dengan spreadsheet seperti Excel.
- Pengiriman WhatsApp otomatis memerlukan token Fonnte, worker antrean aktif, dan koneksi provider.
- Google OAuth memerlukan kredensial dan konfigurasi domain/redirect yang valid.
- Akun seed admin untuk pengembangan saat ini dibuat dengan nomor `6281234567890`; password seed `admin123`. Seeder alumni demo menggunakan NISN `0012345001`–`0012345010` dan password `alumni123`. Kredensial ini hanya untuk database lokal/demo: segera ganti atau jangan gunakan akun seed tersebut di produksi.
- Data pengguna, kontak, NISN, jawaban tracer, dan token autentikasi bersifat sensitif. Batasi akses admin, gunakan HTTPS, lindungi backup, jangan menampilkan token di log, serta tetapkan kebijakan retensi data.
- Broadcast karier dan pengingat adalah pekerjaan asynchronous dalam konfigurasi default. Status queued bukan bukti pesan sudah diterima pengguna; pantau status sent/failed dan dashboard provider.
- Implementasi targeted push saat ini mengambil user dengan role alumni dan WA aktif; berbeda dari pengingat tracer yang juga membatasi `alumni_approval_status=approved`. Tinjau/selaraskan filter approval sebelum dipakai di lingkungan produksi.
- Pengisian survei menyimpan string `answer_value`; checkbox di frontend digabungkan menjadi string dipisah koma. Jika format analitik lebih kompleks dibutuhkan, pertimbangkan normalisasi format jawaban dan migrasi yang sesuai.
- Response rate dashboard dihitung dari alumni approved yang memiliki setidaknya satu jawaban tracer; angka ini tidak menjamin semua pertanyaan wajib telah terisi.
- Build frontend pernah menampilkan peringatan ukuran bundle JavaScript lebih dari 500 KB (build tetap sukses); pertimbangkan code splitting bila waktu muat menjadi masalah.

## 11. Pengujian dan Referensi Kode

Jalankan tes backend:

```powershell
Set-Location backend
php artisan test
```

Jalankan build frontend:

```powershell
Set-Location frontend
npm run build
```

Tes feature mencakup approval alumni, penolakan akses role siswa legacy, antrean pengingat, Google OAuth, admin, dan pengelolaan profil alumni. Jumlah tes dapat bertambah/berubah seiring perubahan proyek.

Referensi implementasi:

- [Frontend routes](./frontend/src/App.jsx)
- [Frontend login](./frontend/src/pages/auth/LoginPage.jsx)
- [Registrasi alumni](./frontend/src/pages/auth/RegisterPage.jsx)
- [Login Google callback](./frontend/src/pages/auth/GoogleAuthCallbackPage.jsx)
- [Frontend auth context](./frontend/src/contexts/AuthContext.jsx)
- [API routes](./backend/routes/api.php)
- [Web/OAuth routes](./backend/routes/web.php)
- [Auth controller](./backend/app/Http/Controllers/Auth/AuthController.php)
- [Google auth controller](./backend/app/Http/Controllers/Auth/GoogleAuthController.php)
- [Alumni controller](./backend/app/Http/Controllers/AlumniController.php)
- [Admin user controller](./backend/app/Http/Controllers/AdminUserController.php)
- [Tracer reminder service](./backend/app/Services/TracerReminderService.php)
- [Targeted push service](./backend/app/Services/TargetedPushService.php)
- [WhatsApp job](./backend/app/Jobs/SendWaNotificationJob.php)
- [Migration directory](./backend/database/migrations/)
