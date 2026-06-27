const fs = require('fs');

const dbPath = './db_script.json';
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    let dbScript = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // ==========================================
    // TAMBAH SCRIPT
    // ==========================================
    if (command === 'setscript') {
        if (!isOwner) return m.reply("❌ Khusus Owner cuk!");
        
        if (!text || text.split('|').length < 3) {
            return m.reply(`*Cara Pakai:*\n${usedPrefix}setscript <Kategori> | <Nama SC> | <Harga> | <Urutan> | <Link HTTPS>\n\n*Contoh:*\n${usedPrefix}setscript SC Bot | Harps V1 | 25k | 1 | https://...`);
        }

        let parts = text.split('|').map(v => v.trim());
        let kategori = parts[0].toUpperCase();
        let nama = parts[1];
        let hargaStr = parts[2];
        let urutanStr = parts[3] || "99";
        let linkURL = parts[4] || ""; 

        if (linkURL && !linkURL.startsWith('http')) return m.reply("❌ Format Link salah! Harus ada https://");

        let hargaParsed = hargaStr.toLowerCase().replace(/,/g, '.'); 
        let multiplier = hargaParsed.endsWith('k') ? 1000 : (hargaParsed.endsWith('p') ? 1 : 1);
        let hargaFinal = parseFloat(hargaParsed.replace(/[kp]/g, '')) * multiplier;

        if (!nama || !hargaFinal || isNaN(hargaFinal) || hargaFinal < 100) return m.reply(`❌ Harga salah.`);

        let urutan = parseInt(urutanStr);
        if (isNaN(urutan)) urutan = 99;

        let idProduk = "SCR" + Math.floor(Math.random() * 10000);
        dbScript[idProduk] = { name: nama, price: hargaFinal, category: kategori, order: urutan, link: linkURL };
        fs.writeFileSync(dbPath, JSON.stringify(dbScript, null, 2));

        return m.reply(`✅ *Script Berhasil Ditambahkan!*\n\n• *ID:* ${idProduk}\n• *Nama:* ${nama}\n• *Harga:* Rp${hargaFinal.toLocaleString('id-ID')}\n• *Link Auto-Kirim:* ${linkURL ? "🟢 Ya" : "🔴 Tidak"}\n\nKetik *.script* buat ngecek.`);
    }

    // ==========================================
    // HAPUS SCRIPT (.delscript)
    // ==========================================
    if (command === 'delscript') {
        if (!isOwner) return m.reply("❌ Khusus Owner!");
        if (!text) return m.reply(`Kirim ID Script yang mau dihapus.\n\n*Contoh:* ${usedPrefix}delscript SCR1234\n_(Lu bisa liat ID produknya di menu .script)_`);
        
        let idProduk = text.trim();
        if (!dbScript[idProduk]) return m.reply(`❌ Gagal! ID Script *${idProduk}* nggak ketemu di database.`);
        
        let namaHapus = dbScript[idProduk].name;
        delete dbScript[idProduk];
        fs.writeFileSync(dbPath, JSON.stringify(dbScript, null, 2));
        
        return m.reply(`🗑️ ✅ Produk *${namaHapus}* (${idProduk}) berhasil dihapus selamanya dari etalase!`);
    }
};

handler.help = ['setscript', 'delscript'];
handler.tags = ['owner'];
handler.command = /^(setscript|delscript)$/i;

module.exports = handler;
