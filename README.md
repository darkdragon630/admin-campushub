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
| Register Admin | Buat akun admin pertama dengan validasi + enkripsi password |
| Login Admin | Autentikasi dengan validasi input lengkap |
| Session 24 Jam | Sesi otomatis expired, divalidasi via DB |
| Dashboard Statistik | Ringkasan data + aktivitas terakhir real-time |
| Kelola Pengumuman | Tambah dan hapus pengumuman kampus |
| Moderasi Forum | Lihat dan hapus postingan mahasiswa |
| Kelola Mahasiswa | Lihat dan hapus akun mahasiswa |
| Logout | Hapus sesi dari localStorage dan DB sekaligus |

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
- **CSS3** — Styling modern dengan CSS Variables & animasi
- **JavaScript (Vanilla)** — Logic client-side tanpa framework
- **Google Fonts** — Plus Jakarta Sans

### Backend & Database
- **Supabase** — Backend as a Service (BaaS)
- **PostgreSQL** — Database relasional via Supabase
- **Supabase Realtime** — Subscription perubahan data live

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
├── pengumuman.html     # Kelola pengumuman
├── forum.html          # Moderasi forum mahasiswa
├── mahasiswa.html      # Kelola data mahasiswa
│
├── css/
│   └── style.css       # Stylesheet global (light theme, CSS Variables)
│
├── js/
│   ├── config.js       # Konfigurasi Supabase URL & anon key
│   ├── supabase.js     # Inisialisasi Supabase client
│   ├── checkAdmin.js   # Cek keberadaan admin + validasi sesi (dari splash)
│   ├── session.js      # Guard sesi untuk halaman app (defer)
│   ├── login.js        # Logic login + generate SSID
│   └── register.js     # Logic register + enkripsi password
│
└── assets/
    ├── logo.svg        # Logo utama (SVG, shield + mortarboard)
    └── logo.png        # Logo original
```

---

## Skema Database

### Tabel `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `nama` | text | Nama lengkap |
| `email` | text | Email unik |
| `password` | text | SHA-256 hash dari password |
| `role` | text | `admin` atau `mahasiswa` |
| `ssid` | text | SHA-256 hash dari session token |
| `expired_at` | timestamptz | Waktu expired sesi (24 jam) |

### Tabel `announcements`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `judul` | text | Judul pengumuman |
| `isi` | text | Isi pengumuman |
| `created_at` | timestamptz | Waktu dibuat |

### Tabel `posts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `isi_post` | text | Konten postingan |
| `created_at` | timestamptz | Waktu dibuat |

### Tabel `schedules`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | int8 | Primary key |
| `created_at` | timestamptz | Waktu dibuat |

---

## Sistem Keamanan

### Password Hashing
Password di-hash menggunakan **SHA-256** via Web Crypto API (`crypto.subtle`) sebelum disimpan ke database. Password plain tidak pernah dikirim atau disimpan.

```
Input password → sha256() → hash disimpan di DB
```

### Session Token (SSID)
Sistem sesi menggunakan dua lapisan:

```
Login berhasil
  ↓
generateSsid() → 6 random bytes (crypto.getRandomValues)
              → 12 karakter hex  ← disimpan di localStorage (plain)
  ↓
sha256(plain)  → hash             ← disimpan di kolom users.ssid (DB)
```

Saat validasi sesi:
```
localStorage → ambil ssidPlain
            → sha256(ssidPlain) = ssidHashed
            → query DB: .eq('ssid', ssidHashed)
            → cek expired_at dari DB
```

**Keuntungan:** Jika DB bocor, attacker hanya mendapat hash — tidak bisa dipakai langsung karena sistem selalu hash ulang sebelum query.

### Logout
Logout membersihkan sesi di dua tempat sekaligus:
1. `localStorage.removeItem('ssid')`
2. `DB: UPDATE users SET ssid = null, expired_at = null`

---

## Alur Navigasi

```
index.html
    ↓
splash.html  (animasi 3 detik + cek kondisi)
    ├── Belum ada admin di DB     → register.html
    ├── Tidak ada ssid            → login.html
    ├── ssid tidak valid di DB    → login.html
    ├── ssid expired              → login.html  (clear DB + localStorage)
    └── Semua valid               → dashboard.html
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

### 4. Supabase Realtime
Aktifkan Realtime di Supabase Dashboard untuk tabel `users`, `posts`, dan `announcements` agar fitur aktivitas live di dashboard berfungsi:
> Supabase Dashboard → Table Editor → pilih tabel → Enable Realtime

---

## Changelog

### v1.3.0 — Keamanan Sesi & Enkripsi
**Dirilis:** Mei 2025

#### 🔐 Keamanan
- **Password hashing** — Password kini di-hash SHA-256 via `crypto.subtle` sebelum disimpan dan sebelum dicocokkan saat login. Password plain tidak pernah menyentuh database
- **SSID 12 karakter** — Session token digenerate dari `crypto.getRandomValues` (6 bytes → 12 hex char), menggantikan `Math.random()` yang tidak aman secara kriptografis
- **SSID double-layer** — Plain token di localStorage, hash-nya di DB. Kebocoran DB tidak langsung memberi akses ke sesi aktif
- **Logout bersih** — Logout menghapus ssid dari localStorage **dan** set null di kolom DB, mencegah sesi orphan
- **Expired_at dari DB** — Validasi expired tidak lagi dihitung di client (mudah dimanipulasi), tapi dibaca dari kolom `expired_at` di Supabase

#### ✅ Validasi Login
- Tidak bisa submit login dengan field kosong
- Validasi format email dengan regex
- Pesan error spesifik per kondisi (kosong, format salah, password salah)
- Animasi shake pada error
- Tombol disable + loading state saat proses berlangsung
- Enter key support

#### ✅ Validasi Register
- Nama minimal 3 karakter
- Validasi format email
- Password minimal 8 karakter, harus ada huruf dan angka
- Cek duplikat email sebelum insert
- Auto-login setelah register berhasil

---

### v1.2.0 — Redesain UI & Light Theme
**Dirilis:** Mei 2025

#### 🎨 UI/UX
- **Light theme** — Tema gelap total diganti dengan light theme bersih (`#f4f6fb` background, card putih). Sidebar tetap gelap (`#2d1b69`) sebagai kontras
- **Font baru** — Migrasi ke **Plus Jakarta Sans** untuk keterbacaan lebih baik
- **CSS Variables** — Seluruh warna, radius, dan spacing dikelola via custom properties untuk konsistensi
- **Login split-layout** — Halaman login kini dua panel: kiri branding (desktop), kanan form
- **Logo redesain** — Logo baru berbentuk shield/perisai ungu dengan mortarboard dan buku terbuka, format SVG (scalable, ringan)
- **Warna brand ungu** — Brand color berubah dari hijau ke ungu (`#7c3aed`) sesuai desain logo baru

#### 📊 Dashboard
- **Stat cards berwarna** — Setiap kartu statistik punya warna aksen berbeda dengan trend label
- **Aksi Cepat** — 3 shortcut card ke pengumuman, mahasiswa, dan forum
- **Greeting personal** — Sapaan menggunakan nama admin dari sesi

---

### v1.1.0 — Aktivitas Realtime & Splash Screen
**Dirilis:** Mei 2025

#### ⚡ Realtime
- **6 channel Supabase Realtime** — INSERT & DELETE untuk tabel `users`, `posts`, `announcements`
- **Counter otomatis** — Stat card naik/turun otomatis saat ada perubahan data, dengan animasi flash
- **Feed dari DB nyata** — Aktivitas terakhir diambil dari 3 tabel, digabung, diurutkan descending — bukan data dummy
- **Label timeAgo** — "2 mnt lalu", "1 jam lalu" refresh otomatis setiap 30 detik
- **Live badge** — Indikator animasi pulse di section aktivitas

#### 🌟 Splash Screen
- **`splash.html`** — Animasi logo bounce-in, dual ring pulse, loading bar gradient
- **Status text dinamis** — Teks status berubah sesuai tahap pengecekan (koneksi → admin → sesi)
- **`index.html`** — Cukup sebagai redirect ke splash, bukan entry point langsung
- **Flow navigasi lengkap** — Splash menentukan ke mana user diarahkan berdasarkan kondisi DB dan sesi

---

### v1.0.0 — Rilis Awal
**Dirilis:** 2025

#### 🚀 Fitur Awal
- Login admin dengan Supabase
- CRUD pengumuman
- Moderasi forum (lihat + hapus postingan)
- Kelola data mahasiswa (lihat + hapus)
- Dashboard statistik dasar (total per tabel)
- Sidebar navigasi dengan halaman aktif
- Logout dengan hapus localStorage
