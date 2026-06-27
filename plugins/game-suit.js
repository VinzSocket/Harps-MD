const fs = require('fs')
const { generateWAMessageFromContent, buildInteractiveAdditionalNodes, prepareWAMessageMedia } = require('@vinzsocket/baileys')

const getThumbnail = () => {
    try {
        return fs.readFileSync('./image/Default.png')
    } catch (e) {
        return Buffer.alloc(0) 
    }
}

const sendDocButton = async (conn, jid, textContent, footerText, buttons, quotedMsg, mentions = []) => {
    let thumb = getThumbnail()
    
    let docMedia = await prepareWAMessageMedia({
        document: thumb,
        mimetype: 'image/jpeg', 
        fileName: 'HARPS MD',   
        jpegThumbnail: thumb    
    }, { upload: conn.waUploadToServer })

    let msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: {
                    contextInfo: { mentionedJid: mentions },
                    body: { text: textContent },
                    footer: { text: footerText },
                    header: { 
                        title: "", 
                        hasMediaAttachment: true, 
                        documentMessage: docMedia.documentMessage 
                    },
                    nativeFlowMessage: { buttons: buttons }
                }
            }
        }
    }, { quoted: quotedMsg })

    return conn.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes: buildInteractiveAdditionalNodes(jid, msg.message) })
}

let handler = async (m, { conn, text, usedPrefix }) => {
    conn.suit = conn.suit || {}
    conn.pve_sessions = conn.pve_sessions || {} // Database buat nyimpen ID Menu

    // ==========================================
    // 1. MENU UTAMA (JIKA HANYA KETIK .suit)
    // ==========================================
    if (!text && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        let menuText = `*— [ 🎮 SUIT PVE & PVP ] —*\n\n`
        menuText += `Pilih senjatamu untuk melawan bot, atau tag temanmu untuk adu mekanik!\n\n`
        menuText += `⚔️ *Cara PvP:* ${usedPrefix}suit @user`

        // 💥 BIKIN ID RAHASIA UNTUK MENU INI
        let sessionId = 'pve_' + m.sender + '_' + Date.now()
        conn.pve_sessions[sessionId] = true // Aktifkan menu ini

        // Sisipkan ID rahasia ke dalam tombol
        let sections = [{
            title: "PILIH SENJATA ANDA",
            rows: [
                { title: "✂️ Gunting", id: `${usedPrefix}suit gunting ${sessionId}`, description: "Potong kertas lawan!" },
                { title: "📄 Kertas", id: `${usedPrefix}suit kertas ${sessionId}`, description: "Bungkus batu lawan!" },
                { title: "🪨 Batu", id: `${usedPrefix}suit batu ${sessionId}`, description: "Hancurkan gunting lawan!" }
            ]
        }]

        let mixedButtons = [
            { name: "single_select", buttonParamsJson: JSON.stringify({ title: "🎮 Pilih Senjata", sections: sections }) }
        ]

        return await sendDocButton(conn, m.chat, menuText, "Powered by Harps-Client V2", mixedButtons, m)
    }

    // ==========================================
    // 2. MODE PVP (PLAYER VS PLAYER) - NANTANG DI GRUP
    // ==========================================
    if (m.mentionedJid && m.mentionedJid[0]) {
        let musuh = m.mentionedJid[0]
        if (musuh === m.sender) return conn.sendMessage(m.chat, { text: "Ngapain suit sama diri sendiri ngab?" }, { quoted: m })
        if (musuh === conn.user.jid) return conn.sendMessage(m.chat, { text: `Klik tombol di menu *${usedPrefix}suit* kalau mau main sama bot!` }, { quoted: m })

        if (Object.values(conn.suit).find(room => room.id.startsWith('suit') && [room.p, room.p2].includes(m.sender))) return conn.sendMessage(m.chat, { text: 'Selesaikan suit mu yang sebelumnya terlebih dahulu!' }, { quoted: m })
        if (Object.values(conn.suit).find(room => room.id.startsWith('suit') && [room.p, room.p2].includes(musuh))) return conn.sendMessage(m.chat, { text: 'Orang yang kamu tantang sedang bermain suit dengan orang lain!' }, { quoted: m })

        let id = 'suit_' + new Date() * 1
        
        let caption = `*— [ ⚔️ SUIT PVP CHALLENGE ] —*\n\n`
        caption += `🎯 *Penantang:* @${m.sender.split('@')[0]}\n`
        caption += `🛡️ *Lawan:* @${musuh.split('@')[0]}\n\n`
        caption += `Silakan klik tombol di bawah untuk menerima atau menolak tantangan ini!`

        let ejekanAFK = [
            "Mohon Maaf Lawan Mu itu Penakut Maklumin aja",
            "Yahahah Lawan Mu Takut Lawan Penantang Emang Goblok"
        ]

        conn.suit[id] = {
            id: id,
            chatId: m.chat, 
            p: m.sender,
            p2: musuh,
            status: 'wait',
            waktu: setTimeout(() => {
                if (conn.suit[id]) {
                    let trashTalk = ejekanAFK[Math.floor(Math.random() * ejekanAFK.length)]
                    conn.sendMessage(m.chat, { text: `⏳ Waktu 5 menit habis!\n${trashTalk}`, mentions: [musuh] }, { quoted: m })
                    delete conn.suit[id]
                }
            }, 300000),
            pilih: null,
            pilih2: null
        }

        let mixedButtons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✅ Terima", id: "terima" }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "❌ Tolak", id: "tolak" }) }
        ]

        return await sendDocButton(conn, m.chat, caption, "⏳ Sesi: 5 Menit", mixedButtons, m, [m.sender, musuh])
    }

    // ==========================================
    // 3. MODE PVE (MAIN VS BOT) - HASIL PERTANDINGAN
    // ==========================================
    let args = text.toLowerCase().trim().split(' ')
    let userChoice = args[0]
    let sessionId = args[1] // Mengekstrak ID Rahasia jika ada

    if (!['batu', 'gunting', 'kertas'].includes(userChoice)) return

    // 💥 EKSEKUSI ANTI-ABUSE TOMBOL LAMA
    if (sessionId) {
        // Cek apakah ID menu ini masih hidup?
        if (!conn.pve_sessions[sessionId]) {
            // Menu udah kadaluarsa/dipakai -> DIAMKAN SAJA
            return
        }
        // Matikan ID menu ini agar gak bisa dipencet ke-2 kalinya!
        delete conn.pve_sessions[sessionId]
    } else {
        // Anti-spam buat yang ngetik manual (kasih cooldown 3 detik)
        conn.suit_cd = conn.suit_cd || {}
        if (conn.suit_cd[m.sender] && conn.suit_cd[m.sender] > Date.now()) return
        conn.suit_cd[m.sender] = Date.now() + 3000
    }

    var astro = Math.random()
    if (astro < 0.34) astro = 'batu'
    else if (astro > 0.34 && astro < 0.67) astro = 'gunting'
    else astro = 'kertas'

    let pveText = `*— [ 🤖 PVE MATCH ] —*\n\n`
    pveText += `👤 Kamu: *${userChoice.toUpperCase()}*\n`
    pveText += `🤖 Bot: *${astro.toUpperCase()}*\n\n`

    if (userChoice == astro) {
        pveText += `🏳️ *HASIL: SERI!*`
    } else if (
        (userChoice == 'batu' && astro == 'gunting') || 
        (userChoice == 'gunting' && astro == 'kertas') || 
        (userChoice == 'kertas' && astro == 'batu')
    ) {
        global.db.data.users[m.sender].money += 1000
        pveText += `🏆 *HASIL: KAMU MENANG!*\n💸 Hadiah: +Rp1.000`
    } else {
        pveText += `❌ *HASIL: KAMU KALAH!*`
    }
    
    let thumb = getThumbnail()
    return conn.sendMessage(m.chat, { 
        document: thumb, 
        mimetype: 'image/jpeg', 
        fileName: 'HARPS MD', 
        jpegThumbnail: thumb, 
        caption: pveText 
    }, { quoted: m })
}

// ==========================================
// 4. AUTO-RESPONDER PVP
// ==========================================
handler.before = async function (m, { conn }) {
    conn.suit = conn.suit || {}
    let isSurrender = /^(tolak|menyerah|nyerah)$/i.test(m.text)
    let isAccept = /^(terima|#terima)$/i.test(m.text)
    let isChoice = /^(batu|gunting|kertas)$/i.test(m.text)

    let ejekanAFK = [
        "Mohon Maaf Lawan Mu itu Penakut Maklumin aja",
        "Yahahah Lawan Mu Takut Lawan Penantang Emang Goblok"
    ]

    let room = Object.values(conn.suit).find(room => room.id.startsWith('suit') && [room.p, room.p2].includes(m.sender))
    
    if (room) {
        
        // TAHAP 1: KONFIRMASI TANTANGAN DI GRUP
        if (m.sender === room.p2 && room.status === 'wait' && m.chat === room.chatId) {
            if (isAccept) {
                clearTimeout(room.waktu)
                room.status = 'play'
                
                room.waktu = setTimeout(() => {
                    if (conn.suit[room.id]) {
                        let trashTalk = ejekanAFK[Math.floor(Math.random() * ejekanAFK.length)]
                        conn.sendMessage(room.chatId, { text: `⏳ Waktu 5 menit milih di PM habis!\n${trashTalk}` }, { quoted: m })
                        delete conn.suit[room.id]
                    }
                }, 300000)

                let startText = `*— [ 🎮 GAME DIMULAI! ] —*\n\n`
                startText += `✅ Tantangan diterima!\n`
                startText += `📥 Input sudah dikirim ke chat pribadi.\n`
                startText += `Silakan cek PC bot untuk memilih!`
                
                conn.sendMessage(room.chatId, { text: startText }, { quoted: m })

                let sections = [{
                    title: "PILIH SENJATA ANDA",
                    rows: [
                        { title: "✂️ Gunting", id: "gunting" },
                        { title: "📄 Kertas", id: "kertas" },
                        { title: "🪨 Batu", id: "batu" }
                    ]
                }]
                let pmBtns = [
                    { name: "single_select", buttonParamsJson: JSON.stringify({ title: "⚔️ Pilih Senjata", sections: sections }) }
                ]
                await sendDocButton(conn, room.p, "Pilih senjatamu dengan bijak! Jangan sampai terbaca lawan.", "⏳ Sesi: 5 Menit", pmBtns, null)
                await sendDocButton(conn, room.p2, "Pilih senjatamu dengan bijak! Jangan sampai terbaca lawan.", "⏳ Sesi: 5 Menit", pmBtns, null)
                return !0

            } else if (isSurrender) {
                clearTimeout(room.waktu)
                let trashTalk = ejekanAFK[Math.floor(Math.random() * ejekanAFK.length)]
                conn.sendMessage(m.chat, { text: `Suit dibatalkan karena @${room.p2.split('@')[0]} menolak.\n${trashTalk}`, mentions: [room.p2] }, { quoted: m })
                delete conn.suit[room.id]
                return !0
            }
        }

        // TAHAP 2: PROSES PEMILIHAN DARI PM
        if (room.status === 'play' && isChoice) {
            let choice = m.text.toLowerCase()
            let isPlayer1 = m.sender === room.p
            let isPlayer2 = m.sender === room.p2

            // PvP otomatis anti-spam bawaan: !room.pilih bikin user cm bisa kirim 1x input
            if (isPlayer1 && !room.pilih) {
                room.pilih = choice
                conn.sendMessage(m.sender, { text: `✅ Pilihan *${choice.toUpperCase()}* tersimpan! Menunggu lawan...` }, { quoted: m })
                if (!room.pilih2) {
                    let notif = `*— [ ⏳ STATUS INPUT ] —*\n\n✅ @${room.p.split('@')[0]} Udah Kasih Input.\n⏱️ Menunggu @${room.p2.split('@')[0]}...`
                    conn.sendMessage(room.chatId, { text: notif, mentions: [room.p, room.p2] }, { quoted: null })
                }
            }
            
            if (isPlayer2 && !room.pilih2) {
                room.pilih2 = choice
                conn.sendMessage(m.sender, { text: `✅ Pilihan *${choice.toUpperCase()}* tersimpan! Menunggu lawan...` }, { quoted: m })
                if (!room.pilih) {
                    let notif = `*— [ ⏳ STATUS INPUT ] —*\n\n✅ @${room.p2.split('@')[0]} Udah Kasih Input.\n⏱️ Menunggu @${room.p.split('@')[0]}...`
                    conn.sendMessage(room.chatId, { text: notif, mentions: [room.p, room.p2] }, { quoted: null })
                }
            }

            // TAHAP 3: HASIL PVP
            if (room.pilih && room.pilih2) {
                let win = ''
                let tie = false

                if (room.pilih === room.pilih2) tie = true
                else if (room.pilih === 'batu' && room.pilih2 === 'gunting') win = room.p
                else if (room.pilih === 'gunting' && room.pilih2 === 'kertas') win = room.p
                else if (room.pilih === 'kertas' && room.pilih2 === 'batu') win = room.p
                else win = room.p2

                let thumb = getThumbnail()

                if (tie) {
                    let tieText = `*— [ 🏳️ HASIL SERI! ] —*\n\n`
                    tieText += `Kalian berdua mengeluarkan *${room.pilih.toUpperCase()}*!\n`
                    tieText += `🔄 *REMATCH OTOMATIS DIMULAI!*\n\n`
                    tieText += `📥 Cek PC kalian lagi untuk milih ulang.`
                    
                    conn.sendMessage(room.chatId, { document: thumb, mimetype: 'image/jpeg', fileName: 'HARPS MD', jpegThumbnail: thumb, caption: tieText, mentions: [room.p, room.p2] }, { quoted: null })
                    
                    room.pilih = null
                    room.pilih2 = null
                    clearTimeout(room.waktu)
                    room.waktu = setTimeout(() => {
                        if (conn.suit[room.id]) {
                            let trashTalk = ejekanAFK[Math.floor(Math.random() * ejekanAFK.length)]
                            conn.sendMessage(room.chatId, { text: `⏳ Waktu 5 menit Rematch habis!\n${trashTalk}` }, { quoted: null })
                            delete conn.suit[room.id]
                        }
                    }, 300000)

                    let sections = [{
                        title: "PILIH SENJATA ANDA",
                        rows: [
                            { title: "✂️ Gunting", id: "gunting" },
                            { title: "📄 Kertas", id: "kertas" },
                            { title: "🪨 Batu", id: "batu" }
                        ]
                    }]
                    let pmBtns = [
                        { name: "single_select", buttonParamsJson: JSON.stringify({ title: "⚔️ Pilih Senjata", sections: sections }) }
                    ]
                    await sendDocButton(conn, room.p, "Pilih senjatamu dengan bijak! Jangan sampai terbaca lawan.", "⏳ Sesi: 5 Menit", pmBtns, null)
                    await sendDocButton(conn, room.p2, "Pilih senjatamu dengan bijak! Jangan sampai terbaca lawan.", "⏳ Sesi: 5 Menit", pmBtns, null)
                    return !0
                }

                let reward = 0;
                let rng = Math.random();

                if (rng <= 0.85) { 
                    reward = Math.floor(Math.random() * (455000 - 165000 + 1)) + 165000;
                } else {
                    reward = Math.floor(Math.random() * (1100000 - 455001 + 1)) + 455001;
                }
                
                let p1name = `@${room.p.split('@')[0]}`
                let p2name = `@${room.p2.split('@')[0]}`

                let result = `*— [ 💥 HASIL AKHIR SUIT ] —*\n\n`
                result += `👤 ${p1name} mengeluarkan: *${room.pilih.toUpperCase()}*\n`
                result += `👤 ${p2name} mengeluarkan: *${room.pilih2.toUpperCase()}*\n\n`
                result += `🏆 *PEMENANG:* @${win.split('@')[0]}\n`
                
                if (reward > 455000) {
                    result += `🎉 *SUPER JACKPOT!* +Rp${reward.toLocaleString('id-ID')}`
                } else {
                    result += `💸 *HADIAH:* +Rp${reward.toLocaleString('id-ID')}`
                }

                global.db.data.users[win].money = (global.db.data.users[win].money || 0) + reward
                
                conn.sendMessage(room.chatId, { document: thumb, mimetype: 'image/jpeg', fileName: 'HARPS MD', jpegThumbnail: thumb, caption: result, mentions: [room.p, room.p2] }, { quoted: null })
                
                clearTimeout(room.waktu)
                delete conn.suit[room.id]
            }
            return !0
        }
    }
}

handler.help = ['suit']
handler.tags = ['game']
handler.command = /^(suit)$/i

module.exports = handler