let handler = async (m, { conn, text, command, usedPrefix, isOwner, participants }) => {
    // ==========================================
    // KEAMANAN: HANYA OWNER & HARUS DI GRUP
    // ==========================================
    if (!isOwner) return m.reply("❌ Fitur ini sangat rahasia dan hanya boleh digunakan oleh Owner!");
    if (!m.isGroup) return m.reply("❌ Fitur ini hanya bisa digunakan di dalam obrolan Grup!");
    
    if (!text) {
        return m.reply(`*Cara Pakai Push Kontak:*\n${usedPrefix + command} <teks pesan>\n\n*Contoh:*\n${usedPrefix + command} Halo kak, save nomorku ya! Nama: Admin Harps Bot.\n\n_Catatan: Fitur ini akan mengirim pesan secara otomatis ke seluruh member di grup ini._`);
    }

    // ==========================================
    // MENGAMBIL DATA MEMBER GRUP
    // ==========================================
    // Mendapatkan semua ID member grup
    let members = participants.map(u => u.id);
    
    // Mengecualikan nomor bot itu sendiri agar tidak mengirim pesan ke diri sendiri
    let botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    members = members.filter(v => v !== botId);

    // Menghitung estimasi waktu (5 detik per member)
    let estimasiDetik = members.length * 5;
    let estimasiMenit = Math.floor(estimasiDetik / 60);
    let sisaDetik = estimasiDetik % 60;

    await m.reply(`⏳ *MEMULAI PUSH KONTAK...*\n\n• *Target:* ${members.length} Member Grup\n• *Estimasi Waktu:* ${estimasiMenit} Menit ${sisaDetik} Detik\n• *Delay:* 5 Detik / Pesan\n\n_Mohon biarkan bot menyala hingga proses ini selesai agar tidak terjadi error._`);

    let sukses = 0;
    let gagal = 0;

    // ==========================================
    // PROSES PENGIRIMAN (LOOPING & DELAY)
    // ==========================================
    for (let jid of members) {
        try {
            // Mengirim pesan ke masing-masing member (Japri)
            await conn.sendMessage(jid, { text: text });
            sukses++;
        } catch (e) {
            gagal++; // Jika gagal (misal: nomor member sudah tidak aktif)
        }
        
        // JEDA 5 DETIK ANTI-BANNED (5000 milidetik)
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // ==========================================
    // LAPORAN HASIL
    // ==========================================
    await m.reply(`✅ *PUSH KONTAK SELESAI!*\n\n📊 *Laporan Pengiriman:*\n• Berhasil terkirim: ${sukses}\n• Gagal terkirim: ${gagal}\n\n_Pesan Anda telah berhasil disebarkan ke member grup._`);
};

handler.help = ['pushkontak <teks>'];
handler.tags = ['owner'];
handler.command = /^(pushkontak|pushkon)$/i;
handler.rowner = true; // Mutlak hanya untuk owner

module.exports = handler;
