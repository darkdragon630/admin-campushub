/**
 * register.js
 * - Validasi semua field
 * - Password di-hash SHA-256 sebelum disimpan
 * - Setelah register → generate ssid → auto-login ke dashboard
 */

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

function generateSsid() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('')
}

async function registerAdmin() {
  const nama     = document.getElementById('nama').value.trim()
  const email    = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  clearError()

  // ── Validasi ──
  if (!nama)                       { showError('Nama tidak boleh kosong.'); return }
  if (nama.length < 3)             { showError('Nama minimal 3 karakter.'); return }
  if (!email)                      { showError('Email tidak boleh kosong.'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Format email tidak valid.'); return }
  if (!password)                   { showError('Password tidak boleh kosong.'); return }
  if (password.length < 8)         { showError('Password minimal 8 karakter.'); return }
  if (!/[A-Za-z]/.test(password))  { showError('Password harus mengandung huruf.'); return }
  if (!/[0-9]/.test(password))     { showError('Password harus mengandung angka.'); return }

  setLoading(true)

  try {
    // Cek duplikat email
    const { data: existing } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) { showError('Email sudah terdaftar.'); setLoading(false); return }

    // Hash password
    const hashedPassword = await sha256(password)

    // Generate ssid untuk auto-login setelah register
    const ssidPlain  = generateSsid()
    const ssidHashed = await sha256(ssidPlain)

    const expiredAt = new Date()
    expiredAt.setHours(expiredAt.getHours() + 24)

    const { error } = await supabaseClient
      .from('users')
      .insert([{
        nama,
        email,
        password:   hashedPassword,
        role:       'admin',
        ssid:       ssidHashed,
        expired_at: expiredAt.toISOString()
      }])

    if (error) {
      showError('Gagal membuat akun. Coba lagi.')
      setLoading(false)
      return
    }

    // Auto-login
    localStorage.setItem('ssid', ssidPlain)
    location.href = 'dashboard.html'

  } catch (err) {
    console.error('Register error:', err)
    showError('Terjadi kesalahan koneksi. Coba lagi.')
    setLoading(false)
  }
}

function showError(msg) {
  let el = document.getElementById('regError')
  if (!el) {
    el = document.createElement('div')
    el.id = 'regError'
    el.style.cssText = [
      'color:#991b1b',
      'font-size:13px',
      'font-weight:500',
      'margin-top:14px',
      'padding:11px 14px',
      'background:#fff1f2',
      'border:1px solid #fecdd3',
      'border-radius:10px',
      'text-align:center'
    ].join(';')
    document.querySelector('.btn-primary')?.after(el)
  }
  el.style.display = 'block'
  el.textContent   = '⚠ ' + msg
}

function clearError() {
  const el = document.getElementById('regError')
  if (el) el.style.display = 'none'
}

function setLoading(on) {
  const btn = document.querySelector('.btn-primary')
  if (!btn) return
  btn.disabled    = on
  btn.textContent = on ? 'Membuat akun...' : 'Buat Akun →'
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') registerAdmin() })
