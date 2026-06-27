const axios = require('axios');

let handler = async (m, { conn }) => {
    // ==========================================
    // KONFIGURASI PTERODACTYL PANEL
    // ==========================================
    const domain = "https://private.gervhosting.my.id"; // Domain panel Anda
    const serverId = "d182a645"; // ID Server Anda
    
    // Mengambil API Key dari config.js
    const apiKey = global.panelKey;

    if (!apiKey) {
        return m.reply("❌ **Gagal:** Variabel `global.panelKey` belum diisi di file config.js Anda.\n\nSilakan buat API Key di menu *Account > API Credentials* pada panel, lalu masukkan ke config.js.");
    }

    await m.reply("🔄 Mengirim sinyal *RESTART* ke server utama panel...");

    try {
        const url = `${domain}/api/client/servers/${serverId}/power`;
        
        // Mengirim request untuk menekan tombol restart di panel
        await axios.post(url, {
            signal: 'restart'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        m.reply("✅ Perintah eksekusi *RESTART* panel berhasil dikirim!\n\nBot dan server akan mati dalam beberapa detik, lalu menyala kembali secara otomatis.");
        
    } catch (error) {
        console.error(error);
        let errMsg = error.response?.data?.errors?.[0]?.detail || error.message;
        m.reply(`❌ **Gagal merestart panel!**\n\n*Detail Error:* ${errMsg}\n\n_Pastikan global.panelKey Anda di config.js sudah menggunakan Client API Key (berawalan ptlc_)._`);
    }
};

handler.help = ['restartpanel', 'rsp'];
handler.tags = ['owner'];
handler.command = /^(restartpanel|rsp|restartserver)$/i;
handler.rowner = true; // Hanya Owner yang bisa pakai!

module.exports = handler;
