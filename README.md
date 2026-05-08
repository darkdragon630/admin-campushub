# CampusHub Admin Dashboard

CampusHub adalah sistem manajemen kampus berbasis web dan mobile yang dibuat untuk membantu pengelolaan informasi mahasiswa, forum diskusi, dan pengumuman kampus secara modern menggunakan Supabase sebagai backend cloud database.

---

# Fitur Utama

## Admin Web
- Login Admin
- Session Login 24 Jam
- Dashboard Statistik
- Kelola Pengumuman
- Moderasi Forum Mahasiswa
- Kelola Data Mahasiswa
- Logout Session

## Mobile Mahasiswa
- Login Mahasiswa
- Jadwal Kuliah Pribadi
- Forum Diskusi
- Pengumuman Kampus
- Profile Mahasiswa

---

# Teknologi Yang Digunakan

## Frontend Web
- HTML
- CSS
- JavaScript

## Backend
- Supabase

## Database
- PostgreSQL

## Mobile App
- Kotlin
- XML Android

---

# Struktur Folder

```bash
admin-web/
│
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── pengumuman.html
├── forum.html
├── mahasiswa.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── config.js
│   ├── supabase.js
│   ├── session.js
│   ├── login.js
│   ├── register.js
│   └── checkAdmin.js
│
└── assets/
    └── logo.png
