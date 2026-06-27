const fs = require('fs');
const axios = require('axios');
const { generateWAMessageFromContent, buildInteractiveAdditionalNodes } = require('@vinzsocket/baileys');

const bayarQris = require('./_Qris-Ekse.js'); 

const dbPath = './db_panel.json';
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

// Helper format RAM/Disk biar rapi (Support Unlimited = 0)
function formatSize(mb) {
    let num = parseInt(mb);
    if (num === 0) return 'Unlimited'; // 0 Pterodactyl = Unlimited
    let cpuTampil = cpuLimit === 0 ? 'Unlimited' : cpuLimit + '%'; // tepat sebelum pesan suksesnya dikirim.
    if (isNaN(num)) num = 1024;
    return (num >= 1024 && num % 1024 === 0) ? (num / 1024) + ' GB' : num + ' MB';
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let dbPanel = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // ==========================================
    // MENU UTAMA PANEL (.panel)
    // ==========================================
    if (command === 'panel') {
        return m.reply(`🛒 *HARPS DIGITAL STORE*\n\nUntuk melihat katalog dan membeli server panel, silakan gunakan perintah:\n*${usedPrefix}buypanel <username_kamu>*\n\n*Contoh:* ${usedPrefix}buypanel vinz`);
    }

    // ==========================================
    // 1. TAHAP AWAL: USER KETIK .buypanel <username>
    // ==========================================
    if (command === 'buypanel') {
        let username = text.trim();
        
        if (!username) return m.reply(`❌ Masukkan username untuk akun panelnya!\n\n*Contoh:* ${usedPrefix}buypanel vinzbot`);
        if (username.includes(" ")) return m.reply("❌ Username tidak boleh menggunakan spasi.");

        let listProduk = Object.keys(dbPanel);
        if (listProduk.length === 0) return m.reply("🛒 Etalase masih kosong cuk!");

        // 🔥 URUTKAN ITEM BERDASARKAN HARGA (Termurah di atas)
        listProduk.sort((a, b) => dbPanel[a].price - dbPanel[b].price);

        let kategoriGrup = {};
        for (let id of listProduk) {
            let item = dbPanel[id];
            let cat = item.category || "UMUM"; 
            if (!kategoriGrup[cat]) kategoriGrup[cat] = []; 
            
            let ramTampil = formatSize(item.ram);

            kategoriGrup[cat].push({
                title: `${item.name}`,
                description: `💰 Harga: Rp${item.price.toLocaleString('id-ID')} | RAM: ${ramTampil}`,
                id: `${usedPrefix}checkoutpanel ${id} ${username}` 
            });
        }

        let listSections = [];
        for (let cat in kategoriGrup) {
            listSections.push({ title: `🏷️ KATEGORI: ${cat}`, rows: kategoriGrup[cat] });
        }

        let textData = `┌─⊷ *HARPS DIGITAL STORE*\n┃\n┃ Halo Kak 👋\n┃ Username Panel: *${username}*\n┃ \n┃ Silakan klik tombol di bawah\n┃ untuk memilih spesifikasi Server.\n└──────────────`;

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: { mentionedJid: [m.sender] }, 
                        body: { text: textData },
                        footer: { text: "© Harps Bot Auto Payment" },
                        nativeFlowMessage: {
                            buttons: [{
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "🛒 PILIH SERVER PANEL",
                                    sections: listSections
                                })
                            }]
                        }
                    }
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
        return;
    }

    // ==========================================
    // 2. TAHAP CHECKOUT & PEMBAYARAN QRIS
    // ==========================================
    if (command === 'checkoutpanel') {
        let argsData = text.split(' ');
        let idProduk = argsData[0];
        let username = argsData[1];
        
        let item = dbPanel[idProduk];
        if (!item) return m.reply("❌ Produk udah dihapus atau nggak ada.");
        if (!username) return m.reply("❌ Sistem error: Username hilang. Ulangi command .buypanel");

        if (!global.SetVps || !global.SetVps.apikey || !global.SetVps.domain) {
            return m.reply("Mohon Maaf Stok Panel Habis Kak😩");
        }

        try {
            await axios.get(`${global.SetVps.domain}/api/application/users`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${global.SetVps.apikey}`
                },
                timeout: 5000 
            });
        } catch (err) {
            console.error('[PTERO API ERROR]:', err.message);
            return m.reply("Mohon Maaf Stok Panel Habis Kak😩");
        }

        let password = username;
        if (password.length < 8) {
            let randomNum = Math.floor(Math.random() * (8000 - 1000 + 1)) + 1000;
            password = password + randomNum.toString();
        }

        let isOwner = global.owner && global.owner.includes(m.sender.split('@')[0]);

        let aksiSukses = async () => {
            try {
                const apiConfig = {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${global.SetVps.apikey}`
                    }
                };

                let createUser = await axios.post(`${global.SetVps.domain}/api/application/users`, {
                    email: `${username}@harps.net`,
                    username: username,
                    first_name: username,
                    last_name: "Buyer",
                    password: password
                }, apiConfig);

                let userId = createUser.data.attributes.id;

                let ramLimit = parseInt(item.ram);
                if (isNaN(ramLimit)) ramLimit = 1024;
                
                let diskLimit = parseInt(item.disk);
                if (isNaN(diskLimit)) diskLimit = 1024;
                
                let cpuLimit = parseInt(item.cpu);
                if (isNaN(cpuLimit)) cpuLimit = 100;

                await axios.post(`${global.SetVps.domain}/api/application/servers`, {
                    name: `${item.name} - ${username}`,
                    user: userId,
                    egg: global.SetVps.egg,
                    docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
                    startup: "npm start",
                    environment: {
                        BUNGEE_VERSION: "latest",
                        PRISMA: "false"
                    },
                    limits: { memory: ramLimit, swap: 0, disk: diskLimit, io: 500, cpu: cpuLimit },
                    feature_limits: { databases: 1, backups: 1, allocations: 1 },
                    deploy: {
                        locations: [global.SetVps.location],
                        dedicated_ip: false,
                        port_range: []
                    }
                }, apiConfig);

                let tanggalBeli = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                let ramTampil = formatSize(ramLimit);
                let diskTampil = formatSize(diskLimit);
                let cpuTampil = cpuLimit === 0 ? 'Unlimited' : cpuLimit + '%';
                
                let linkSaluran = global.channel || "Link saluran belum diatur"; 

                let successMsg = `.•｡ぅ🍃𝗱𝗮𝘁𝗮 𝗽𝗮𝗻𝗲𝗹🍃ゞ♪

ᕗ *Username*
≡ᐖ ${username}

ᕗ *Password*
≡ᐖ ${password}
 
ᕗ *Server Node*
≡ᐖ ${item.name}

ᕗ *Tanggal*
≡ᐖ ${tanggalBeli}

ᕗ *Spesifikasi:*
> RAM: ${ramTampil}
> Disk: ${diskTampil}
> CPU: ${cpuTampil}

ᕗ *login panel:*
≡ᐖ ${global.SetVps.domain}

ᕗ *saluran:*
≡ᐖ ${linkSaluran}

 ⊂⊃ ׄ ִ . . 𝗻𝗼𝘁𝗲𝗱 📝
 ֵ ⃙◌ ׄ៲៲ masa aktif 30 hari
 ֵ ⃙◌ ׄ៲៲ jangan ddos server
 ֵ ⃙◌ ׄ៲៲ jangan bagikan data ini ke siapapun
 ֵ ⃙◌ ׄ៲៲ wajib tutup domain saat ss
 ֵ ⃙◌ ׄ៲៲ saat claim garansi admin akan meminta bukti chat pembelian
 ֵ ⃙◌ ׄ៲៲ wajib mengikuti saluran
✨ Terimakasih sudah Order
Harps Bot`;
                
                await conn.sendMessage(m.sender, { text: successMsg });

            } catch (err) {
                console.error(err.response ? err.response.data : err.message);
                await conn.sendMessage(m.sender, { text: `❌ *PEMBAYARAN LUNAS*, tapi server gagal dibuat otomatis karena error sistem panel.\nHubungi Owner agar dibuatkan manual!` });
            }
        };

        await bayarQris(conn, m, item.name, item.price, usedPrefix, isOwner, aksiSukses);
    }

    // ==========================================
    // 3. FITUR BATAL
    // ==========================================
    if (command === 'batal' || command === 'cancel') {
        if (!global.qrisSesi || !global.qrisSesi[m.sender]) {
            return m.reply("❌ Lu lagi gak ada pesanan yang jalan.");
        }

        clearInterval(global.qrisSesi[m.sender].interval);
        try { await conn.sendMessage(m.chat, { delete: global.qrisSesi[m.sender].msgKey }); } catch (e) {}
        
        delete global.qrisSesi[m.sender];
        return m.reply(`✅ *Pesanan Dibatalkan.*\n\nKetik *${usedPrefix}buypanel <username>* kalau mau milih barang lain.`);
    }
};

handler.help = ['buypanel <username>', 'batal'];
handler.tags = ['store'];
handler.command = /^(panel|buypanel|checkoutpanel|batal|cancel)$/i; 

module.exports = handler;
