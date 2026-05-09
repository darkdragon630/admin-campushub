/**
 * login.js
 * - Validasi input lengkap
 * - Password di-hash SHA-256 sebelum cek ke DB
 * - SSID: 12 karakter hex acak, di-hash SHA-256 → disimpan di DB
 *   (yang disimpan di localStorage adalah ssid PLAIN, DB menyimpan HASH-nya)
 * - expired_at: 24 jam dari waktu login
 */

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

/** Generate ssid plain 12 karakter hex (48-bit entropy) */
function generateSsid() {
  const bytes = crypto.getRandomValues(new Uint8Array(6)) // 6 bytes = 12 hex chars
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('')
}

async function login() {
  const email    = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  clearError()

  // ── Validasi ──
  if (!email && !password) { showError('Email dan password wajib diisi.'); return }
  if (!email)               { showError('Email tidak boleh kosong.'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Format email tidak valid.'); return }
  if (!password)            { showError('Password tidak boleh kosong.'); return }
  if (password.length < 4)  { showError('Password terlalu pendek.'); return }

  setLoading(true)

  try {
    // Hash password untuk dicocokkan di DB
    const hashedPassword = await sha256(password)

    const { data: user, error } = await supabaseClient
      .from('users')
      .select('id, nama, email, role')
      .eq('email', email)
      .eq('password', hashedPassword)
      .eq('role', 'admin')
      .single()

    if (error || !user) {
      showError('Email atau password salah.')
      setLoading(false)
      return
    }

    // ── Generate SSID baru ──
    const ssidPlain  = generateSsid()             // 12 char hex → simpan di localStorage
    const ssidHashed = await sha256(ssidPlain)    // hash-nya → simpan di DB

    // expired 24 jam dari sekarang
    const expiredAt = new Date()
    expiredAt.setHours(expiredAt.getHours() + 24)

    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        ssid:       ssidHashed,
        expired_at: expiredAt.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      showError('Gagal membuat sesi. Coba lagi.')
      setLoading(false)
      return
    }

    // Simpan plain ssid di localStorage (bukan hash)
    localStorage.setItem('ssid', ssidPlain)

    location.href = 'dashboard.html'

  } catch (err) {
    console.error('Login error:', err)
    showError('Terjadi kesalahan koneksi. Coba lagi.')
    setLoading(false)
  }
}

function showError(msg) {
  let el = document.getElementById('loginError')
  if (!el) {
    el = document.createElement('div')
    el.id = 'loginError'
    el.style.cssText = [
      'color:#991b1b',
      'font-size:13px',
      'font-weight:500',
      'margin-top:14px',
      'padding:11px 14px',
      'background:#fff1f2',
      'border:1px solid #fecdd3',
      'border-radius:10px',
      'text-align:center',
      'animation:errShake .3s ease'
    ].join(';')

    if (!document.getElementById('errStyle')) {
      const s = document.createElement('style')
      s.id = 'errStyle'
      s.textContent = '@keyframes errShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}'
      document.head.appendChild(s)
    }

    document.querySelector('.btn-primary')?.after(el)
  }
  el.style.display = 'block'
  el.textContent   = '⚠ ' + msg
}

function clearError() {
  const el = document.getElementById('loginError')
  if (el) el.style.display = 'none'
}

function setLoading(on) {
  const btn = document.querySelector('.btn-primary')
  if (!btn) return
  btn.disabled    = on
  btn.textContent = on ? 'Memverifikasi...' : 'Masuk ke Dashboard →'
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') login() })
