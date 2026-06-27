/*
* Last update : 2026/06/22
* Reworked UI: Native Flow V2 & Legacy List Integration
* ULTIMATE: GLOBAL AUTO-DOCUMENT UNTUK SEMUA PLUGIN TEKS!
* FULL VERSION - TIDAK ADA KODE YANG DIKURANGI - FIX BARIS 998
*/

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif')

const baileysPkg = global.baileysObj || require('@vinzsocket/baileys');
const baileys = { ...baileysPkg, makeWASocket: baileysPkg.default || baileysPkg.makeWASocket };

const {
    makeWASocket,
    makeWALegacySocket,
    extractMessageContent,
    makeInMemoryStore,
    proto,
    prepareWAMessageMedia,
    downloadContentFromMessage,
    getBinaryNodeChild,
    jidDecode,
    areJidsSameUser,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    buildInteractiveAdditionalNodes,
    WAMessageStubType,
    WA_DEFAULT_EPHEMERAL,
    S_WHATSAPP_NET,
} = baileys
const { toAudio, toPTT, toVideo } = require('./converter')
const chalk = require('chalk')
const fetch = require('node-fetch')
const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')
const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const pino = require('pino')
const util = require('util')
const NodeCache = require('node-cache');
const axios = require('axios');

exports.makeWASocket = (connectionOptions, options = {}) => {
 let conn = (options["legacy"] ? makeWALegacySocket : makeWASocket)(connectionOptions)
 
    // ==========================================
    // OVERRIDE SENDMESSAGE: AUTO-DOCUMENT & AUTO-NEWSLETTER GLOBAL
    // ==========================================
    const originalSendMessage = conn.sendMessage.bind(conn);
    conn.sendMessage = async (jid, content, options) => {
        if (content && typeof content === 'object' && !content.react && !content.delete) {
            
            // 🌟 1. FITUR BARU: AUTO-DOCUMENT UNTUK SEMUA PESAN TEKS DARI PLUGIN MANAPUN!
            if (content.text && !content.image && !content.video && !content.document && !content.sticker && !content.audio && !content.contacts && !content.poll) {
                try {
                    let imgPath = './image/Default.png';
                    if (fs.existsSync(imgPath)) {
                        let defaultImg = fs.readFileSync(imgPath);
                        // Ubah format menjadi Document agar rapi berkotak!
                        content.document = defaultImg;
                        content.mimetype = 'image/jpeg';
                        content.fileName = 'HARPS MD';
                        content.jpegThumbnail = defaultImg;
                        content.caption = content.text; // Teks asli jadi caption
                        delete content.text; 
                    }
                } catch (e) {
                    console.error("Gagal memproses Auto-Document Global:", e);
                }
            }

            // 🌟 2. AUTO-NEWSLETTER (LABEL SALURAN) UNTUK SEMUA PESAN
            content.contextInfo = {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363281044075112@newsletter", 
                    newsletterName: "📢 Vinz MD",
                    serverMessageId: 143
                },
                ...(content.contextInfo || {}) 
            };
        }
        return await originalSendMessage(jid, content, options);
    };

    // ==========================================
    // OVERRIDE RELAYMESSAGE - AUTO DOCUMENT UNTUK TOMBOL/LIST NATIVE FLOW
    // ==========================================
    const originalRelayMessage = conn.relayMessage.bind(conn);
    conn.relayMessage = async (jid, message, options) => {
        try {
            let interactiveMsg = message?.viewOnceMessage?.message?.interactiveMessage || 
                                 message?.viewOnceMessageMessage?.message?.interactiveMessage || 
                                 message?.interactiveMessage;

            if (interactiveMsg) {
                if (!interactiveMsg.header || !interactiveMsg.header.hasMediaAttachment) {
                    let defaultBuffer;
                    try {
                        defaultBuffer = fs.readFileSync('./image/Default.png');
                    } catch (e) {
                        defaultBuffer = null;
                    }

                    if (defaultBuffer) {
                        let mediaMessage = await prepareWAMessageMedia({
                            document: defaultBuffer,
                            fileName: 'HARPS MD',
                            mimetype: 'image/jpeg',
                            jpegThumbnail: defaultBuffer
                        }, { upload: conn.waUploadToServer });

                        if (!interactiveMsg.header) interactiveMsg.header = {};
                        interactiveMsg.header.hasMediaAttachment = true;
                        
                        Object.assign(interactiveMsg.header, mediaMessage);
                    }
                }
            }
        } catch (err) {
            console.error("Error Inject Default Image di Tombol:", err);
        }
        return await originalRelayMessage(jid, message, options);
    };

    conn.isLid = new NodeCache({ stdTTL: 60 * 60 });

    conn.decodeJid = (jid) => {
        if (!jid || typeof jid !== 'string') return jid || null
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid
        } else return jid
    }

    async function resolveLidToPn(conn, lidJid) {
        try {
            let pn = await conn.signalRepository.lidMapping.getPNForLID(lidJid);
            if (!pn || typeof pn !== 'string') return null;

            if (pn.includes(':')) pn = pn.split(':')[0];
            if (!pn.endsWith('@s.whatsapp.net')) pn += '@s.whatsapp.net';

            conn.isLid.set(lidJid, pn);
            return pn;
        } catch {
            return null;
        }
    }

    conn.getJid = (sender) => {
        if (!sender) return sender;
        let jid = conn.decodeJid(sender);
        if (typeof jid !== 'string') return String(sender || '');
        if (!jid.endsWith('@lid')) return jid;

        if (conn.isLid?.has(jid)) {
            const cached = conn.isLid.get(jid);
            if (typeof cached === 'string' && cached.endsWith('@s.whatsapp.net')) return cached;
        }

        resolveLidToPn(conn, jid).catch(() => {});

        for (const chat of Object.values(conn.chats || {})) {
            if (!chat?.metadata?.participants) continue;
            const participant = chat.metadata.participants.find(p =>
                p.lid === jid || p.id === jid || p.jid === jid || (p.phoneNumber && jid === conn.decodeJid(p.phoneNumber))
            );

            if (participant) {
                let resolved = participant.phoneNumber || participant.jid || participant.id || (participant.lid && conn.isLid.get(participant.lid));
                if (typeof resolved !== 'string') continue;
                if (resolved.includes(':')) resolved = resolved.split(':')[0];
                if (!resolved.endsWith('@s.whatsapp.net')) resolved += '@s.whatsapp.net';

                conn.isLid.set(jid, resolved);
                return resolved;
            }
        }
        return jid;
    };

    if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id)
    if (!conn.chats) conn.chats = {}

    function updateNameToDb(contacts) {
        if (!contacts) return
        for (const contact of contacts) {
            const id = conn.decodeJid(contact.id)
            if (!id) continue
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            conn.chats[id] = {
                ...chats,
                ...({
                    ...contact, id, ...(id.endsWith('@g.us') ?
                        { subject: contact.subject || chats.subject || '' } :
                        { name: contact.notify || chats.name || chats.notify || '' })
                } || {})
            }
        }
    }
	
    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('chats.set', async ({ chats }) => {
        for (const { id: rawId, name, readOnly } of chats) {
            let id = conn.decodeJid(rawId)
            if (!id) continue
            const isGroup = id.endsWith('@g.us')
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            chats.isChats = !readOnly
            if (name) chats[isGroup ? 'subject' : 'name'] = name
            if (isGroup) {
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (!metadata) continue
                chats.subject = name || metadata.subject
                chats.metadata = metadata
            }
        }
    })
    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            id = conn.decodeJid(id)
            if (!(id in conn.chats)) conn.chats[id] = { id }
            conn.chats[id].isChats = true

            const groupMetadata = await conn.groupMetadata(id).catch(_ => null)
            if (groupMetadata) {
                conn.chats[id] = {
                    ...conn.chats[id],
                    subject: groupMetadata.subject,
                    metadata: groupMetadata
                }
            }
        } catch (err) {
            console.error('Error group-participants.update:', err)
        }
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        for (const update of groupsUpdates) {
            const id = conn.decodeJid(update.id)
            if (!id) continue
            const isGroup = id.endsWith('@g.us')
            if (!isGroup) continue
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = { id }
            chats.isChats = true
            const metadata = await conn.groupMetadata(id).catch(_ => null)
            if (!metadata) continue
            chats.subject = metadata.subject
            chats.metadata = metadata
        }
    })
    conn.ev.on('chats.upsert', async function chatsUpsertPushToDb(chatsUpsert) {
        const { id, name } = chatsUpsert
        if (!id) return
        let chats = conn.chats[id] = { ...conn.chats[id], ...chatsUpsert, isChats: true }
        const isGroup = id.endsWith('@g.us')
        if (isGroup) {
            const metadata = await conn.groupMetadata(id).catch(_ => null)
            if (metadata) {
                chats.subject = name || metadata.subject
                chats.metadata = metadata
            }
            const groups = await conn.groupFetchAllParticipating().catch(_ => ({})) || {}
            for (const group in groups) conn.chats[group] = { id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
        }
    })
    conn.ev.on('presence.update', async function presenceUpdatePushToDb({ id, presences }) {
        const sender = Object.keys(presences)[0] || id
        const _sender = conn.decodeJid(sender)
        const presence = presences[sender]['lastKnownPresence'] || 'composing'
        let chats = conn.chats[_sender]
        if (!chats) chats = conn.chats[_sender] = { id: sender }
        chats.presences = presence
        if (id.endsWith('@g.us')) {
            let chats = conn.chats[id]
            if (!chats) {
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (metadata) chats = conn.chats[id] = { id, subject: metadata.subject, metadata }
            }
            chats.isChats = true
        }
    })

    conn.ev.on('lid-mapping.update', (updates) => {
        for (const { lid, pn } of updates) {
            if (lid?.endsWith('@lid') && pn?.endsWith('@s.whatsapp.net')) conn.isLid.set(lid, pn)
        }
    })
    
    conn.logger = {
        ...conn.logger,
        info(...args) { console.log(chalk.bold.rgb(57, 183, 16)(`INFO [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.cyan(util.format(...args))) },
        error(...args) { console.log(chalk.bold.rgb(247, 38, 33)(`ERROR [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.rgb(255, 38, 0)(util.format(...args))) },
        warn(...args) { console.log(chalk.bold.rgb(239, 225, 3)(`WARNING [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.keyword('orange')(util.format(...args))) }
    }

    conn.getFile = async (PATH, returnAsFilename) => {
        let res, filename
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
        if (data && returnAsFilename && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return { res, filename, ...type, data }
    }

    conn.waitEvent = (eventName, is = () => true, maxTries = 25) => {
        return new Promise((resolve, reject) => {
            let tries = 0
            let on = (...args) => {
                if (++tries > maxTries) reject('Max tries reached')
                else if (is()) {
                    conn.ev.off(eventName, on)
                    resolve(...args)
                }
            }
            conn.ev.on(eventName, on)
        })
    }
    
    conn.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
     
    conn.filter = (text) => {
      let mati = ["q", "w", "r", "t", "y", "p", "s", "d", "f", "g", "h", "j", "k", "l", "z", "x", "c", "v", "b", "n", "m"]
      if (/[aiueo][aiueo]([qwrtypsdfghjklzxcvbnm])?$/i.test(text)) return text.substring(text.length - 1)
      else {
        let res = Array.from(text).filter(v => mati.includes(v))
        let resu = res[res.length - 1]
        for (let huruf of mati) { if (text.endsWith(huruf)) { resu = res[res.length - 2] } }
        let misah = text.split(resu)
        return resu + misah[misah.length - 1]
      }
    }
    
    conn.msToDate = (ms) => {
      let days = Math.floor(ms / (24 * 60 * 60 * 1000));
      let daysms = ms % (24 * 60 * 60 * 1000);
      let hours = Math.floor((daysms) / (60 * 60 * 1000));
      let hoursms = ms % (60 * 60 * 1000);
      let minutes = Math.floor((hoursms) / (60 * 1000));
      let minutesms = ms % (60 * 1000);
      let sec = Math.floor((minutesms) / (1000));
      return days + " Hari " + hours + " Jam " + minutes + " Menit";
    }
    
    conn.rand = async (isi) => { return isi[Math.floor(Math.random() * isi.length)] }
    
    conn.resize = async (buffer, uk1, uk2) => {
    	return new Promise(async(resolve, reject) => {
    		var baper = await jimp.read(buffer);
    		var ab = await baper.resize(uk1, uk2).getBufferAsync(jimp.MIME_JPEG)
    		resolve(ab)
    	})
    }
    
    conn.sendMedia = async (jid, path, quoted, options = {}) => {
        let { ext, mime, data } = await conn.getFile(path)
        messageType = mime.split("/")[0]
        pase = messageType.replace('application', 'document') || messageType
        return await conn.sendMessage(jid, { [`${pase}`]: data, mimetype: mime, ...options }, { quoted })
    }

    conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await conn.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } }
            catch (e) { if (e.json) throw e.json }
        }
        let opt = { filename }
        if (quoted) opt.quoted = quoted
        if (!type) if (options.asDocument) options.asDocument = true
        let mtype = '', mimetype = type.mime
        if (/webp/.test(type.mime)) mtype = 'sticker'
        else if (/image/.test(type.mime)) mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) (
            convert = await (ptt ? toPTT : toAudio)(file, type.ext),
            file = convert.data, pathFile = convert.filename,
            mtype = 'audio', mimetype = 'audio/ogg; codecs=opus'
        )
        else mtype = 'document'
        return await conn.sendMessage(jid, { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype }, { ...opt, ...options })
    }

    conn.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer = (options && (options.packname || options.author)) ? await writeExifImg(buff, options) : await imageToWebp(buff)
        await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    conn.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer = (options && (options.packname || options.author)) ? await writeExifVid(buff, options) : await videoToWebp(buff)
        await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    conn.sendContact = async (jid, data, quoted, options) => {
        let contacts = []
        for (let [number, name] of data) {
            number = number.replace(/[^0-9]/g, '')
            let njid = number + '@s.whatsapp.net'
            let biz = await conn.getBusinessProfile(njid) || {}
            let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, '\\n')}
item1.TEL;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
item1.X-ABLabel:Ponsel${biz.description ? `
PHOTO;BASE64:${(await conn.getFile(await conn.profilePictureUrl(njid)).catch(_ => ({})) || {}).data?.toString('base64')}
X-WA-BIZ-DESCRIPTION:${(biz.description || '').replace(/\n/g, '\\n')}
X-WA-BIZ-NAME:${(((conn.chats[njid] || {}) || { vname: conn.chats[njid]?.name }).vname || await conn.getName(njid) || name).replace(/\n/, '\\n')}
`.trim() : ''}
END:VCARD
`.trim()
            contacts.push({ vcard, displayName: name })
        }
        return await conn.sendMessage(jid, {
            contacts: { ...options, displayName: (contacts.length > 1 ? `${contacts.length} kontak` : contacts[0].displayName) || null, contacts },
            quoted, ...options
        })
    }
    
    conn.reply = (jid, text = '', quoted, options) => {
        return Buffer.isBuffer(text) ? this.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text, mentions: conn.parseMention(text) }, { quoted, ...options, mentions: conn.parseMention(text) })
    }
    
    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
    
    conn.sendGroupV4Invite = async (jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', caption = 'Invitation to join my WhatsApp group', options = {}) => {
        let msg = proto.Message.fromObject({
            groupInviteMessage: proto.GroupInviteMessage.fromObject({
                inviteCode,
                inviteExpiration: parseInt(inviteExpiration) || + new Date(new Date + (3 * 86400000)),
                groupJid: jid,
                groupName: groupName ? groupName : this.getName(jid),
                caption
            })
        })
        let message = await this.prepareMessageFromContent(participant, msg, options)
        await this.relayWAMessage(message)
        return message
    }

    // ================== SEND MULTI BUTTON MESSAGE (NEW NATIVE FLOW) ==================
    // ─── Helper: normalize sections (support nested rows) ───────────────────────
    // Row yang punya field `rows` sendiri otomatis di-flatten jadi section baru.
    function _normalizeSections(sections) {
        const out = []
        for (const sec of (sections || [])) {
            const topRows = [], childSecs = []
            for (const row of (sec.rows || [])) {
                if (Array.isArray(row.rows) && row.rows.length > 0) {
                    childSecs.push({
                        title: row.title || '',
                        highlight_label: row.highlight_label || '',
                        rows: row.rows.map(r => ({ id: r.id || r.rowId || '', title: r.title || '', description: r.description || '' }))
                    })
                } else {
                    topRows.push({ id: row.id || row.rowId || '', title: row.title || '', description: row.description || '' })
                }
            }
            if (topRows.length) out.push({ title: sec.title || '', highlight_label: sec.highlight_label || '', rows: topRows })
            for (const cs of childSecs) out.push(cs)
        }
        return out
    }

    // ─── Helper: build & relay interactiveMessage ─────────────────────────────
    async function _sendInteractive(jid, body, footer, buttons, buffer, quoted, options = {}) {
        let interactiveMessage = {
            body: { text: body || '' },
            footer: { text: footer || '' },
            header: { hasMediaAttachment: !!buffer },
            nativeFlowMessage: { buttons }
        }
        if (buffer) {
            let type = await conn.getFile(buffer)
            let mimeBase = type.mime.split('/')[0]
            let mediaKey = ['image','video','audio'].includes(mimeBase) ? mimeBase : 'document'
            let media = await prepareWAMessageMedia({ [mediaKey]: type.data }, { upload: conn.waUploadToServer })
            Object.assign(interactiveMessage.header, media)
        }
        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage
                }
            }
        }, { userJid: conn.user.jid, quoted, ...options })
        return conn.relayMessage(jid, msg.message, {
            messageId: msg.key.id,
            additionalNodes: buildInteractiveAdditionalNodes(jid, msg.message)
        })
    }

    // ================== SEND MULTI BUTTON (NATIVE FLOW V7) ==================
    // Button types:
    //   { type: 'list',     displayText, sections }      → dropdown single_select
    //   { type: 'reply',    displayText, id }             → quick reply
    //   { type: 'url',      displayText, url }            → buka link
    //   { type: 'copy',     displayText, copyCode }       → salin kode
    //   { type: 'call',     displayText, phoneNumber }    → telepon
    //   { type: 'location', displayText }                 → kirim GPS
    //   { type: 'address',  displayText, label? }         → isi & kirim alamat
    conn.sendMultiButton = async (jid, contentText, footerText, buffer, buttonsArray, quoted, options = {}) => {
        const buttons = []
        for (const btn of (buttonsArray || [])) {
            const dt = btn.displayText || btn.display_text || btn.title || 'Pilih'
            if (btn.type === 'list') {
                buttons.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title: dt, sections: _normalizeSections(btn.sections) }) })
            } else if (btn.type === 'url') {
                buttons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: dt, url: btn.url, merchant_url: btn.merchantUrl || btn.url }) })
            } else if (btn.type === 'reply') {
                buttons.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: dt, id: btn.id || dt }) })
            } else if (btn.type === 'copy') {
                buttons.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: dt, copy_code: btn.copyCode || btn.copy_code || '' }) })
            } else if (btn.type === 'call') {
                buttons.push({ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: dt, phone_number: btn.phoneNumber || btn.phone_number || '' }) })
            } else if (btn.type === 'location') {
                buttons.push({ name: 'send_location', buttonParamsJson: JSON.stringify({ display_text: dt }) })
            } else if (btn.type === 'address') {
                buttons.push({ name: 'address_message', buttonParamsJson: JSON.stringify({ display_text: dt, label: btn.label || '' }) })
            }
        }
        return _sendInteractive(jid, contentText, footerText, buttons, buffer, quoted, options)
    }

    // ================== SEND MULTI LIST ==================
    // Satu pesan dengan BANYAK tombol dropdown sekaligus.
    // Tiap list punya sections & rows sendiri — dibuka satu per satu.
    //
    //   conn.sendMultiList(jid, title, footer, lists[], buffer, quoted)
    //   lists = [{ displayText, sections: [{title, rows:[{id,title,description?}]}] }]
    conn.sendMultiList = async (jid, contentText, footerText, lists, buffer, quoted, options = {}) => {
        const buttons = (lists || []).map((list, i) => ({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: list.displayText || list.title || `Pilih ${i + 1}`,
                sections: _normalizeSections(list.sections)
            })
        }))
        return _sendInteractive(jid, contentText, footerText, buttons, buffer, quoted, options)
    }

    // ================== SEND BUTTON MESSAGE (NATIVE FLOW V2) ==================
    conn.sendButton = async (jid, contentText, footer, buffer, buttons, quoted, options = {}) => {
        let dynamicButtons = buttons.map(btn => {
            let btnText = btn[0] || btn[1];
            let btnIdOrUrl = btn[1] || btn[0];

            if (typeof btnIdOrUrl === 'string' && btnIdOrUrl.match(/(?:https?|ftp):\/\//i)) {
                return { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: btnText, url: btnIdOrUrl, merchant_url: btnIdOrUrl }) };
            } else {
                return { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: btnText, id: btnIdOrUrl }) };
            }
        });

        let interactiveMessage = {
            body: { text: contentText || '' },
            footer: { text: footer || '' },
            header: { hasMediaAttachment: !!buffer },
            nativeFlowMessage: { buttons: dynamicButtons }
        };

        if (buffer) {
            let type = await conn.getFile(buffer);
            let mediaMessage = await prepareWAMessageMedia(
                { [type.mime.split('/')[0]]: type.data }, 
                { upload: conn.waUploadToServer }
            );
            Object.assign(interactiveMessage.header, mediaMessage);
        }

        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: interactiveMessage
                }
            }
        }, { userJid: conn.user.jid, quoted, ...options });

        return await conn.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(jid, msg.message) });
    }
    
    // ================== SEND LIST + BUTTON MESSAGE (NATIVE FLOW V2) ==================
    // ================== SEND LIST BUTTON (NATIVE FLOW V7) ==================
    // sections support nested rows — row yang punya `.rows` otomatis jadi section baru
    conn.sendListButton = async (jid, contentText, footerText, buttonListText, sections, buttons, buffer, quoted, options = {}) => {
        const dynamicButtons = []
        if (sections && sections.length > 0) {
            dynamicButtons.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title: buttonListText || 'Pilih Menu', sections: _normalizeSections(sections) }) })
        }
        if (buttons && buttons.length > 0) {
            for (const btn of buttons) {
                const btnText = btn[0] || btn[1]
                const btnIdOrUrl = btn[1] || btn[0]
                if (typeof btnIdOrUrl === 'string' && /(?:https?|ftp):\/\//i.test(btnIdOrUrl)) {
                    dynamicButtons.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: btnText, url: btnIdOrUrl, merchant_url: btnIdOrUrl }) })
                } else {
                    dynamicButtons.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: btnText, id: btnIdOrUrl }) })
                }
            }
        }
        return _sendInteractive(jid, contentText, footerText, dynamicButtons, buffer, quoted, options)
    }

    // ==============================================================
    // FUNGSI LEGACY / WARISAN 
    // ==============================================================
    conn.sendBut = async(jid, content, footer, button1, row1, quoted) => {
	    const buttons = [{buttonId: row1, buttonText: {displayText: button1}, type: 1}]
        const buttonMessage = { text: content, footer: footer, buttons: buttons, headerType: 1, mentions: conn.parseMention(footer+content) }
        return await conn.sendMessage(jid, buttonMessage, {quoted})
    }
  
    conn.send2But = async(jid, content, footer, button1, row1, button2, row2, quoted) => {
	    const buttons = [{ buttonId: row1, buttonText: { displayText: button1 }, type: 1 }, { buttonId: row2, buttonText: { displayText: button2 }, type: 1 }]
        const buttonMessage = { text: content, footer: footer, buttons: buttons, headerType: 1 }
        return await conn.sendMessage(jid, buttonMessage, {quoted})
    }
  
    conn.send3But = async(jid, content, footer,button1, row1, button2, row2, button3, row3, quoted) => {
	    const buttons = [{ buttonId: row1, buttonText: { displayText: button1 }, type: 1 }, { buttonId: row2, buttonText: { displayText: button2 }, type: 1 }, { buttonId: row3, buttonText: { displayText: button3 }, type: 1 }]
        const buttonMessage = { text: content, footer: footer, buttons: buttons, headerType: 1 }
        return await conn.sendMessage(jid, buttonMessage, {quoted})
    }

    conn.send4But = async(jid, content, footer,button1, row1, button2, row2, button3, row3, button4, row4, quoted) => {
        const buttons = [{ buttonId: row1, buttonText: { displayText: button1 }, type: 1 }, { buttonId: row2, buttonText: { displayText: button2 }, type: 1 }, { buttonId: row3, buttonText: { displayText: button3 }, type: 1 }, { buttonId: row4, buttonText: { displayText: button4 }, type: 1 }]
        const buttonMessage = { text: content, footer: footer, buttons: buttons, headerType: 1 }
        return await conn.sendMessage(jid, buttonMessage, {quoted})
    }

    conn.sendButtonImg = async (jid, buffer, contentText, footerText, button1, id1, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
        }
        const buttons = [{ buttonId: id1, buttonText: { displayText: button1 }, type: 1 }]
        const buttonMessage = { image: file, fileLength: 887890909999999, caption: contentText, footer: footerText, mentions: await conn.parseMention(contentText + footerText), ...options, buttons: buttons, headerType: 4 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }

    conn.send2ButtonImg = async (jid, buffer, contentText, footerText, button1, id1, button2, id2, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
        }
        const buttons = [{ buttonId: id1, buttonText: { displayText: button1 }, type: 1 }, { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }]
        const buttonMessage = { image: file, fileLength: 887890909999999, caption: contentText, footer: footerText, mentions: await conn.parseMention(contentText + footerText), ...options, buttons: buttons, headerType: 4 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }

    conn.send3ButtonImg = async (jid, buffer, contentText, footerText, button1, id1, button2, id2, button3, id3, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
        }
        const buttons = [{ buttonId: id1, buttonText: { displayText: button1 }, type: 1 }, { buttonId: id2, buttonText: { displayText: button2 }, type: 1 }, { buttonId: id3, buttonText: { displayText: button3 }, type: 1 }]
        const buttonMessage = { image: file, fileLength: 887890909999999, caption: contentText, footer: footerText, mentions: await conn.parseMention(contentText + footerText), ...options, buttons: buttons, headerType: 4 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, contextInfo: { mentionedJid: conn.parseMention(contentText + footerText) }, ...options })
    }
  
    conn.sendH3Button = async (jid, content, displayText, link, displayCall, number, quickReplyText, id, quickReplyText2, id2, quickReplyText3, id3, quoted) => {
		let template = generateWAMessageFromContent(jid, proto.Message.fromObject({
			templateMessage: {
                hydratedTemplate: {
                    hydratedContentText: content,
                    hydratedButtons: [{ urlButton: { displayText: displayText, url: link } }, { callButton: { displayText: displayCall, phoneNumber: number } }, { quickReplyButton: { displayText: quickReplyText, id: id } }, { quickReplyButton: { displayText: quickReplyText2, id: id2 } }, { quickReplyButton: { displayText: quickReplyText3, id: id3 } }]
                }
            }
        }), { userJid: conn.user.jid, quoted: quoted});
        return await conn.relayMessage(jid, template.message, { messageId: template.key.id, additionalNodes: buildInteractiveAdditionalNodes(jid, template.message) })
	}
	
    // ================== SEND LIST (legacy listMessage) ==================
    // sections support nested rows otomatis
    conn.sendList = async (jid, title, description, buttonText, sections, quoted, options = {}) => {
        const flat = _normalizeSections(sections)
        const listMessage = {
            title: title || '',
            description: description || '',
            buttonText: buttonText || 'Menu',
            footerText: options.footer || '',
            listType: proto.Message.ListMessage.ListType.SINGLE_SELECT,
            sections: flat.map(sec => ({
                title: sec.title || '',
                rows: (sec.rows || []).map(r => ({ title: r.title || '', description: r.description || '', rowId: r.id || r.rowId || '' }))
            }))
        }
        let msg = generateWAMessageFromContent(jid, { listMessage }, { userJid: conn.user.jid, quoted, ...options })
        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(jid, msg.message) })
    }

    // ================== SEND NESTED LIST ==================
    // Alias sendList dengan nested sections eksplisit
    conn.sendNestedList = async (jid, title, description, buttonText, sections, quoted, options = {}) => {
        return conn.sendList(jid, title, description, buttonText, sections, quoted, options)
    }

    conn.sendHButtonLoc = async (jid, buffer, content, footer, distek, link1, quick1, id1,quoted) => {
		let template = generateWAMessageFromContent(jid, proto.Message.fromObject({
			templateMessage: {
                hydratedTemplate: {
                    hydratedContentText: content,
                    mentions: conn.parseMention(content + footer),
                    locationMessage: { jpegThumbnail: buffer },
                    hydratedFooterText: footer,
                    hydratedButtons: [{ urlButton: { displayText: distek, url: link1 } }, { quickReplyButton: { displayText:quick1, id: id1 } }]
                }
            }
        }), { userJid: conn.user.jid, quoted: quoted, mentions: conn.parseMention(content + footer)});
        return await conn.relayMessage(jid, template.message, { messageId: template.key.id, additionalNodes: buildInteractiveAdditionalNodes(jid, template.message) })
	}

	conn.sendHButt = async (jid, content, distek, link, discall, number, retek, id,quoted) => {
		let template = generateWAMessageFromContent(jid, proto.Message.fromObject({
			templateMessage: {
                hydratedTemplate: {
                    hydratedContentText: content,
                    hydratedButtons: [{ urlButton: { displayText: distek, url: link } }, { callButton: { displayText: discall, phoneNumber: number } }, { quickReplyButton: { displayText:retek, id: id } }]
                }
            }
        }), { userJid: conn.user.jid, quoted: quoted});
        return await conn.relayMessage(jid, template.message, { messageId: template.key.id, additionalNodes: buildInteractiveAdditionalNodes(jid, template.message) })
	}

	conn.sendButtonLoc= async (jid, buffer, content, footer, button1, row1, quoted, options = {}) => {
		let buttons = [{buttonId: row1, buttonText: {displayText: button1}, type: 1}]
		let buttonMessage = { location: { jpegThumbnail: buffer }, caption: content, footer: footer, buttons: buttons, headerType: 6 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, upload: conn.waUploadToServer, ...options })
	}

	conn.send2ButtonLoc= async (jid, buffer, content, footer, button1, row1, button2, row2, quoted, options = {}) => {
		let buttons = [{buttonId: row1, buttonText: {displayText: button1}, type: 1}, { buttonId: row2, buttonText: { displayText: button2 }, type: 1 }]
		let buttonMessage = { location: { jpegThumbnail: buffer }, caption: content, footer: footer, buttons: buttons, headerType: 6 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, upload: conn.waUploadToServer, ...options })
	}

	conn.send3ButtonLoc= async (jid, buffer, content, footer, button1, row1, button2, row2, button3, row3, quoted, options = {}) => {
		let buttons = [{buttonId: row1, buttonText: {displayText: button1}, type: 1}, { buttonId: row2, buttonText: { displayText: button2 }, type: 1 }, { buttonId: row3, buttonText: { displayText: button3 }, type: 1 }]
		let buttonMessage = { location: { jpegThumbnail: buffer }, caption: content, footer: footer, buttons: buttons, headerType: 6 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, upload: conn.waUploadToServer, ...options })
	}

    conn.sendButtonVid = async (jid, buffer, contentText, footerText, button1, id1, quoted, options) => {
        let type = await conn.getFile(buffer)
        let { res, data: file } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
        }
        let buttons = [{ buttonId: id1, buttonText: { displayText: button1 }, type: 1 }]
        const buttonMessage = { video: file, fileLength: 887890909999999, caption: contentText, footer: footerText, mentions: await conn.parseMention(contentText), ...options, buttons: buttons, headerType: 4 }
        return await conn.sendMessage(jid, buttonMessage, { quoted, ephemeralExpiration: 86400, ...options })
    }

    // ==============================================================

    conn.cMod = async (jid, message, text = '', sender = conn.user.jid, options = {}) => {
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
        let copy = message.toJSON()
        delete copy.message.messageContextInfo
        delete copy.message.senderKeyDistributionMessage
        let mtype = Object.keys(copy.message)[0]
        let msg = copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') {
            msg[mtype] = { ...content, ...options }
            msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
            }
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.create(copy)
    }
    
    conn.cMods = (jid, message, text = '', sender = conn.user.jid, options = {}) => {
        let copy = message.toJSON()
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = false 
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = { ...content, ...options }
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.create(copy)
    }

    conn.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
        let m = generateForwardMessageContent(message, !!forwardingScore)
        let mtype = Object.keys(m)[0]
        if (forwardingScore && typeof forwardingScore == 'number' && forwardingScore > 1) m[mtype].contextInfo.forwardingScore += forwardingScore
        m = generateWAMessageFromContent(jid, m, { ...options, userJid: conn.user.id })
        await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options }, additionalNodes: buildInteractiveAdditionalNodes(jid, m.message) })
        return m
    }

    conn.fakeReply = async (jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid, options) => {
        return conn.reply(jid, text, { key: { fromMe: areJidsSameUser(fakeJid, conn.user.id), participant: fakeJid, ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) }, message: { conversation: fakeText }, ...options })
	}
    
    conn.loadMessage = conn.loadMessage || (async (messageID) => {
        return Object.entries(conn.chats)
            .filter(([_, { messages }]) => typeof messages === 'object')
            .find(([_, { messages }]) => Object.entries(messages)
                .find(([k, v]) => (k === messageID || v.key?.id === messageID)))
            ?.[1].messages?.[messageID]
    })

    conn.downloadM = async (m, type, saveToFile) => {
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
        const stream = await downloadContentFromMessage(m, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        if (saveToFile) var { filename } = await conn.getFile(buffer, true)
        return saveToFile && fs.existsSync(filename) ? filename : buffer
    }
    
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
	    let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    conn.parseMention = (text) => {
        if (!text) return []
        const match = [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((m) => m[1])
        const out = []
        for (const id of match) {
            const lid = `${id}@lid`
            const jid = conn.getJid(lid)
            if (conn.isLid.has(lid)) out.push(lid)
            else if (jid && jid !== lid && jid.includes(id)) out.push(jid)
            else out.push(`${id}@s.whatsapp.net`)
        }
        return [...new Set(out)]
    }

    conn.chatRead = async (jid, participant = conn.user.jid, messageID) => {
        return await conn.sendReadReceipt(jid, participant, [messageID])
    }

    conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

    conn.profilePictureUrl = async (jid, type = 'preview', timeoutMs) => {
        jid = conn.decodeJid(jid)
        const result = await conn.query({
            tag: 'iq',
            attrs: { target: jid, to: S_WHATSAPP_NET, type: 'get', xmlns: 'w:profile:picture' },
            content: [{ tag: 'picture', attrs: { type, query: 'url' } }]
        }, timeoutMs)
        const picture = getBinaryNodeChild(result, 'picture')
        return picture?.attrs?.url
    }

    conn.getName = async (jid = "", withoutContact = false) => {
        if (!jid) return "Unknown"
        jid = conn.decodeJid(jid)
        withoutContact = conn.withoutContact || withoutContact

        if (jid.endsWith("@g.us")) {
            try {
                const data = await conn.groupMetadata(jid)
                if (data?.subject) return data.subject
            } catch {}
            return "Group " + jid.split("@")[0]
        }

        if (jid === "0@s.whatsapp.net") return "WhatsApp"

        if (areJidsSameUser(jid, conn.user.jid)) {
            return conn.user.name || conn.user.verifiedName || "Me"
        }

        const chat = conn.chats[jid] || {}
        if (!withoutContact) {
            const nama = chat.name || chat.subject || chat.vname || chat.notify || chat.verifiedName
            if (nama) return nama
        }

        try {
            return PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international")
        } catch {
            return jid.split("@")[0]
        }
    }

    conn.processMessageStubType = async (m) => {
        if (!m.messageStubType) return
        const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '')
        if (!chat || chat === 'status@broadcast') return

        if ([ WAMessageStubType.GROUP_PARTICIPANT_ADD, WAMessageStubType.GROUP_PARTICIPANT_REMOVE, WAMessageStubType.GROUP_PARTICIPANT_PROMOTE, WAMessageStubType.GROUP_PARTICIPANT_DEMOTE, WAMessageStubType.GROUP_PARTICIPANT_INVITE, WAMessageStubType.GROUP_PARTICIPANT_LEAVE, WAMessageStubType.GROUP_PARTICIPANT_CHANGE_NUMBER ].includes(m.messageStubType)) {
            try {
                const param = m.messageStubParameters?.[0]
                if (param && typeof param === 'string') {
                    const parsed = JSON.parse(param)
                    if (parsed?.id?.endsWith('@lid') && parsed?.phoneNumber?.endsWith('@s.whatsapp.net')) {
                        conn.isLid.set(parsed.id, parsed.phoneNumber)
                    }
                }
            } catch {}
        }

        const emitGroupUpdate = (update) => { conn.ev.emit('groups.update', [{ id: chat, ...update }]) }

        switch (m.messageStubType) {
            case WAMessageStubType.REVOKE:
            case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                emitGroupUpdate({ revoke: m.messageStubParameters[0] })
                break
            case WAMessageStubType.GROUP_CHANGE_ICON:
                emitGroupUpdate({ icon: m.messageStubParameters[0] })
                break
        }

        const isGroup = chat.endsWith('@g.us')
        if (!isGroup) return
        let chats = conn.chats[chat]
        if (!chats) chats = conn.chats[chat] = { id: chat }
        chats.isChats = true
        const metadata = await conn.groupMetadata(chat).catch(_ => null)
        if (!metadata) return
        chats.subject = metadata.subject
        chats.metadata = metadata
    }
    
    conn.insertAllGroup = async() => {
        const groups = await conn.groupFetchAllParticipating().catch(_ => null) || {}
        for (const group in groups) conn.chats[group] = { ...(conn.chats[group] || {}), id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
            return conn.chats
    }
    
    conn.pushMessage = async(m) => {
        if (!m) return
        if (!Array.isArray(m)) m = [m]
        for (const message of m) {
            try {
                if (!message) continue
                if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error)
                const _mtype = Object.keys(message.message || {})
                const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) || (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) || _mtype[_mtype.length - 1]
                const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
                if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
                    let context = message.message[mtype].contextInfo
                    let participant = conn.decodeJid(context.participant)
                    const remoteJid = conn.decodeJid(context.remoteJid || participant)
                    let quoted = message.message[mtype].contextInfo.quotedMessage
                    if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                        let qMtype = Object.keys(quoted)[0]
                        if (qMtype == 'conversation') {
                            quoted.extendedTextMessage = { text: quoted[qMtype] }
                            delete quoted.conversation
                            qMtype = 'extendedTextMessage'
                        }
                        if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {}
                        quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []
                        const isGroup = remoteJid.endsWith('g.us')
                        if (isGroup && !participant) participant = remoteJid
                        const qM = {
                            key: { remoteJid, fromMe: areJidsSameUser(conn.user.jid, remoteJid), id: context.stanzaId, participant },
                            message: JSON.parse(JSON.stringify(quoted)),
                            ...(isGroup ? { participant } : {})
                        }
                        let qChats = conn.chats[participant]
                        if (!qChats) qChats = conn.chats[participant] = { id: participant, isChats: !isGroup }
                        if (!qChats.messages) qChats.messages = {}
                        if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM
                        let qChatsMessages
                        if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length))
                    }
                }
                if (!chat || chat === 'status@broadcast') continue
                const isGroup = chat.endsWith('@g.us')
                let chats = conn.chats[chat]
                if (!chats) {
                    if (isGroup) await conn.insertAllGroup().catch(console.error)
                    chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) }
                }
                let metadata, sender
                if (isGroup) {
                    if (!chats.subject || !chats.metadata) {
                        metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
                        if (!chats.subject) chats.subject = metadata.subject || ''
                        if (!chats.metadata) chats.metadata = metadata
                    }
                    sender = conn.getJid(message.key?.fromMe && conn.user.id || message.participant || message.key?.participant || chat || '')
                    if (sender !== chat) {
                        let chats = conn.chats[sender]
                        if (!chats) chats = conn.chats[sender] = { id: sender }
                        if (!chats.name) chats.name = message.pushName || chats.name || ''
                    }
                } else if (!chats.name) chats.name = message.pushName || chats.name || ''
                if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue
                chats.isChats = true
                if (!chats.messages) chats.messages = {}
                const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id)
                if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
                    delete message.message.messageContextInfo
                    delete message.message.senderKeyDistributionMessage
                    chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
                    let chatsMessages
                    if ((chatsMessages = Object.entries(chats.messages)).length > 40) chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length))
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
     
    conn.format = (...args) => { return util.format(...args) }
    
    conn.getBuffer = async (url, options) => {
        try {
            options ? options : {}
            const res = await axios({ method: "get", url, headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 }, ...options, responseType: 'arraybuffer' })
            return res.data
        } catch (e) {
            console.log(`Error : ${e}`)
        }
    }

    conn.serializeM = (m) => { return exports.smsg(conn, m) }

    conn.sendAlbum = async (jid, items, quoted, options = {}) => {
        return await conn.sendMessage(jid, { albumMessage: items }, { quoted, ...options })
    }

    conn.sendPayment = async (jid, { amount, currency = 'IDR', note, sticker, from, expiry, background } = {}, quoted, options = {}) => {
        return await conn.sendMessage(jid, { requestPaymentMessage: { amount, currency, note, sticker, from: from || jid, expiry, background } }, { quoted, ...options })
    }

    conn.sendPollResult = async (jid, name, votes, quoted, options = {}) => {
        return await conn.sendMessage(jid, { pollResultMessage: { name, pollVotes: votes } }, { quoted, ...options })
    }

    conn.sendEvent = async (jid, { name, description, location, joinLink, startTime, endTime, isCanceled, extraGuestsAllowed } = {}, quoted, options = {}) => {
        return await conn.sendMessage(jid, { eventMessage: { name, description, location, joinLink, startTime: startTime || Date.now(), endTime: endTime || (Date.now() + 3600000), isCanceled, extraGuestsAllowed } }, { quoted, ...options })
    }

    conn.sendGroupStatus = async (jid, content, quoted, options = {}) => {
        return await conn.sendMessage(jid, { groupStatusMessage: content }, { quoted, ...options })
    }

    conn.sendProduct = async (jid, { title, description, thumbnail, productId, retailerId, url, body, footer, buttons, priceAmount1000, currencyCode } = {}, quoted, options = {}) => {
        return await conn.sendMessage(jid, { productMessage: { title, description, thumbnail, productId, retailerId, url, body, footer, buttons, priceAmount1000, currencyCode } }, { quoted, ...options })
    }

    Object.defineProperty(conn, 'name', { value: 'WASocket', configurable: true })
    return conn
}

exports.smsg = (conn, m, hasParent) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    m = M.create(m)
    
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id && m.id.length === 22 || m.id.startsWith('3EB0') && m.id.length === 22 || false
        let chatJid = m.key.remoteJid;
        if (chatJid?.endsWith('@lid')) { chatJid = conn.getJid(chatJid) || chatJid; }
        m.chat = conn.decodeJid(chatJid || m.message?.senderKeyDistributionMessage?.groupId || m.key.remoteJid || '');
        m.isGroup = m.chat?.endsWith('@g.us') || m.key.remoteJid?.endsWith('@g.us') || m.message?.senderKeyDistributionMessage?.groupId?.endsWith('@g.us') || false;
        let senderJid = m.key.fromMe ? conn.user.id : m.key.participantPn || m.key.senderPn || conn.getJid(m.key.participant || m.key.remoteJid || m.key.senderLid || m.chat || '') || m.key.participant || m.key.senderLid || m.key.remoteJid || m.participant || m.chat || '';
        m.sender = conn.decodeJid(senderJid)
        m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id)
    }

    if (m.message) {
        let mtype = Object.keys(m.message)
        m.mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype[0]) && mtype[0]) || (mtype.length >= 3 && mtype[1] !== 'messageContextInfo' && mtype[1]) || mtype[mtype.length - 1]
        m.msg = m.message[m.mtype]
        
        if (m.chat == 'status@broadcast' && ['protocolMessage', 'senderKeyDistributionMessage'].includes(m.mtype)) { m.chat = (m.key.remoteJid !== 'status@broadcast' && m.key.remoteJid) || m.sender }
        
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            if (m.msg.key.remoteJid == 'status@broadcast') m.msg.key.remoteJid = m.chat
            if (!m.msg.key.participant || m.msg.key.participant == 'status_me') m.msg.key.participant = m.sender
            m.msg.key.fromMe = conn.decodeJid(m.msg.key.participant) === conn.decodeJid(conn.user.id)
            if (!m.msg.key.fromMe && m.msg.key.remoteJid === conn.decodeJid(conn.user.id)) m.msg.key.remoteJid = m.sender
        }
        
        m.text = m.msg.text || m.msg.caption || m.msg.contentText || m.msg || ''
        if (typeof m.text !== 'string') {
            if (['protocolMessage', 'messageContextInfo', 'stickerMessage', 'audioMessage', 'senderKeyDistributionMessage'].includes(m.mtype)) m.text = ''
            else m.text = m.text.selectedDisplayText || m.text.hydratedTemplate?.hydratedContentText || m.text
        }

        if (m.mtype === 'interactiveResponseMessage' && m.msg?.nativeFlowResponseMessage) {
            try {
                let params = JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson);
                if (params && params.id) m.text = params.id;
            } catch (e) {}
        } else if (m.mtype === 'templateButtonReplyMessage' && m.msg?.selectedId) {
            m.text = m.msg.selectedId;
        } else if (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId) {
            m.text = m.msg.selectedButtonId;
        } else if (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) {
            // legacy listMessage response (sendList / sendNestedList)
            m.text = m.msg.singleSelectReply.selectedRowId;
        }
        
        m.mentionedJid = (m.msg?.contextInfo?.mentionedJid || []).map(jid => conn.getJid(jid) || jid)

        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo.quotedMessage : null
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0]
            m.quoted = m.quoted[type]
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            
            if (m.quoted) {  
                m.quoted.mtype = type
                m.quoted.id = m.msg.contextInfo.stanzaId
                m.quoted.chat = conn.decodeJid(m.msg.contextInfo.remoteJid || m.chat || m.sender)
                m.quoted.isBaileys = m.quoted.id && m.quoted.id.length === 22 || false
                m.quoted.sender = conn.getJid(m.msg.contextInfo.participant)
                m.quoted.fromMe = m.quoted.sender === conn.user.jid
                m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || ''
                m.quoted.name = conn.getName(m.quoted.sender)
                m.quoted.mentionedJid = (m.quoted.contextInfo?.mentionedJid || []).map(jid => conn.getJid(jid) || jid)

                let vM = m.quoted.fakeObj = M.create({
                    key: { fromMe: m.quoted.fromMe, remoteJid: m.quoted.chat, id: m.quoted.id },
                    message: quoted,
                    ...(m.isGroup ? { participant: m.quoted.sender } : {})
                })
                
                m.getQuotedObj = m.getQuotedMessage = async () => {
                    if (!m.quoted.id) return null
                    let q = M.create(await conn.loadMessage(m.quoted.id) || vM)
                    return exports.smsg(conn, q)
                }
                
                if (m.quoted.url || m.quoted.directPath) { m.quoted.download = (saveToFile = false) => conn.downloadM(m.quoted, m.quoted.mtype.replace(/message/i, ''), saveToFile) }
            
                m.quoted.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, vM, options)
                m.quoted.copy = () => exports.smsg(conn, M.create(M.toObject(vM)))
                m.quoted.forward = (jid, forceForward = false) => conn.forwardMessage(jid, vM, forceForward)
                m.quoted.copyNForward = (jid, forceForward = true, options = {}) => conn.copyNForward(jid, vM, forceForward, options)
                m.quoted.cMod = (jid, text = '', sender = m.quoted.sender, options = {}) => conn.cMod(jid, vM, text, sender, options)
                m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key })
            }
        }
    }
    
    m.name = m.pushName || conn.getName(m.sender)
    if (m.msg && m.msg.url) m.download = (saveToFile = false) => conn.downloadM(m.msg, m.mtype.replace(/message/i, ''), saveToFile)
    m.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, m, options)
    m.copy = () => exports.smsg(conn, M.create(M.toObject(m)))
    m.forward = (jid = m.chat, forceForward = false) => conn.copyNForward(jid, m, forceForward, options)
    m.copyNForward = (jid = m.chat, forceForward = true, options = {}) => conn.copyNForward(jid, m, forceForward, options)
    m.cMod = (jid, text = '', sender = m.sender, options = {}) => conn.cMod(jid, m, text, sender, options)
    m.delete = () => conn.sendMessage(m.chat, { delete: m.key })

    try {} catch (e) { console.error(e) }
    
    return m
}

exports.logic = (check, inp, out) => {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length')
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

exports.protoType = () => {
  Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
    const ab = new ArrayBuffer(this.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < this.length; ++i) { view[i] = this[i]; }
    return ab;
  }
  Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() { return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength) }
  ArrayBuffer.prototype.toBuffer = function toBuffer() { return Buffer.from(new Uint8Array(this)) }
  Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() { return await FileType.fromBuffer(this) }
  String.prototype.isNumber = Number.prototype.isNumber = isNumber
  String.prototype.capitalize = function capitalize() { return this.charAt(0).toUpperCase() + this.slice(1, this.length) }
  String.prototype.capitalizeV2 = function capitalizeV2() {
    const str = this.split(' ')
    return str.map(v => v.capitalize()).join(' ')
  }
  String.prototype.decodeJid = function decodeJid() {
    if (/:\d+@/gi.test(this)) {
      const decode = jidDecode(this) || {}
      return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
    } else return this.trim()
  }
  Number.prototype.toTimeString = function toTimeString() {
    const seconds = Math.floor((this / 1000) % 60)
    const minutes = Math.floor((this / (60 * 1000)) % 60)
    const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
    const days = Math.floor(this / (24 * 60 * 60 * 1000))
    return ((days ? `${days} day(s) ` : '') + (hours ? `${hours} hour(s) ` : '') + (minutes ? `${minutes} minute(s) ` : '') + (seconds ? `${seconds} second(s)` : '')).trim()
  }
  Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom
}

function isNumber() {
  const int = parseInt(this)
  return typeof int === 'number' && !isNaN(int)
}

function getRandom() {
  if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
  return Math.floor(Math.random() * this)
}

function rand(isi) {
     return isi[Math.floor(Math.random() * isi.length)]
}
