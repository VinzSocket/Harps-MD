const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { fromBuffer } = require('file-type');
const { generateWAMessageFromContent, buildInteractiveAdditionalNodes } = require('@vinzsocket/baileys');

// ==========================================
// UPLOADER LAPIS BAJA
// ==========================================
const apiBotcahx = async (buffer) => {
    let { ext } = (await fromBuffer(buffer)) || { ext: 'bin' };
    let bodyForm = new FormData();
    bodyForm.append("file", buffer, `file.${ext}`);
    let res = await fetch("https://file.botcahx.eu.org/api/upload.php", { method: "post", body: bodyForm });
    let data = await res.json();
    return data.result ? data.result.url : null;
};

const catbox = async (buffer) => {
    const { ext } = (await fromBuffer(buffer)) || {};
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, `file.${ext || 'bin'}`);
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity
    });
    return res.data;
};

const tele = async (buffer) => {
    const { ext } = (await fromBuffer(buffer)) || { ext: 'bin' };
    let form = new FormData();
    form.append('file', buffer, 'tmp.' + ext);
    let res = await fetch('https://telegra.ph/upload', { method: 'POST', body: form });
    let img = await res.json();
    if (img.error) throw img.error;
    return 'https://telegra.ph' + img[0].src;
};

const uploadMedia = async (buffer, mime) => {
    try { let url = await apiBotcahx(buffer); if (url) return url; } catch (e) { console.log('Botcahx Fail'); }
    try { let url = await catbox(buffer); if (url && url.startsWith('http')) return url; } catch (e) { console.log('Catbox Fail'); }
    if (mime && mime.startsWith('image/')) {
        try { let url = await tele(buffer); if (url) return url; } catch (e) { console.log('Tele Fail'); }
    }
    throw new Error('Semua CDN Gagal');
};

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let seconds = Math.floor((duration / 1000) % 60);
    return `${minutes} Menit ${seconds} Detik`;
}

const reminiSessions = {};

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
    let cmd = command.toLowerCase();
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    
    let user = global.db.data.users[m.sender];
    if (!user) return m.reply('❌ Data user tidak ditemukan.');
    
    let isPremium = user.premium || false;
    let limitCost = isOwner ? 0 : 100;
    let cooldownTime = isOwner ? 0 : (isPremium ? 300000 : 900000);

    if (/^(remini|enhancer|hd|hdvid|hdvideo)$/i.test(cmd)) {
        if (mime.includes('image')) cmd = 'reminifoto';
        else if (mime.includes('video')) cmd = 'reminivideo';
        else return m.reply(`❌ Kirim/Balas media dengan perintah *${usedPrefix + command}*`);
    }

    const setSession = () => {
        if (reminiSessions[m.sender]) clearTimeout(reminiSessions[m.sender]);
        reminiSessions[m.sender] = setTimeout(() => {
            conn.sendMessage(m.chat, { text: `⏳ @${m.sender.split('@')[0]} Sesi habis. Silakan kirim ulang media.`, mentions: [m.sender] });
            delete reminiSessions[m.sender];
        }, 300000); // 5 Menit
    };

    const clearSession = () => {
        if (reminiSessions[m.sender]) {
            clearTimeout(reminiSessions[m.sender]);
            delete reminiSessions[m.sender];
        }
    };

    // ==========================================
    // EKSEKUSI PROSES FOTO
    // ==========================================
    if (cmd === 'prosesfoto' && args.length >= 2) {
        if (!reminiSessions[m.sender]) return m.reply('⏳ Sesi habis. Silakan ulangi dari awal.');
        if (user.limit < limitCost) return m.reply(`❌ Limit kurang! Butuh ${limitCost} Limit.`);

        clearSession();
        let versi = args[0]; 
        let url = args[1];
        let scale = args[2] || ''; 

        let visualScale = '';
        if (scale === '2') visualScale = ' (360p)';
        else if (scale === '4') visualScale = ' (480p)';
        else if (scale === '6') visualScale = ' (720p)';
        else if (scale === '8') visualScale = ' (1080p)';
        else if (scale === '16') visualScale = ' (4K)';

        m.reply(`_⚙️ Memproses foto *Remini ${versi.toUpperCase()}${visualScale}*..._`);
        try {
            let apiUrl = '';
            if (versi === 'v1') apiUrl = `https://api.botcahx.eu.org/api/tools/remini?url=${url}&apikey=${global.btc}`;
            else if (versi === 'v2') apiUrl = `https://api.botcahx.eu.org/api/tools/remini-v2?url=${url}&apikey=${global.btc}`;
            else if (versi === 'v3') apiUrl = `https://api.botcahx.eu.org/api/tools/remini-v3?url=${url}&resolusi=${scale}&apikey=${global.btc}`;
            else if (versi === 'v4') apiUrl = `https://api.botcahx.eu.org/api/tools/remini-v4?url=${url}&resolusi=${scale}&apikey=${global.btc}`;

            let reqApi = await fetch(apiUrl);
            let jsonApi = await reqApi.json();
            if (!jsonApi.status) throw new Error("API Error");
            
            let resultUrl = jsonApi.result || jsonApi.url || jsonApi.data;
            let mediaRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });

            if (!isOwner) { user.limit -= limitCost; user.lastRemini = Date.now(); }
            
            let captionText = `乂 *E N H A N C E R  S U K S E S*\n\n◦ *Versi:* ${versi.toUpperCase()}${visualScale}\n◦ *Biaya:* ${isOwner ? 'Gratis' : `-${limitCost} Limit`}`;
            await conn.sendMessage(m.chat, { image: mediaRes.data, caption: captionText }, { quoted: m });
        } catch (e) {
            m.reply(`🚩 Gagal memproses gambar! API Key limit atau server sibuk.`);
        }
        return;
    }

    // ==========================================
    // EKSEKUSI PROSES VIDEO
    // ==========================================
    if (cmd === 'prosesvideo' && args.length >= 2) {
        if (!reminiSessions[m.sender]) return m.reply('⏳ Sesi habis. Silakan ulangi dari awal.');
        if (user.limit < limitCost) return m.reply(`❌ Limit kurang! Butuh ${limitCost} Limit.`);

        clearSession();
        let resolusi = args[0];
        let url = args[1];

        m.reply(`_⚙️ Memproses video *${resolusi}*..._`);
        try {
            let apiUrl = `https://api.botcahx.eu.org/api/tools/hdvideo?url=${url}&resolusi=${resolusi}&apikey=${global.btc}`;
            let reqApi = await fetch(apiUrl);
            let jsonApi = await reqApi.json();
            if (!jsonApi.status) throw new Error("API Error");

            let resultUrl = jsonApi.result || jsonApi.url || jsonApi.data;
            let mediaRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 300000 });

            if (!isOwner) { user.limit -= limitCost; user.lastRemini = Date.now(); }
            
            let captionText = `乂 *E N H A N C E R  S U K S E S*\n\n◦ *Resolusi:* ${resolusi}\n◦ *Biaya:* ${isOwner ? 'Gratis' : `-${limitCost} Limit`}`;
            await conn.sendMessage(m.chat, { video: mediaRes.data, mimetype: 'video/mp4', caption: captionText }, { quoted: m });
        } catch (e) {
            m.reply(`🚩 Gagal memproses video! API Key limit atau server penuh.`);
        }
        return;
    }

    // ==========================================
    // TAMPILAN MENU NATIVE FLOW (1 LIST MENU)
    // ==========================================
    if (cmd === 'reminifoto' || cmd === 'reminivideo') {
        if (!isOwner) {
            if (user.limit < limitCost) return m.reply(`❌ Saldo Limit kurang! Sisa: ${user.limit}`);
            if (user.lastRemini && (Date.now() - user.lastRemini) < cooldownTime) return m.reply(`⏳ Cooldown! Tunggu *${msToTime(cooldownTime - (Date.now() - user.lastRemini))}* lagi.`);
        }

        let isImageRequest = cmd === 'reminifoto';
        let isVideoRequest = cmd === 'reminivideo';

        if (isImageRequest && !mime.includes('image')) return m.reply(`❌ Kirim FOTO dengan perintah ini.`);
        if (isVideoRequest && !mime.includes('video')) return m.reply(`❌ Kirim VIDEO dengan perintah ini.`);
        
        m.reply('_☁️ Mengamankan media ke server sementara..._');
        let mediaBuffer = await q.download();
        let sizeMB = mediaBuffer.length / 1024 / 1024;
        
        if (isImageRequest && sizeMB > 15) return m.reply(`❌ Ukuran foto maks 15 MB.`);
        if (isVideoRequest && sizeMB > 45) return m.reply(`❌ Ukuran video maks 45 MB.`);
        
        let url;
        try {
            url = await uploadMedia(mediaBuffer, mime);
        } catch (e) {
            return m.reply(`❌ Gagal mengunggah media ke CDN.`);
        }

        let capt = `乂  *E N H A N C E R  M E D I A*\n\n◦ *Tarif:* ${isOwner ? 'Gratis (Owner)' : limitCost + ' Limit'}\n_Pilih kualitas yang diinginkan di bawah ini:_`;

        let dynamicButtons = [];

        if (isImageRequest) {
            // FOTO: Semuanya DIBUNGKUS DALAM 1 LIST MENU DENGAN KATEGORI (Sesuai Batasan Resolusi)
            dynamicButtons = [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "📋 List Remini",
                        sections: [
                            {
                                title: "Remini Klasik (Proses Langsung)",
                                highlight_label: "Standar",
                                rows: [
                                    { header: "", title: "Remini V1", description: "Enhance Kualitas Standar", id: `${usedPrefix}prosesfoto v1 ${url}` },
                                    { header: "", title: "Remini V2", description: "Enhance Kualitas Menengah", id: `${usedPrefix}prosesfoto v2 ${url}` }
                                ]
                            },
                            {
                                title: "Remini V3 (Kualitas Tajam)",
                                rows: [
                                    { header: "", title: "V3 - 360p", description: "Tajam Ringan", id: `${usedPrefix}prosesfoto v3 ${url} 2` },
                                    { header: "", title: "V3 - 480p", description: "Tajam Menengah", id: `${usedPrefix}prosesfoto v3 ${url} 4` },
                                    { header: "", title: "V3 - 720p", description: "Tajam HD", id: `${usedPrefix}prosesfoto v3 ${url} 6` },
                                    { header: "", title: "V3 - 1080p", description: "Tajam Full HD", id: `${usedPrefix}prosesfoto v3 ${url} 8` }
                                ]
                            },
                            {
                                title: "Remini V4 (Sangat Tajam)",
                                highlight_label: "Rekomendasi",
                                rows: [
                                    { header: "", title: "V4 - 360p", description: "Sangat Tajam Ringan", id: `${usedPrefix}prosesfoto v4 ${url} 2` },
                                    { header: "", title: "V4 - 480p", description: "Sangat Tajam Menengah", id: `${usedPrefix}prosesfoto v4 ${url} 4` },
                                    { header: "", title: "V4 - 720p", description: "Sangat Tajam HD", id: `${usedPrefix}prosesfoto v4 ${url} 6` },
                                    { header: "", title: "V4 - 1080p", description: "Sangat Tajam Full HD", id: `${usedPrefix}prosesfoto v4 ${url} 8` },
                                    { header: "", title: "V4 - 4K", description: "Sangat Tajam Ultra 4K", id: `${usedPrefix}prosesfoto v4 ${url} 16` }
                                ]
                            }
                        ]
                    })
                }
            ];
        } else if (isVideoRequest) {
            // VIDEO: 1 LIST MENU (Maksimal 4K)
            dynamicButtons = [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "🎥 Resolusi Video",
                        sections: [{
                            title: "Pilih Resolusi",
                            rows: [
                                { header: "", title: "Video 360p", description: "Standar", id: `${usedPrefix}prosesvideo 360p ${url}` },
                                { header: "", title: "Video 480p", description: "Menengah", id: `${usedPrefix}prosesvideo 480p ${url}` },
                                { header: "", title: "Video 720p", description: "HD", id: `${usedPrefix}prosesvideo 720p ${url}` },
                                { header: "", title: "Video 1080p", description: "Full HD", id: `${usedPrefix}prosesvideo 1080p ${url}` },
                                { header: "", title: "Video 4K", description: "Ultra HD (Lambat)", id: `${usedPrefix}prosesvideo 4k ${url}` }
                            ]
                        }]
                    })
                }
            ];
        }

        // Memanggil Native Flow V2
        // `hasMediaAttachment: false` akan ditangkap simple.js untuk disuntik Default.png!
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: { message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: {
                    contextInfo: { mentionedJid: [m.sender] },
                    body: { text: capt },
                    footer: { text: '© HARPS BOT MD' },
                    header: { hasMediaAttachment: false }, 
                    nativeFlowMessage: { buttons: dynamicButtons }
                }
            }}
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
        setSession();
        return;
    }
};

handler.help = ['reminifoto', 'reminivideo'];
handler.tags = ['tools'];
handler.command = /^(remini|reminifoto|reminivideo|hdvideo|hd|hdvid|enhancer|prosesfoto|prosesvideo)$/i;

module.exports = handler;