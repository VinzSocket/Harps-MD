const fs = require('fs');
const axios = require('axios'); 
const { generateWAMessageFromContent, buildInteractiveAdditionalNodes } = require('@vinzsocket/baileys');

const bayarQris = require('./_Qris-Ekse.js'); 

const dbPath = './db_script.json';
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));

// 🔥 DITAMBAHKAN 'isOwner' DI DALAM PARAMETER INI
let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    let dbScript = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // 1. MENU KATALOG
    if (command === 'script') {
        let listProduk = Object.keys(dbScript).map(id => { return { id: id, ...dbScript[id] }; });
        if (listProduk.length === 0) return m.reply("🛒 Etalase Script masih kosong cuk!");

        listProduk.sort((a, b) => a.order - b.order);

        let kategoriGrup = {};
        for (let item of listProduk) {
            let cat = item.category || "UMUM"; 
            if (!kategoriGrup[cat]) kategoriGrup[cat] = []; 
            kategoriGrup[cat].push({
                title: `${item.name}`,
                description: `💰 Harga: Rp${item.price.toLocaleString('id-ID')} | ID: ${item.id}`,
                id: `${usedPrefix}buyscript ${item.id}` 
            });
        }

        let listSections = [];
        for (let cat in kategoriGrup) {
            listSections.push({ title: `🏷️ KATEGORI: ${cat}`, rows: kategoriGrup[cat] });
        }

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: { mentionedJid: [m.sender] }, 
                        body: { text: `┌─⊷ *HARPS SCRIPT STORE*\n┃\n┃ Halo Kak 👋\n┃ Silakan pilih Source Code (SC)\n┃ yang kamu butuhkan.\n└──────────────` },
                        footer: { text: "© Harps Bot Auto Payment" },
                        nativeFlowMessage: {
                            buttons: [{
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "🛒 BUKA KATALOG SCRIPT",
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

    // 2. USER/OWNER KLIK BELI
    if (command === 'buyscript') {
        let idProduk = text.trim();
        let item = dbScript[idProduk];
        if (!item) return m.reply("❌ Script udah dihapus atau nggak ada.");

        // 🚀 NGOPER STATUS 'isOwner' KE MESIN KASIR!
        await bayarQris(conn, m, item.name, item.price, usedPrefix, isOwner, async () => {
            
            // PROSES DOWNLOAD FILE KE PM
            if (item.link && item.link.startsWith('http')) {
                try {
                    await conn.sendMessage(m.sender, { text: `⏳ *MENGUNDUH FILE...*\n\nPesanan *${item.name}* sedang ditarik dari server...` });
                    let res = await axios.get(item.link, { responseType: 'arraybuffer' });
                    let safeFileName = item.name.replace(/[^a-zA-Z0-9]/g, '_');

                    await conn.sendMessage(m.sender, {
                        document: res.data,
                        mimetype: 'application/zip',
                        fileName: `${safeFileName}.zip`,
                        caption: `🎁 *PESANAN SELESAI*\n\nBerikut adalah file Script *${item.name}*.\nTerima kasih sudah berbelanja!`
                    });

                } catch (err) {
                    await conn.sendMessage(m.sender, { text: `❌ *GAGAL MENGUNDUH FILE*\n\nLink mati. Ini link aslinya: ${item.link}` });
                }
            } else {
                await conn.sendMessage(m.sender, { text: `🎉 *LUNAS*\n\nPesanan Script *${item.name}* berhasil.` });
            }

        }); 
    }
};

handler.help = ['script'];
handler.tags = ['store'];
handler.command = /^(script|buyscript)$/i;

module.exports = handler;
