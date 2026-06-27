const fetch = require('node-fetch');
const axios = require('axios');
const { tiktokdl } = require('tiktokdl');
const yts = require('yt-search');
const { generateWAMessageFromContent, prepareWAMessageMedia, buildInteractiveAdditionalNodes } = require('@vinzsocket/baileys');

// ==========================================
// VARIABLE PENYIMPANAN SESI
// ==========================================
const searchSessions = {};

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  let cmd = command.toLowerCase();

  // ==========================================
  // HELPER FUNGSI SESI 3 MENIT
  // ==========================================
  const setSession = () => {
    // Bersihkan sesi lama jika pengguna mencari lagi sebelum 3 menit
    if (searchSessions[m.sender]) clearTimeout(searchSessions[m.sender]);
    
    // Set timer baru selama 3 menit (180.000 ms)
    searchSessions[m.sender] = setTimeout(() => {
        conn.sendMessage(m.chat, { 
            text: `⏳ @${m.sender.split('@')[0]} Sesi Pencarian Sudah Habis`, 
            mentions: [m.sender] 
        });
        delete searchSessions[m.sender];
    }, 180000); 
  };

  const clearSession = () => {
    // Mematikan timer jika pengguna mengunduh file, agar tidak dikirimi pesan sesi habis
    if (searchSessions[m.sender]) {
        clearTimeout(searchSessions[m.sender]);
        delete searchSessions[m.sender];
    }
  };

  switch (cmd) {
    // ==========================================
    // 1. PINTEREST DOWNLOADER & SEARCH
    // ==========================================
    case 'pindl':
    case 'pin': {
      if (!args[0]) throw `乂  *P I N T E R E S T*\n\nMasukkan URL!\n◦ *Contoh:* ${usedPrefix}pindl https://pin.it/4CVodSq`;
      if (!args[0].startsWith('https://')) throw `Harus memasukkan URL yang valid dengan format *https://*`;
      try {
        clearSession(); // Menghentikan sesi karena langsung download
        m.reply(wait);
        const api = await fetch(`https://api.botcahx.eu.org/api/download/pinterest?url=${args[0]}&apikey=${btc}`);
        const res = await api.json();
        let { media_type, image, title, video } = res.result.data;
        if (media_type === 'video/mp4') {
          await conn.sendMessage(m.chat, { video: { url: video }, mimetype: 'video/mp4', caption: `乂  *P I N T E R E S T  V I D E O*\n\n◦ *Title:* ${title}` }, { quoted: m });
        } else {
          conn.sendFile(m.chat, image, 'pindl.jpeg', `乂  *P I N T E R E S T  I M A G E*\n\n◦ *Title:* ${title}`, m);
        }
      } catch (e) {
        throw `Terjadi kesalahan!`;
      }
      break;
    }

    case 'pinterest': 
    case 'pinnext': {
      if (!text) throw `乂  *P I N T E R E S T  S E A R C H*\n\n◦ *Contoh:* ${usedPrefix}pinterest Zhao Lusi`;
      
      // PROTEKSI: Jika lewat tombol Next tapi sesi sudah habis/tidak ada
      if (cmd === 'pinnext' && !searchSessions[m.sender]) {
          return m.reply('⏳ Sesi pencarian telah habis. Silakan ketik perintah pencarian baru dari awal.');
      }

      m.reply(wait);
      try {
        let response = await fetch(`https://api.botcahx.eu.org/api/search/pinterest?text1=${text}&apikey=${btc}`);
        let data = await response.json();   
        
        if (!data.result || data.result.length === 0) throw 'Foto tidak ditemukan!';
        
        let randomIndex = Math.floor(Math.random() * data.result.length);
        let imageUrl = data.result[randomIndex];

        let media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer });
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: { mentionedJid: [m.sender] },
                        body: { text: `乂  *P I N T E R E S T*\n\n◦ *Query:* ${text}\n◦ *Result:* Acak` },
                        footer: { text: 'Pinterest Search Image' },
                        header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    // Tombol Next sekarang memanggil 'pinnext', bukan 'pinterest'
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({ display_text: "⏭️ Next Foto", id: `${usedPrefix}pinnext ${text}` })
                                }
                            ]
                        }
                    }
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
        
        // Memulai Timer Sesi 3 Menit
        setSession();
      } catch (e) {
        throw eror;
      }
      break;
    }

    // ==========================================
    // 2. SPOTIFY (LANGSUNG DOWNLOAD HASIL PERTAMA)
    // ==========================================
    case 'spotify': {
      if (!args[0]) throw `乂  *S P O T I F Y*\n\nMasukkan URL atau judul lagu!\n◦ *Contoh:* ${usedPrefix + command} payung teduh`;
      clearSession();
      m.reply(wait);
      
      let targetUrl = args[0];

      if (!targetUrl.match(/https:\/\/open\.spotify\.com/)) {
        const queryText = args.join(" ");
        try {
          const searchApi = await fetch(`https://api.botcahx.eu.org/api/search/spotify?query=${queryText}&apikey=${btc}`);
          let searchJson = await searchApi.json();
          let searchRes = searchJson.result.data || searchJson.result;
          
          if (!searchRes || searchRes.length === 0) return m.reply('❌ Lagu tidak ditemukan!');
          
          targetUrl = searchRes[0].url;
          await conn.reply(m.chat, `_Lagu ditemukan! Sedang mengunduh hasil teratas: *${searchRes[0].title}*..._`, m);
        } catch (e) {
          throw `🚩 Gagal mencari lagu! Pastikan kata kunci benar atau API aktif.`;
        }
      } 
      
      try {
        const res = await fetch(`https://api.botcahx.eu.org/api/download/spotify?url=${targetUrl}&apikey=${btc}`);
        let jsons = await res.json();
        
        if (!jsons.status || !jsons.result) throw 'Data tidak valid';
        
        const { thumbnail, title, artist, duration, url } = jsons.result.data || jsons.result;
        
        let captionvid = `乂  *S P O T I F Y  P L A Y*\n\n`;
        captionvid += ` ◦ *Title:* ${title}\n`;
        captionvid += ` ◦ *Artist:* ${artist}\n`;
        captionvid += ` ◦ *Duration:* ${duration}\n`;
        captionvid += `\n_Sedang mengirim audio, harap tunggu..._`;
        
        await conn.sendFile(m.chat, thumbnail, "thumb.png", captionvid, m);
        await conn.sendMessage(m.chat, { audio: { url: url }, mimetype: 'audio/mpeg' }, { quoted: m });
      } catch (e) {
        m.reply(`🚩 Gagal mengunduh lagu! Pastikan URL benar atau API key aktif.`);
      }
      break;
    }

    // ==========================================
    // 3. TIKTOK & TIKTOK SEARCH
    // ==========================================
    case 'tiktok':
    case 'tt':
    case 'tikdl':
    case 'tiktokdl':
    case 'tiktoknowm': {
      if (!text) throw `乂  *T I K T O K*\n\nMasukan URL!\n◦ *Contoh:* ${usedPrefix + command} https://vt.tiktok.com/ZSkGPK9Kj/`;    
      try {
          clearSession();
          if (!text.match(/tiktok/gi) && !text.match(/douyin/gi)) throw `URL Tidak Ditemukan!`;
          m.reply(wait);      
  
          const response = await axios.get(`https://api.botcahx.eu.org/api/dowloader/tiktok?url=${text}&apikey=${btc}`);
          const res = response.data.result;      
          var { title } = res;
          
          let capt = `乂  *T I K T O K*\n\n◦ *Title:* ${title}\n\n_Pilih format unduhan di bawah ini:_`;
          
          let msg = generateWAMessageFromContent(m.chat, {
              viewOnceMessage: {
                  message: {
                      messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                      interactiveMessage: {
                          contextInfo: { mentionedJid: [m.sender] },
                          body: { text: capt },
                          footer: { text: 'TikTok Downloader' },
                          header: { hasMediaAttachment: false },
                          nativeFlowMessage: {
                              buttons: [
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎥 Download Video", id: `${usedPrefix}ttmp4 ${text}` }) },
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎵 Ambil Audio", id: `${usedPrefix}ttaudio ${text}` }) }
                              ]
                          }
                      }
                  }
              }
          }, { quoted: m });

          await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });

      } catch (e) {
          throw eror;
      }
      break;
    }

    case 'tiktoksearch':
    case 'ttsearch':
    case 'tts':
    case 'ttsnext': {
      if (!text) throw `乂  *T I K T O K  S E A R C H*\n\n◦ *Contoh:* ${usedPrefix}tts anime`;

      // PROTEKSI: Jika lewat tombol Next tapi sesi sudah habis/tidak ada
      if (cmd === 'ttsnext' && !searchSessions[m.sender]) {
          return m.reply('⏳ Sesi pencarian telah habis. Silakan ketik perintah pencarian baru dari awal.');
      }

      m.reply(wait);
      try {
        const res = await fetch(`https://api.botcahx.eu.org/api/search/tiktoks?query=${text}&apikey=${btc}`);
        const api = await res.json(); 
        
        if (!api.result.data || api.result.data.length === 0) throw 'Video tidak ditemukan!';
        
        let limit = Math.min(5, api.result.data.length);
        let randomIndex = Math.floor(Math.random() * limit);
        let video = api.result.data[randomIndex]; 
        
        let capt = `乂  *T I K T O K  S E A R C H*\n\n`;
        capt += `  ◦ *Title*: ${video.title}\n`;
        capt += `  ◦ *Author*: ${video.author.nickname}\n`;
        capt += `  ◦ *Duration*: ${video.duration} detik\n`;
        capt += `  ◦ *Music*: ${video.music_info.title}\n`;

        let validTiktokUrl = `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`; 
        
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: { mentionedJid: [m.sender] },
                        body: { text: capt },
                        footer: { text: 'TikTok Search' },
                        header: { hasMediaAttachment: false },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎥 Download Video", id: `${usedPrefix}ttmp4 ${validTiktokUrl}` }) },
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎵 Ambil Audio", id: `${usedPrefix}ttaudio ${validTiktokUrl}` }) },
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⏭️ Next Video", id: `${usedPrefix}ttsnext ${text}` }) } // Memanggil ttsnext
                            ]
                        }
                    }
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
        
        // Memulai Timer Sesi 3 Menit
        setSession();
      } catch (error) {
        throw `🚩 *Gagal mencari video!*`;
      }
      break;
    }

    // ==========================================
    // HANDLER KHUSUS TOMBOL TIKTOK (FIXED BIN & AUDIO)
    // ==========================================
    case 'ttmp4': {
       if (!text) return;
       clearSession();
       m.reply('_Memproses Video..._');
       try {
           const response = await axios.get(`https://api.botcahx.eu.org/api/dowloader/tiktok?url=${text}&apikey=${btc}`);
           const res = response.data.result;
           if (res.video && res.video[0]) {
               await conn.sendMessage(m.chat, { video: { url: res.video[0] }, mimetype: 'video/mp4', caption: '乂  *T I K T O K  V I D E O*' }, { quoted: m });
           } else throw 'Video tidak tersedia';
       } catch (e) { m.reply('❌ Gagal memproses video!'); }
       break;
    }
    
    case 'ttaudio': {
       if (!text) return;
       clearSession();
       m.reply('_Memproses Audio..._');
       try {
           const response = await axios.get(`https://api.botcahx.eu.org/api/dowloader/tiktok?url=${text}&apikey=${btc}`);
           const res = response.data.result;
           if (res.audio && res.audio[0]) {
               await conn.sendMessage(m.chat, { audio: { url: res.audio[0] }, mimetype: 'audio/mpeg' }, { quoted: m });
           } else throw 'Audio tidak tersedia';
       } catch (e) { m.reply('❌ Gagal memproses audio!'); }
       break;
    }

    // ==========================================
    // 4. YOUTUBE SEARCH & DOWNLOAD
    // ==========================================
    case 'yts':
    case 'ytsearch': 
    case 'ytsnext': {
      if (!text) throw '乂  *Y O U T U B E*\n\nCari apa?';
      
      // PROTEKSI: Jika lewat tombol Next tapi sesi sudah habis/tidak ada
      if (cmd === 'ytsnext' && !searchSessions[m.sender]) {
          return m.reply('⏳ Sesi pencarian telah habis. Silakan ketik perintah pencarian baru dari awal.');
      }

      m.reply(wait);
      
      let results = await yts(text);
      if (!results.all || results.all.length === 0) throw 'Pencarian tidak ditemukan!';
      
      let limit = Math.min(5, results.all.length);
      let randomIndex = Math.floor(Math.random() * limit);
      let v = results.all[randomIndex];
      
      if (v.type === 'video') {
          let capt = `乂  *Y O U T U B E  S E A R C H*\n\n`;
          capt += ` ◦ *Title:* ${v.title}\n`;
          capt += ` ◦ *Duration:* ${v.timestamp}\n`;
          capt += ` ◦ *Uploaded:* ${v.ago}\n`;
          capt += ` ◦ *Views:* ${v.views} views\n`;
          capt += ` ◦ *Link:* ${v.url}\n`;

          let media = await prepareWAMessageMedia({ image: { url: v.image } }, { upload: conn.waUploadToServer });
          
          let msg = generateWAMessageFromContent(m.chat, {
              viewOnceMessage: {
                  message: {
                      messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                      interactiveMessage: {
                          contextInfo: { mentionedJid: [m.sender] },
                          body: { text: capt },
                          footer: { text: 'YouTube Search' },
                          header: { hasMediaAttachment: true, imageMessage: media.imageMessage },
                          nativeFlowMessage: {
                              buttons: [
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎥 Download Video", id: `${usedPrefix}ytmp4 ${v.url}` }) },
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎵 Ambil Audio", id: `${usedPrefix}ytmp3 ${v.url}` }) },
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⏭️ Next Video", id: `${usedPrefix}ytsnext ${text}` }) } // Memanggil ytsnext
                              ]
                          }
                      }
                  }
              }
          }, { quoted: m });

          await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
          
          // Memulai Timer Sesi 3 Menit
          setSession();
      } else {
          m.reply(`Channel Ditemukan:\n*${v.name}*\n${v.url}`);
      }
      break;
    }

    case 'ytmp3':
    case 'yta': {
      if (!text) throw `*Example:* ${usedPrefix + command} https://www.youtube.com/watch?v=Z28dtg_QmFw`;
      clearSession();
      m.reply(wait);
      try {
        const response = await fetch(`https://api.botcahx.eu.org/api/dowloader/yt?url=${encodeURIComponent(text)}&apikey=${btc}`);
        const result = await response.json();
    
        if (result.status && result.result && result.result.mp3) {
          await conn.sendMessage(m.chat, { audio: { url: result.result.mp3 }, mimetype: 'audio/mpeg' }, { quoted: m });
        } else {
          throw 'Error: Unable to fetch audio';
        }
      } catch (error) {
        throw eror;
      }
      break;
    }

    case 'ytmp4':
    case 'ytv': {
      if (!text) throw `*Example:* ${usedPrefix + command} https://www.youtube.com/watch?v=Z28dtg_QmFw`;
      clearSession();
      m.reply(wait);
      try {
        const response = await fetch(`https://api.botcahx.eu.org/api/dowloader/yt?url=${encodeURIComponent(text)}&apikey=${btc}`);
        const result = await response.json();
    
        if (result.status && result.result && result.result.mp4) {
          await conn.sendMessage(m.chat, { video: { url: result.result.mp4 }, mimetype: 'video/mp4', caption: '乂  *Y O U T U B E  V I D E O*' }, { quoted: m });
        } else {
          throw 'Error: Unable to fetch video';
        }
      } catch (error) {
        throw eror;
      }
      break;
    }
  }
};

// ==========================================
// KONFIGURASI GLOBAL COMMANDS
// ==========================================
handler.help = [
  'pindl <url>',
  'pinterest <keyword>',
  'spotify <query/url>',
  'tikdl <url>',
  'tiktok <url>',
  'tts <keyword>',
  'ytmp3 <url>',
  'yts <pencarian>',
  'ytmp4 <url>'
];
handler.tags = ['downloader', 'internet', 'tools'];
// Registrasi semua alias termasuk command 'next'
handler.command = /^(pindl|pin|pinterest|pinnext|spotify|tikdl|tiktok|tt|tiktokdl|tiktoknowm|tiktoksearch|ttsearch|tts|ttsnext|ttmp4|ttaudio|ytmp3|yta|yts(earch)?|ytsnext|ytmp4|ytv)$/i;

handler.limit = true;
handler.group = false;
handler.premium = false;

module.exports = handler;
