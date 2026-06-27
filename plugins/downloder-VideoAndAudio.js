const { processDownload } = require('../lib/Downloader-Apikey');
const { generateWAMessageFromContent, prepareWAMessageMedia, buildInteractiveAdditionalNodes } = require('@vinzsocket/baileys');

const searchSessions = {};

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  let cmd = command.toLowerCase();

  const setSession = () => {
    if (searchSessions[m.sender]) clearTimeout(searchSessions[m.sender]);
    searchSessions[m.sender] = setTimeout(() => {
        conn.sendMessage(m.chat, { text: `⏳ @${m.sender.split('@')[0]} Sesi Pencarian Sudah Habis`, mentions: [m.sender] });
        delete searchSessions[m.sender];
    }, 180000); 
  };

  const clearSession = () => {
    if (searchSessions[m.sender]) {
        clearTimeout(searchSessions[m.sender]);
        delete searchSessions[m.sender];
    }
  };

  switch (cmd) {
    // ==========================================
    // 1. PINTEREST
    // ==========================================
    case 'pindl':
    case 'pin': {
      if (!args[0]) throw `乂  *P I N T E R E S T*\n\nMasukkan URL!\n◦ *Contoh:* ${usedPrefix}pindl https://pin.it/4CVodSq`;
      try {
        clearSession(); m.reply(wait);
        const res = await processDownload('pinterest', args[0]); // Auto URL
        let { media_type, image, title, video } = res.result.data;
        
        if (media_type === 'video/mp4') {
          await conn.sendMessage(m.chat, { video: { url: video }, mimetype: 'video/mp4', caption: `乂  *P I N T E R E S T  V I D E O*\n\n◦ *Title:* ${title}` }, { quoted: m });
        } else {
          conn.sendFile(m.chat, image, 'pindl.jpeg', `乂  *P I N T E R E S T  I M A G E*\n\n◦ *Title:* ${title}`, m);
        }
      } catch (e) { throw `Terjadi kesalahan saat memproses Pinterest!`; }
      break;
    }

    case 'pinterest': 
    case 'pinnext': {
      if (!text) throw `乂  *P I N T E R E S T  S E A R C H*\n\n◦ *Contoh:* ${usedPrefix}pinterest Zhao Lusi`;
      if (cmd === 'pinnext' && !searchSessions[m.sender]) return m.reply('⏳ Sesi pencarian habis.');

      m.reply(wait);
      try {
        let data = await processDownload('pinterest', text); // Auto Search
        if (!data.result || data.result.length === 0) throw 'Foto tidak ditemukan!';
        
        let imageUrl = data.result[Math.floor(Math.random() * data.result.length)];
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
                            buttons: [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⏭️ Next Foto", id: `${usedPrefix}pinnext ${text}` }) }]
                        }
                    }
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
        setSession();
      } catch (e) { throw eror; }
      break;
    }

    // ==========================================
    // 2. SPOTIFY (AUTO DIRECT/SEARCH LOGIC)
    // ==========================================
    case 'spotify': {
      if (!text) throw `乂  *S P O T I F Y*\n\nMasukkan URL atau judul lagu!\n◦ *Contoh:* ${usedPrefix + command} payung teduh`;
      clearSession();
      m.reply(wait);
      
      let targetUrl = text;
      const isUrl = /^(https?:\/\/)/i.test(text);

      if (!isUrl) {
          try {
              let searchJson = await processDownload('spotify', text); // Auto Search
              let searchRes = searchJson.result.data || searchJson.result;
              if (!searchRes || searchRes.length === 0) return m.reply('❌ Lagu tidak ditemukan!');
              
              targetUrl = searchRes[0].url; // Ekstrak link dari hasil search pertama
              await conn.reply(m.chat, `_Lagu ditemukan! Sedang mengunduh hasil teratas: *${searchRes[0].title}*..._`, m);
          } catch (e) { throw `🚩 Gagal mencari lagu!`; }
      } 
      
      try {
        let jsons = await processDownload('spotify', targetUrl); // Auto Download
        if (!jsons.status || !jsons.result) throw 'Data tidak valid';
        
        const { thumbnail, title, artist, duration, url } = jsons.result.data || jsons.result;
        
        let captionvid = `乂  *S P O T I F Y  P L A Y*\n\n ◦ *Title:* ${title}\n ◦ *Artist:* ${artist}\n ◦ *Duration:* ${duration}\n\n_Sedang mengirim audio..._`;
        await conn.sendFile(m.chat, thumbnail, "thumb.png", captionvid, m);
        await conn.sendMessage(m.chat, { audio: { url: url }, mimetype: 'audio/mpeg' }, { quoted: m });
      } catch (e) { m.reply(`🚩 Gagal mengunduh lagu! Pastikan URL benar atau API key aktif.`); }
      break;
    }

    // ==========================================
    // 3. TIKTOK 
    // ==========================================
    case 'tiktok':
    case 'tt':
    case 'tikdl':
    case 'tiktokdl':
    case 'tiktoknowm': {
      if (!text) throw `乂  *T I K T O K*\n\nMasukan URL!\n◦ *Contoh:* ${usedPrefix + command} https://vt.tiktok.com/ZSkGPK9Kj/`;    
      try {
          clearSession(); m.reply(wait);      
          const response = await processDownload('tiktok', text); // Auto Download
          const res = response.result;      
          
          let capt = `乂  *T I K T O K*\n\n◦ *Title:* ${res.title}\n\n_Pilih format unduhan di bawah ini:_`;
          let msg = generateWAMessageFromContent(m.chat, {
              viewOnceMessage: {
                  message: {
                      messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                      interactiveMessage: {
                          contextInfo: { mentionedJid: [m.sender] },
                          body: { text: capt },
                          footer: { text: 'TikTok Downloader' },
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
      } catch (e) { throw eror; }
      break;
    }

    case 'tiktoksearch':
    case 'ttsearch':
    case 'tts':
    case 'ttsnext': {
      if (!text) throw `乂  *T I K T O K  S E A R C H*\n\n◦ *Contoh:* ${usedPrefix}tts anime`;
      if (cmd === 'ttsnext' && !searchSessions[m.sender]) return m.reply('⏳ Sesi pencarian habis.');

      m.reply(wait);
      try {
        const api = await processDownload('tiktok', text); // Auto Search
        if (!api.result.data || api.result.data.length === 0) throw 'Video tidak ditemukan!';
        
        let limit = Math.min(5, api.result.data.length);
        let video = api.result.data[Math.floor(Math.random() * limit)]; 
        
        let capt = `乂  *T I K T O K  S E A R C H*\n\n  ◦ *Title*: ${video.title}\n  ◦ *Author*: ${video.author.nickname}\n  ◦ *Duration*: ${video.duration} detik\n  ◦ *Music*: ${video.music_info.title}\n`;
        let validTiktokUrl = `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`; 
        
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: { mentionedJid: [m.sender] },
                        body: { text: capt },
                        footer: { text: 'TikTok Search' },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎥 Download Video", id: `${usedPrefix}ttmp4 ${validTiktokUrl}` }) },
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎵 Ambil Audio", id: `${usedPrefix}ttaudio ${validTiktokUrl}` }) },
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⏭️ Next Video", id: `${usedPrefix}ttsnext ${text}` }) }
                            ]
                        }
                    }
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
        setSession();
      } catch (error) { throw `🚩 *Gagal mencari video!*`; }
      break;
    }

    case 'ttmp4': {
       if (!text) return;
       clearSession(); m.reply('_Memproses Video..._');
       try {
           const response = await processDownload('tiktok', text);
           if (response.result.video && response.result.video[0]) {
               await conn.sendMessage(m.chat, { video: { url: response.result.video[0] }, mimetype: 'video/mp4', caption: '乂  *T I K T O K  V I D E O*' }, { quoted: m });
           } else throw 'Video tidak tersedia';
       } catch (e) { m.reply('❌ Gagal memproses video!'); }
       break;
    }
    
    case 'ttaudio': {
       if (!text) return;
       clearSession(); m.reply('_Memproses Audio..._');
       try {
           const response = await processDownload('tiktok', text);
           if (response.result.audio && response.result.audio[0]) {
               await conn.sendMessage(m.chat, { audio: { url: response.result.audio[0] }, mimetype: 'audio/mpeg' }, { quoted: m });
           } else throw 'Audio tidak tersedia';
       } catch (e) { m.reply('❌ Gagal memproses audio!'); }
       break;
    }

    // ==========================================
    // 4. YOUTUBE
    // ==========================================
    case 'yts':
    case 'ytsearch': 
    case 'ytsnext': {
      if (!text) throw '乂  *Y O U T U B E*\n\nCari apa?';
      if (cmd === 'ytsnext' && !searchSessions[m.sender]) return m.reply('⏳ Sesi pencarian habis.');

      m.reply(wait);
      try {
          let data = await processDownload('youtube', text); // Auto Search via Botcahx API
          let results = data.result.data || data.result;
          if (!results || results.length === 0) throw 'Pencarian tidak ditemukan!';
          
          let limit = Math.min(5, results.length);
          let v = results[Math.floor(Math.random() * limit)];
          
          // Fallback variable jika struktur API botcahx sedikit berbeda
          let title = v.title || '-';
          let duration = v.timestamp || v.duration || '-';
          let ago = v.ago || v.published || '-';
          let views = v.views || '-';
          let url = v.url || v.videoUrl || '-';
          let thumbUrl = v.image || v.thumbnail || 'https://i.ibb.co/G9Vh9WJ/youtube.png';

          let capt = `乂  *Y O U T U B E  S E A R C H*\n\n ◦ *Title:* ${title}\n ◦ *Duration:* ${duration}\n ◦ *Uploaded:* ${ago}\n ◦ *Views:* ${views}\n ◦ *Link:* ${url}\n`;
          let media = await prepareWAMessageMedia({ image: { url: thumbUrl } }, { upload: conn.waUploadToServer });
          
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
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎥 Download Video", id: `${usedPrefix}ytmp4 ${url}` }) },
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎵 Ambil Audio", id: `${usedPrefix}ytmp3 ${url}` }) },
                                  { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⏭️ Next Video", id: `${usedPrefix}ytsnext ${text}` }) }
                              ]
                          }
                      }
                  }
              }
          }, { quoted: m });

          await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) });
          setSession();
      } catch (e) { throw `Pencarian gagal atau API error!`; }
      break;
    }

    case 'ytmp3':
    case 'yta': {
      if (!text) throw `*Example:* ${usedPrefix + command} https://www.youtube.com/watch?v=Z28dtg_QmFw`;
      clearSession(); m.reply(wait);
      try {
        const result = await processDownload('youtube', text); // Auto Download
        if (result.status && result.result && result.result.mp3) {
          await conn.sendMessage(m.chat, { audio: { url: result.result.mp3 }, mimetype: 'audio/mpeg' }, { quoted: m });
        } else throw 'Error: Unable to fetch audio';
      } catch (error) { throw eror; }
      break;
    }

    case 'ytmp4':
    case 'ytv': {
      if (!text) throw `*Example:* ${usedPrefix + command} https://www.youtube.com/watch?v=Z28dtg_QmFw`;
      clearSession(); m.reply(wait);
      try {
        const result = await processDownload('youtube', text); // Auto Download
        if (result.status && result.result && result.result.mp4) {
          await conn.sendMessage(m.chat, { video: { url: result.result.mp4 }, mimetype: 'video/mp4', caption: '乂  *Y O U T U B E  V I D E O*' }, { quoted: m });
        } else throw 'Error: Unable to fetch video';
      } catch (error) { throw eror; }
      break;
    }
  }
};

handler.help = ['pindl', 'pinterest', 'spotify', 'tikdl', 'tiktok', 'tts', 'ytmp3', 'yts', 'ytmp4'];
handler.tags = ['downloader'];
handler.command = /^(pindl|pin|pinterest|pinnext|spotify|tikdl|tiktok|tt|tiktokdl|tiktoknowm|tiktoksearch|ttsearch|tts|ttsnext|ttmp4|ttaudio|ytmp3|yta|yts(earch)?|ytsnext|ytmp4|ytv)$/i;
handler.limit = true;

module.exports = handler;