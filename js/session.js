/**
 * session.js
 * Guard semua halaman app. Dipanggil dengan defer.
 *
 * Flow:
 *  1. Ambil ssid plain dari localStorage
 *  2. Hash SHA-256 → query DB .eq('ssid', ssidHashed)
 *  3. Cek expired_at dari DB
 *  4. Tidak valid / expired → hapus localStorage → login.html
 *  5. Sesi valid → update status = 'online' & last_seen   ← UPDATED
 */

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function checkSession() {
    const sessionRaw = localStorage.getItem('ssid');

    if (!sessionRaw) {
        location.href = 'login.html';
        return;
    }

    try {
        // 1. Parsing data dari storage
        const sessionData = JSON.parse(sessionRaw);
        const ssidHashed  = await sha256(sessionData.ssid);

        // 2. Cek ke DB
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, role, expired_at')
            .eq('ssid', ssidHashed)
            .eq('id', sessionData.id)   // Validasi ID agar lebih aman
            .single();

        if (error || !data) {
            localStorage.removeItem('ssid');
            location.href = 'login.html';
            return;
        }

        // 3. Cek expired
        const isExpired = new Date(data.expired_at) < new Date();
        if (isExpired) {
            await supabaseClient
                .from('users')
                .update({
                    ssid:       null,
                    expired_at: null,
                    status:     'offline',              // ← Set offline saat expired
                    last_seen:  new Date().toISOString(),
                })
                .eq('id', data.id);

            localStorage.removeItem('ssid');
            location.href = 'login.html';
            return;
        }

        // 4. Sesi valid → pastikan status online & perbarui last_seen
        //    ← UPDATED: tambah status: 'online'
        await supabaseClient
            .from('users')
            .update({
                status:    'online',                   // ← Perbaikan utama
                last_seen: new Date().toISOString(),
            })
            .eq('id', data.id);

    } catch (err) {
        console.error('checkSession error:', err);
        localStorage.removeItem('ssid');
        location.href = 'login.html';
    }
}

checkSession();