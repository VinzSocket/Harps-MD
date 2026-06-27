const crypto = require("crypto");
// Memanggil mesin khusus upload media (prepareWAMessageMedia)
const { prepareWAMessageMedia, generateWAMessageFromContent } = require('@vinzsocket/baileys');

const handler = async (m, { conn, text, command, usedPrefix, isOwner, participants }) => {
    
    // ==========================================
    // 1. FITUR HAPUS STATUS GRUP
    // ==========================================
    if (command === 'delswgc' || command === 'hapusswgc') {
        if (!m.quoted) return m.reply("❌ Balas (tag) status grup milik bot yang ingin dihapus.");
        
        try {
            // EKSTRAK ID PAKSA: Mengambil ID pesan dari kedalaman contextInfo
            let statusId = m.msg?.contextInfo?.stanzaId || m.quoted.id;
            
            if (!statusId) return m.reply("❌ Gagal mendapatkan ID pesan status.");

            // Kunci spesifik untuk menembak penghapusan pesan di grup
            let key = {
                remoteJid: m.chat,
                fromMe: true,
                id: statusId
            };

            await conn.sendMessage(m.chat, { delete: key });
            return await conn.sendMessage(m.chat, { react: { text: "🗑️", key: m.key } });
        } catch (e) {
            console.error(e);
            return m.reply("❌ Gagal menghapus status. Pastikan Anda me-reply status asli buatan bot.");
        }
    }

    // ==========================================
    // 2. FITUR MEMBUAT STATUS GRUP
    // ==========================================
    if (!m.isGroup) return m.reply("❌ Fitur membuat status (swgc) hanya bisa digunakan di dalam chat grup.");
    
    // Pengecekan Admin (Selain Owner, hanya Admin Grup yang bisa membuat status)
    let isSenderAdmin = participants.find(u => u.id === m.sender)?.admin;
    if (!isSenderAdmin && !isOwner) return m.reply("❌ Hanya Admin Grup yang bisa membuat status grup.");

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    // Prioritaskan teks dari command, jika kosong ambil dari caption gambar yang di-reply
    let caption = text ? text.trim() : (q.text || q.caption || "");
    let targetJid = m.chat;

    if (caption.includes("|") && isOwner) {
        const [newTarget, ...rest] = caption.split("|");
        targetJid = newTarget.trim();
        caption = rest.join("|").trim();
    }

    if (!caption && !mime) {
        return m.reply(`*Cara Pakai:*\n${usedPrefix}swgc <teks>\n\n*Fitur Media:*\nKirim/balas Gambar/Video/Audio dengan caption ${usedPrefix}swgc\n\n*Fitur Hapus:*\nBalas pesan status bot dengan ${usedPrefix}delswgc`);
    }

    try {
        // Fitur Tag/Mention
        let mentions = [];
        if (caption) {
            let matches = caption.match(/@(\d+)/g);
            if (matches) mentions = matches.map(v => v.replace('@', '') + '@s.whatsapp.net');
        }

        // ==========================================
        // SISTEM UNDUH MEDIA 
        // ==========================================
        let content = {};

        if (mime) {
            let media = await q.download?.();
            if (!media && typeof conn.downloadMediaMessage === 'function') {
                media = await conn.downloadMediaMessage(q);
            }
            if (!media) return m.reply("❌ Gagal mengunduh media. Coba kirim ulang medianya.");

            // ==========================================
            // PROSES UPLOAD MEDIA ANTI-GAGAL
            // Menggunakan prepareWAMessageMedia (Sama seperti menu.js)
            // ==========================================
            if (/image/.test(mime)) {
                let mediaMsg = await prepareWAMessageMedia({ image: media }, { upload: conn.waUploadToServer });
                content = mediaMsg;
                content.imageMessage.caption = caption;
                if (mentions.length) content.imageMessage.contextInfo = { mentionedJid: mentions };
            } 
            else if (/video/.test(mime)) {
                let mediaMsg = await prepareWAMessageMedia({ video: media }, { upload: conn.waUploadToServer });
                content = mediaMsg;
                content.videoMessage.caption = caption;
                if (mentions.length) content.videoMessage.contextInfo = { mentionedJid: mentions };
            } 
            else if (/audio/.test(mime)) {
                let mediaMsg = await prepareWAMessageMedia({ audio: media, ptt: true }, { upload: conn.waUploadToServer });
                content = mediaMsg;
                if (mentions.length) content.audioMessage.contextInfo = { mentionedJid: mentions };
            }
        } else {
            // Modifikasi warna background khusus Teks Murni
            const colors = [0xFFC24B51, 0xFF4A4242, 0xFF2B5B56, 0xFF654C4C, 0xFF54375A];
            content = {
                extendedTextMessage: {
                    text: caption,
                    backgroundArgb: colors[Math.floor(Math.random() * colors.length)],
                    textArgb: 0xFFFFFFFF,
                    contextInfo: mentions.length ? { mentionedJid: mentions } : {}
                }
            };
        }

        const messageSecret = crypto.randomBytes(32);

        // Membungkus pesan yang sudah terupload ke dalam format Status Grup
        const statusMsg = generateWAMessageFromContent(
            targetJid,
            {
                groupStatusMessageV2: { message: content },
                messageContextInfo: { messageSecret }
            },
            { userJid: conn.user.id }
        );

        // Mengirim Status ke Grup
        await conn.relayMessage(targetJid, statusMsg.message, { messageId: statusMsg.key.id });

        // Bereaksi ceklis jika sukses terkirim
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error(err);
        m.reply("❌ Terjadi kesalahan saat memproses status. Pastikan jaringan bot stabil.");
    }
};

handler.help = handler.command = ["upswgc", "swgc", "delswgc", "hapusswgc"];
handler.tags = ["group"];
handler.botAdmin = true;

module.exports = handler;
