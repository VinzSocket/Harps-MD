const fs = require('fs');

const dbPath = './db_panel.json';

if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database', { recursive: true });
}
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

// Helper pinter menerjemahkan RAM / Disk (Termasuk membaca kata "Unli")
function parseSize(sizeStr) {
    let str = sizeStr.toLowerCase().replace(/\s+/g, '');
    
    // 🔥 Jika input adalah Unli/Unlimited, berikan nilai 0
    if (str === 'unli' || str === 'unlimited') return 0;

    let num = parseFloat(str);
    if (isNaN(num)) return 1024;
    
    if (str.endsWith('gb') || str.endsWith('g')) return num * 1024;
    if (str.endsWith('mb') || str.endsWith('m')) return num;
    
    return num < 50 ? num * 1024 : num;
}

// Helper buat nampilin format teks biar rapi
function formatSize(mb) {
    let num = parseInt(mb);
    if (num === 0) return 'Unlimited';
    if (isNaN(num)) num = 1024;
    return (num >= 1024 && num % 1024 === 0) ? (num / 1024) + ' GB' : num + ' MB';
}

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    let dbPanel = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // ==========================================
    // 1. TAMBAH PANEL (.setpanel)
    // ==========================================
    if (command === 'setpanel') {
        if (!isOwner) return m.reply("❌ Khusus Owner cuk!");
        
        if (!text || text.split('|').length < 6) {
            return m.reply(`*Cara Pakai:*\n${usedPrefix}setpanel <Kategori> | <Nama Panel> | <Harga> | <RAM> | <Disk> | <CPU>\n\n*Contoh input Unlimited:*\n• ${usedPrefix}setpanel PANEL PTERO | Panel Sultan | 50k | Unli | Unli | Unli\n• ${usedPrefix}setpanel PANEL PTERO | Panel 5GB | 15k | 5GB | Unli | 200`);
        }

        let parts = text.split('|').map(v => v.trim());
        let kategori = parts[0].toUpperCase();
        let nama = parts[1];
        let hargaStr = parts[2];
        let ramStr = parts[3];
        let diskStr = parts[4];
        
        // 🔥 DETEKSI CPU UNLIMITED
        let cpuStr = parts[5].toLowerCase();
        let cpu = (cpuStr === 'unli' || cpuStr === 'unlimited') ? 0 : (parseInt(cpuStr) || 100);

        let hargaParsed = hargaStr.toLowerCase().replace(/,/g, '.');
        let multiplier = hargaParsed.endsWith('k') ? 1000 : (hargaParsed.endsWith('p') ? 1 : 1);
        let hargaFinal = parseFloat(hargaParsed.replace(/[kp]/g, '')) * multiplier;

        if (!nama || !hargaFinal || isNaN(hargaFinal) || hargaFinal < 100) return m.reply(`❌ Harga salah.`);

        let ram = parseSize(ramStr);
        let disk = parseSize(diskStr);

        let idProduk = "PNL" + Math.floor(Math.random() * 10000);
        
        dbPanel[idProduk] = { 
            name: nama, 
            price: hargaFinal, 
            category: kategori, 
            ram: ram, 
            disk: disk, 
            cpu: cpu 
        };
        fs.writeFileSync(dbPath, JSON.stringify(dbPanel, null, 2));

        let ramTampil = formatSize(ram);
        let diskTampil = formatSize(disk);
        let cpuTampil = cpu === 0 ? 'Unlimited' : cpu + '%';

        return m.reply(`✅ *Panel Berhasil Ditambahkan!*\n\n• *ID:* ${idProduk}\n• *Nama:* ${nama}\n• *Harga:* Rp${hargaFinal.toLocaleString('id-ID')}\n• *Spesifikasi:* RAM ${ramTampil}, Disk ${diskTampil}, CPU ${cpuTampil}\n\nKetik *${usedPrefix}listpanel* buat ngecek daftarnya.`);
    }

    // ==========================================
    // 2. HAPUS PANEL (.delpanel)
    // ==========================================
    if (command === 'delpanel') {
        if (!isOwner) return m.reply("❌ Khusus Owner!");
        
        if (!text) return m.reply(`Kirim ID Panel yang mau dihapus.\n\n*Contoh:* ${usedPrefix}delpanel PNL1234\n_(Gunakan *${usedPrefix}listpanel* untuk melihat ID)_`);
        
        let idProduk = text.trim();
        if (!dbPanel[idProduk]) return m.reply(`❌ Gagal! ID Panel *${idProduk}* nggak ketemu di database.`);
        
        let namaHapus = dbPanel[idProduk].name;
        delete dbPanel[idProduk];
        fs.writeFileSync(dbPath, JSON.stringify(dbPanel, null, 2));
        
        return m.reply(`🗑️ ✅ Produk *${namaHapus}* (${idProduk}) berhasil dihapus selamanya dari etalase!`);
    }

    // ==========================================
    // 3. LIHAT DAFTAR PANEL (.listpanel)
    // ==========================================
    if (command === 'listpanel') {
        if (!isOwner) return m.reply("❌ Khusus Owner!");

        let listProduk = Object.keys(dbPanel);
        if (listProduk.length === 0) return m.reply(`📦 Database panel masih kosong.\nKetik *${usedPrefix}setpanel* untuk menambahkan produk baru.`);

        // 🔥 URUTKAN ITEM BERDASARKAN HARGA (Termurah di atas)
        listProduk.sort((a, b) => dbPanel[a].price - dbPanel[b].price);

        let teks = `📦 *DAFTAR PANEL DI DATABASE*\nTotal: *${listProduk.length}* Produk\n(Diurutkan dari harga termurah)\n\n`;

        for (let i = 0; i < listProduk.length; i++) {
            let id = listProduk[i];
            let item = dbPanel[id];
            
            let ramTampil = formatSize(item.ram);
            let diskTampil = formatSize(item.disk);
            let cpuTampil = item.cpu === 0 ? 'Unlimited' : item.cpu + '%';
            
            teks += `*${i + 1}. ${item.name}*\n`;
            teks += `• *ID Panel:* ${id}\n`;
            teks += `• *Harga:* Rp${item.price.toLocaleString('id-ID')}\n`;
            teks += `• *Spek:* RAM ${ramTampil} | Disk ${diskTampil} | CPU ${cpuTampil}\n`;
            teks += `• *Kategori:* ${item.category}\n\n`;
        }

        teks += `_🗑️ Ketik *${usedPrefix}delpanel <ID Panel>* untuk menghapus_`;
        
        return m.reply(teks);
    }
};

handler.help = ['setpanel', 'delpanel', 'listpanel'];
handler.tags = ['owner'];
handler.command = /^(setpanel|delpanel|listpanel)$/i;

module.exports = handler;
