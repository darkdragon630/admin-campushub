/**
 * timeHelper.js
 * Format waktu WIB (UTC+7) — manual offset, tidak pakai toLocaleString
 * agar konsisten di semua browser & OS termasuk yang tidak support
 * timeZone: 'Asia/Jakarta'
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000  // 7 jam dalam ms

const BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]

/**
 * Parse ISO string dari Supabase → Date object sudah di-shift ke WIB
 * Supabase kirim: "2026-05-09 08:13:35.105" (UTC, tanpa Z)
 * Browser interpret tanpa Z = local time → SALAH
 * Fix: paksa anggap UTC dengan tambah Z, lalu shift +7 jam
 */
function toWIB(isoStr) {
  if (!isoStr) return null
  // Pastikan string dianggap UTC
  const utcStr = isoStr.includes('Z') || isoStr.includes('+')
    ? isoStr
    : isoStr.replace(' ', 'T') + 'Z'
  return new Date(new Date(utcStr).getTime() + WIB_OFFSET_MS)
}

/**
 * Format lengkap: "9 Mei 2026, 15:13 WIB"
 */
function formatWIB(isoStr) {
  if (!isoStr) return ''
  const d = toWIB(isoStr)
  const tgl   = d.getUTCDate()
  const bln   = BULAN[d.getUTCMonth()]
  const thn   = d.getUTCFullYear()
  const jam   = String(d.getUTCHours()).padStart(2, '0')
  const menit = String(d.getUTCMinutes()).padStart(2, '0')
  return `${tgl} ${bln} ${thn}, ${jam}:${menit} WIB`
}

/**
 * Format pendek: "9 Mei 2026"
 */
function formatDateWIB(isoStr) {
  if (!isoStr) return ''
  const d = toWIB(isoStr)
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * Relatif: "2 mnt lalu", "1 jam lalu"
 * Selisih dihitung UTC vs UTC — tidak perlu offset
 */
function timeAgo(isoStr) {
  if (!isoStr) return ''
  const utcStr = isoStr.includes('Z') || isoStr.includes('+')
    ? isoStr
    : isoStr.replace(' ', 'T') + 'Z'
  const diff = Date.now() - new Date(utcStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5)  return 'Baru saja'
  if (s < 60) return `${s} dtk lalu`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} mnt lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const day = Math.floor(h / 24)
  return day === 1 ? 'Kemarin' : `${day} hari lalu`
}

/**
 * Cek expired — keduanya UTC, aman dibanding langsung
 */
function isExpired(isoStr) {
  if (!isoStr) return true
  const utcStr = isoStr.includes('Z') || isoStr.includes('+')
    ? isoStr
    : isoStr.replace(' ', 'T') + 'Z'
  return Date.now() > new Date(utcStr).getTime()
}
