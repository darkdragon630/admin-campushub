/**
 * checkAdmin.js
 * Entry point dari index.html (setelah splash).
 *
 * Flow:
 *  1. Belum ada admin di DB              → register.html
 *  2. Tidak ada ssid di localStorage     → login.html
 *  3. Hash ssid → query DB → tidak ada   → login.html (hapus localStorage)
 *  4. Sesi expired (expired_at lewat)    → login.html (clear ssid di DB + localStorage)
 *  5. Semua valid                        → dashboard.html
 */

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

async function checkAdmin() {
  try {
    // 1. Cek keberadaan admin di DB
    const { data: admins, error: adminError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (adminError) throw adminError

    if (!admins || admins.length === 0) {
      location.href = 'register.html'
      return
    }

    // 2. Cek ssid plain di localStorage
    const ssidPlain = localStorage.getItem('ssid')
    if (!ssidPlain) {
      location.href = 'login.html'
      return
    }

    // 3. Hash ssid → query DB
    const ssidHashed = await sha256(ssidPlain)

    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, role, expired_at')
      .eq('ssid', ssidHashed)
      .eq('role', 'admin')
      .single()

    if (userError || !user) {
      localStorage.removeItem('ssid')
      location.href = 'login.html'
      return
    }

    // 4. Cek expired_at dari DB
    if (!user.expired_at || new Date() > new Date(user.expired_at)) {
      await supabaseClient
        .from('users')
        .update({ ssid: null, expired_at: null })
        .eq('ssid', ssidHashed)

      localStorage.removeItem('ssid')
      location.href = 'login.html'
      return
    }

    // 5. Semua valid → dashboard
    location.href = 'dashboard.html'

  } catch (err) {
    console.error('checkAdmin:', err)
    location.href = 'login.html'
  }
}

checkAdmin()