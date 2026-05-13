/**
 * login.js
 *
 * Alur login:
 *  1. Validasi input (email & password)
 *  2. Hash password (SHA-256) → cocokkan dengan DB
 *  3. Generate SSID plain (12 char hex) → hash-nya disimpan di DB
 *     plain-nya disimpan di localStorage bersama id & nama
 *  4. Set expired_at 24 jam ke depan
 *  5. Set status = 'online' & last_seen saat login berhasil   ← UPDATED
 */

/* ── Crypto Helpers ── */

/** Hash string dengan SHA-256, kembalikan hex */
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/** Generate SSID plain: 6 random bytes → 12 karakter hex */
function generateSsid() {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Main Login ── */

async function login() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    clearError();

    // Validasi input
    if (!email && !password)                             return showError('Email dan password wajib diisi.');
    if (!email)                                          return showError('Email tidak boleh kosong.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))      return showError('Format email tidak valid.');
    if (!password)                                       return showError('Password tidak boleh kosong.');
    if (password.length < 4)                             return showError('Password terlalu pendek.');

    setLoading(true);

    try {
        // 1. Cocokkan kredensial di DB
        const hashedPassword = await sha256(password);

        const { data: user, error } = await supabaseClient
            .from('users')
            .select('id, nama, email, role')
            .eq('email', email)
            .eq('password', hashedPassword)
            .eq('role', 'admin')
            .single();

        if (error || !user) {
            showError('Email atau password salah.');
            return setLoading(false);
        }

        // 2. Buat SSID baru
        const ssidPlain  = generateSsid();
        const ssidHashed = await sha256(ssidPlain);
        const expiredAt  = new Date();
        expiredAt.setHours(expiredAt.getHours() + 24);

        // 3. Simpan SSID hash, expired_at, status online & last_seen ke DB
        //    ← UPDATED: tambah status: 'online' dan last_seen
        const { error: updateError } = await supabaseClient
            .from('users')
            .update({
                ssid:       ssidHashed,
                expired_at: expiredAt.toISOString(),
                status:     'online',                    // ← Set online saat login
                last_seen:  new Date().toISOString(),   // ← Catat waktu login
            })
            .eq('id', user.id);

        if (updateError) {
            showError('Gagal membuat sesi. Coba lagi.');
            return setLoading(false);
        }

        // 4. Simpan session (plain) di localStorage, redirect
        localStorage.setItem('ssid', JSON.stringify({
            id:   user.id,
            nama: user.nama,
            ssid: ssidPlain,
        }));

        location.href = 'dashboard.html';

    } catch (err) {
        console.error('Login error:', err);
        showError('Terjadi kesalahan koneksi. Coba lagi.');
        setLoading(false);
    }
}

/* ── UI Helpers ── */

function showError(msg) {
    let el = document.getElementById('loginError');

    if (!el) {
        // Inject keyframe sekali saja
        if (!document.getElementById('errStyle')) {
            const style = document.createElement('style');
            style.id = 'errStyle';
            style.textContent = `
                @keyframes errShake {
                    0%, 100% { transform: translateX(0);    }
                    25%       { transform: translateX(-6px); }
                    75%       { transform: translateX(6px);  }
                }
            `;
            document.head.appendChild(style);
        }

        el = document.createElement('div');
        el.id = 'loginError';
        Object.assign(el.style, {
            color:        '#991b1b',
            fontSize:     '13px',
            fontWeight:   '500',
            marginTop:    '14px',
            padding:      '11px 14px',
            background:   '#fff1f2',
            border:       '1px solid #fecdd3',
            borderRadius: '10px',
            textAlign:    'center',
            animation:    'errShake .3s ease',
        });

        document.querySelector('.btn-primary')?.after(el);
    }

    el.style.display = 'block';
    el.textContent   = '⚠ ' + msg;
}

function clearError() {
    const el = document.getElementById('loginError');
    if (el) el.style.display = 'none';
}

function setLoading(on) {
    const btn = document.querySelector('.btn-primary');
    if (!btn) return;
    btn.disabled    = on;
    btn.textContent = on ? 'Memverifikasi...' : 'Masuk ke Dashboard →';
}

// Shortcut: Enter untuk submit
document.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });