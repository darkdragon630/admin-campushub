# CampusHub Admin Dashboard

> Sistem manajemen kampus berbasis web dan mobile untuk pengelolaan mahasiswa, forum diskusi, dan pengumuman kampus secara modern menggunakan Supabase sebagai backend cloud database.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Struktur Folder](#struktur-folder)
- [Skema Database](#skema-database)
- [Sistem Keamanan](#sistem-keamanan)
- [Alur Navigasi](#alur-navigasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Changelog](#changelog)

---

## Fitur Utama

### Admin Web
| Fitur | Deskripsi |
|---|---|
| Register Admin | Buat akun admin pertama dengan validasi + enkripsi password SHA-256 |
| Login Admin | Autentikasi dengan validasi input + loading state + Enter key support |
| Session 24 Jam | Sesi divalidasi via kolom `ssid` + `expired_at` di DB, bukan client-side |
| Dashboard Statistik | Ringkasan 5 data + aktivitas terakhir real-time dari 3 tabel |
| Kelola Pengumuman | Tambah (dengan cek duplikat judul) dan hapus pengumuman |
| Moderasi Forum | Lihat postingan beserta nama & NIM mahasiswa, hapus postingan |
| Kelola Mahasiswa | Cari by nama/NIM/email, lihat detail, hapus akun |
| Realtime Updates | Semua halaman update otomatis saat ada perubahan data dari APK |
| Logout Bersih | Hapus sesi dari localStorage **dan** set null di DB sekaligus |
| Responsif | Tampilan menyesuaikan mobile/tablet dengan hamburger menu |

### Mobile Mahasiswa *(Android)*
| Fitur | Deskripsi |
|---|---|
| Login Mahasiswa | Autentikasi akun mahasiswa |
| Jadwal Kuliah | Jadwal kuliah pribadi per mahasiswa |
| Forum Diskusi | Tulis dan baca postingan forum |
| Pengumuman | Lihat pengumuman dari admin |
| Profil Mahasiswa | Informasi akun mahasiswa |

---

## Teknologi

### Frontend Web
- **HTML5** — Struktur halaman
- **CSS3** — Light theme, CSS Variables, animasi, responsive breakpoints
- **JavaScript (Vanilla)** — Logic client-side tanpa framework
- **Google Fonts** — Plus Jakarta Sans
- **Web Crypto API** — `crypto.subtle` untuk SHA-256, `crypto.getRandomValues` untuk SSID

### Backend & Database
- **Supabase** — Backend as a Service (BaaS)
- **PostgreSQL** — Database relasional via Supabase
- **Supabase Realtime** — Subscription perubahan data live (channel per tabel)

### Mobile
- **Kotlin** — Bahasa utama Android
- **XML Android** — Layout UI

---

## Struktur Folder

```
admin-web/
│
├── index.html          # Entry point → redirect ke splash
├── splash.html         # Splash screen + cek session/admin
├── login.html          # Halaman login admin
├── register.html       # Halaman register admin pertama
├── dashboard.html      # Dashboard statistik + aktivitas realtime
├── pengumuman.html     # Kelola pengumuman (cek duplikat, validasi)
├── forum.html          # Moderasi forum + nama mahasiswa + realtime
├── mahasiswa.html      # Kelola mahasiswa + search + realtime
│
├── css/
│   └── style.css       # Stylesheet global (light theme, responsive, CSS Variables)
│
├── js/
│   ├── config.js       # Konfigurasi Supabase URL & anon key
│   ├── supabase.js     # Inisialisasi Supabase client
│   ├── timeHelper.js   # Format waktu WIB (UTC+7 manual offset)
│   ├── checkAdmin.js   # Cek keberadaan admin + validasi sesi (dari splash)
│   ├── session.js      # Guard sesi untuk halaman app
│   ├── login.js        # Logic login + generate SSID + validasi
│   └── register.js     # Logic register + enkripsi password + validasi
│
└── assets/
    ├── logo.svg        # Logo utama (SVG, shield + mortarboard ungu)
    └── logo.png        # Logo original
```

---

## Skema Database

### Tabel `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `nama` | text | Nama lengkap |
| `nim` | text | Nomor Induk Mahasiswa |
| `email` | text | Email unik |
| `password` | text | SHA-256 hash dari password |
| `role` | text | `admin` atau `mahasiswa` |
| `ssid` | text | SHA-256 hash dari session token |
| `expired_at` | timestamp | Waktu expired sesi (24 jam dari login) |

### Tabel `announcements`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `judul` | text | Judul pengumuman |
| `isi` | text | Isi pengumuman |
| `tanggal` | timestamp | Waktu dibuat (DEFAULT now()) |

### Tabel `posts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `user_id` | int8 | FK ke `users.id` |
| `isi_post` | text | Konten postingan |
| `created_at` | timestamp | Waktu dibuat (DEFAULT now()) |

### Tabel `comments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `post_id` | int8 | FK ke `posts.id` |
| `user_id` | int8 | FK ke `users.id` |
| `isi_komentar` | text | Isi komentar |
| `created_at` | timestamp | Waktu dibuat (DEFAULT now()) |

### Tabel `schedules`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `matkul` | text | Nama mata kuliah |
| `hari` | text | Hari kuliah |
| `jam` | text | Jam kuliah |
| `ruangan` | text | Ruangan |
| `dosen` | text | Nama dosen |

---

## Sistem Keamanan

### Password Hashing
Password di-hash menggunakan **SHA-256** via Web Crypto API (`crypto.subtle`) sebelum disimpan dan sebelum dicocokkan saat login. Password plain tidak pernah menyentuh database.

```
Input password → sha256(password) → hash disimpan di DB
Login: sha256(input) === hash di DB → berhasil
```

### Session Token (SSID)
Sistem sesi menggunakan dua lapisan keamanan:

```
Login berhasil
  ↓
generateSsid() → crypto.getRandomValues(6 bytes) → 12 karakter hex
                                                  ↑ disimpan di localStorage (plain)
sha256(plain)  → 64 karakter hex hash             ← disimpan di kolom users.ssid (DB)
```

Saat validasi sesi (setiap buka halaman):
```
localStorage → ambil ssidPlain
            → sha256(ssidPlain) = ssidHashed
            → query DB: .eq('ssid', ssidHashed)
            → cek expired_at dari DB (bukan dari client)
            → valid → lanjut | tidak valid/expired → login.html
```

**Keuntungan:** Jika DB bocor, attacker hanya mendapat hash — tidak bisa dipakai langsung karena sistem selalu hash ulang sebelum query.

### Logout
Logout membersihkan sesi di dua tempat sekaligus:
1. `localStorage.removeItem('ssid')`
2. `UPDATE users SET ssid = null, expired_at = null WHERE ssid = hash`

### Timezone
Semua timestamp dari Supabase disimpan dalam **UTC**. Tampilan dikonversi ke **WIB (UTC+7)** secara manual via `timeHelper.js` — tidak menggunakan `toLocaleString` agar konsisten di semua browser dan OS.

```
Supabase: "2026-05-09 08:13:35" (UTC, tanpa Z)
  → paksa UTC: replace ' ' → 'T', tambah 'Z'
  → shift +7 jam
  → tampil: "9 Mei 2026, 15:13 WIB"
```

---

## Alur Navigasi

```
index.html
    ↓ (redirect langsung)
splash.html  (animasi 3 detik + cek kondisi DB & sesi)
    ├── Belum ada admin di DB     → register.html
    ├── Tidak ada ssid            → login.html
    ├── ssid tidak valid di DB    → login.html  (hapus localStorage)
    ├── ssid expired              → login.html  (clear ssid di DB + localStorage)
    └── Semua valid               → dashboard.html
                                        ↓
                              session.js guard aktif
                              di semua halaman app
```

---

## Cara Penggunaan

### 1. Setup Supabase
Buat project di [supabase.com](https://supabase.com), lalu buat tabel sesuai skema di atas.

### 2. Konfigurasi
Isi `js/config.js` dengan URL dan anon key dari project Supabase kamu:

```javascript
const SUPABASE_URL  = 'https://xxx.supabase.co'
const SUPABASE_ANON = 'eyJ...'
```

### 3. Jalankan
Buka `index.html` di browser. Pertama kali akan diarahkan ke `register.html` untuk membuat akun admin.

### 4. Aktifkan Supabase Realtime
Agar fitur update live berfungsi, aktifkan Realtime untuk tabel berikut:
> Supabase Dashboard → Table Editor → pilih tabel → Enable Realtime

Tabel yang perlu diaktifkan: `users`, `posts`, `announcements`

---

## Changelog

### v1.5.0 — Bugfix Timezone, Forum & Mahasiswa Update
**Dirilis:** Mei 2026

#### 🐛 Bugfix Timezone
- **Root cause** — Supabase mengirim timestamp tanpa suffix `Z` (misal `"2026-05-09 08:13:35"`). Browser menginterpretasikan string tanpa `Z` sebagai local time, bukan UTC, sehingga konversi WIB tidak terjadi dan waktu tampil 7 jam lebih awal
- **Fix `timeHelper.js`** — Sebelum parse, string dipaksa jadi UTC dengan mengganti spasi → `T` dan menambah `Z`. Kemudian shift manual `+7 jam` menggunakan `getUTC*()`. Tidak ada `toLocaleString` sama sekali — konsisten di semua browser/OS
- **Fix `session.js`, `checkAdmin.js`, `splash.html`** — Perbandingan `expired_at` juga diperbaiki dengan normalisasi UTC yang sama

#### 🔄 Forum — Update Lengkap
- **Session guard** ditambahkan — sebelumnya halaman bisa diakses tanpa login
- **Nama mahasiswa** — sebelumnya semua post tampil "Postingan Mahasiswa". Kini query `nama` + `NIM` dari tabel `users` berdasarkan `user_id`, dengan **cache** agar tidak query berulang untuk user yang sama
- **Order by `created_at`** — sebelumnya menggunakan `.order('id')`, kini diubah ke `.order('created_at', desc)` yang lebih akurat
- **Realtime subscription** — `channel('forum-changes')` aktif untuk INSERT dan DELETE. Post baru dari APK langsung muncul beserta nama mahasiswanya. Counter "X postingan" update otomatis
- **Timestamp WIB** — setiap card menampilkan waktu post dalam format "9 Mei 2026, 15:13 WIB"

#### 👥 Mahasiswa — Update
- **`session.js` dengan `defer`** — sebelumnya tanpa `defer`, berpotensi memblock render halaman sebelum Supabase siap

---

### v1.4.0 — Bugfix Query & Skema Database
**Dirilis:** Mei 2026

#### 🐛 Bugfix Query
- **`announcements`** — kolom timestamp adalah `tanggal` (bukan `created_at`). Seluruh query `select`, `order`, dan `insert` dikoreksi. Insert kini menyertakan `tanggal: new Date().toISOString()`
- **`posts`** — kolom konten adalah `isi_post` dan `user_id` tersedia untuk lookup nama mahasiswa
- **`users`** — kolom `nim` ditambahkan ke query select; kolom `created_at` tidak ada di tabel ini sehingga dihapus dari semua query
- **`schedules`** — kolom nyata: `matkul`, `hari`, `jam`, `ruangan`, `dosen` (bukan hanya `created_at`)

#### 🔒 Validasi Duplikat Pengumuman
- Sebelum insert, query cek apakah judul yang sama sudah ada di DB
- Jika duplikat ditemukan → tampilkan error inline, batalkan insert
- Validasi field kosong per-field dengan pesan spesifik
- Loading state tombol "Menyimpan..." saat proses berlangsung

#### 👥 Mahasiswa — Fitur Baru
- **Search realtime** — filter by nama, NIM, atau email secara client-side tanpa query ulang
- **Counter** — badge "X mahasiswa" update mengikuti hasil filter dan perubahan realtime
- **Badge "● Baru"** — mahasiswa yang baru daftar dari APK ditandai selama 30 detik
- **Realtime DELETE** — jika akun dihapus dari halaman lain, list update otomatis
- **Tampilkan NIM** — kolom NIM kini ditampilkan di card mahasiswa

---

### v1.3.0 — Keamanan Sesi & Enkripsi
**Dirilis:** Mei 2026

#### 🔐 Keamanan
- **Password hashing** — Password di-hash SHA-256 via `crypto.subtle` sebelum disimpan dan dicocokkan saat login
- **SSID 12 karakter** — Session token digenerate dari `crypto.getRandomValues` (6 bytes → 12 hex char), menggantikan `Math.random()` yang tidak kriptografis
- **SSID double-layer** — Plain token di localStorage, hash-nya di DB. Kebocoran DB tidak langsung memberi akses sesi
- **Logout bersih** — Logout menghapus ssid dari localStorage dan set null di DB
- **`expired_at` dari DB** — Validasi expired dibaca dari DB, bukan dihitung di client

#### ✅ Validasi Login & Register
- Field kosong dicek per-field dengan pesan spesifik
- Validasi format email dengan regex
- Animasi shake pada error, tombol disable saat loading
- Enter key support di semua form
- Password minimal 8 karakter, harus ada huruf dan angka
- Cek duplikat email sebelum insert
- Auto-login setelah register berhasil

---

### v1.2.0 — Redesain UI & Light Theme
**Dirilis:** Mei 2026

#### 🎨 UI/UX
- **Light theme** — Background `#f4f6fb`, card putih. Sidebar tetap gelap `#2d1b69`
- **Font** — Plus Jakarta Sans
- **CSS Variables** — Warna, radius, spacing terpusat
- **Login split-layout** — Panel kiri branding, kanan form
- **Logo SVG** — Shield ungu + mortarboard + buku terbuka
- **Responsif** — Breakpoint 1024px, 768px, 480px; hamburger menu mobile

#### 📊 Dashboard
- Stat cards 5 item dengan warna aksen per kategori
- Aksi Cepat — 3 shortcut card
- Greeting personal dari nama admin di sesi
- Aktivitas terakhir real-time dari 3 tabel

---

### v1.1.0 — Realtime & Splash Screen
**Dirilis:** Mei 2026

#### ⚡ Realtime
- 6 channel Supabase Realtime (INSERT & DELETE untuk `users`, `posts`, `announcements`)
- Counter stat card naik/turun otomatis dengan animasi flash
- Feed aktivitas dari data DB nyata, bukan dummy
- Label timeAgo refresh setiap 30 detik

#### 🌟 Splash Screen
- `splash.html` — animasi logo, loading bar, status text dinamis
- `index.html` — redirect ke splash
- Flow navigasi lengkap berdasarkan kondisi DB dan sesi

---

### v1.0.0 — Rilis Awal
**Dirilis:** 2025

#### 🚀 Fitur Awal
- Login admin + session sederhana
- CRUD pengumuman
- Moderasi forum
- Kelola data mahasiswa
- Dashboard statistik dasar
- Sidebar navigasi
- Logout
