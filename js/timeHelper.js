/**
 * timeHelper.js
 * Semua fungsi format waktu dengan timezone WIB (UTC+7).
 * Include di semua halaman sebelum script lain.
 */

const WIB_OFFSET = 7 * 60 * 60 * 1000 // 7 jam dalam ms

/**
 * Konversi ISO string dari Supabase (UTC) ke Date WIB
 */
function toWIB(isoStr) {
  if (!isoStr) return null
  return new Date(new Date(isoStr).getTime() + WIB_OFFSET)
}

/**
 * "2 mnt lalu", "1 jam lalu", dst — relatif dari sekarang (WIB)
 */
function timeAgo(isoStr) {
  if (!isoStr) return ''
  // getTime() sudah UTC di semua browser, tidak perlu offset untuk selisih
  const diff = Date.now() - new Date(isoStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5)   return 'Baru saja'
  if (s < 60)  return `${s} dtk lalu`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m} mnt lalu`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h} jam lalu`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Kemarin' : `${d} hari lalu`
}

/**
 * Format tanggal lengkap dalam WIB
 * Contoh: "9 Mei 2026, 15:13 WIB"
 */
function formatWIB(isoStr, opts = {}) {
  if (!isoStr) return ''
  const date = new Date(isoStr)
  const defaults = {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return date.toLocaleString('id-ID', { ...defaults, ...opts }) + ' WIB'
}

/**
 * Format tanggal pendek: "9 Mei 2026"
 */
function formatDateWIB(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Cek apakah timestamp dari DB (UTC) sudah expired dibanding sekarang
 * Aman dipakai di client karena Date.now() dan new Date(isoStr) keduanya UTC
 */
function isExpired(isoStr) {
  if (!isoStr) return true
  return Date.now() > new Date(isoStr).getTime()
}
