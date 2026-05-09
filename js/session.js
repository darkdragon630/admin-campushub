/**
 * session.js
 * Guard semua halaman app. Dipanggil dengan defer.
 * 
 * Flow:
 *  1. Ambil ssid plain dari localStorage
 *  2. Hash SHA-256 → query DB .eq('ssid', ssidHashed)
 *  3. Cek expired_at dari DB
 *  4. Tidak valid / expired → hapus localStorage → login.html
 */

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

async function checkSession() {
  const ssidPlain = localStorage.getItem('ssid')

  if (!ssidPlain) {
    location.href = 'login.html'
    return
  }

  try {
    const ssidHashed = await sha256(ssidPlain)

    const { data, error } = await supabaseClient
      .from('users')
      .select('id, role, expired_at')
      .eq('ssid', ssidHashed)
      .eq('role', 'admin')
      .single()

    if (error || !data) {
      localStorage.removeItem('ssid')
      location.href = 'login.html'
      return
    }

    if (!data.expired_at || new Date() > new Date(data.expired_at)) {
      // Bersihkan ssid di DB juga
      await supabaseClient
        .from('users')
        .update({ ssid: null, expired_at: null })
        .eq('ssid', ssidHashed)

      localStorage.removeItem('ssid')
      location.href = 'login.html'
    }

  } catch (err) {
    console.error('checkSession:', err)
    localStorage.removeItem('ssid')
    location.href = 'login.html'
  }
}

checkSession()
