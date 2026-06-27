let handler = async (m, { conn, args, isAdmin, isOwner }) => {
    if (!m.isGroup) return m.reply("Fitur ini hanya dapat digunakan dalam grup.")
    if (!(isAdmin || isOwner)) return m.reply("Maaf, fitur ini hanya dapat digunakan oleh admin grup.")
    
    global.db.data.chats = global.db.data.chats || {}
    if (!global.db.data.chats[m.chat]) {
        global.db.data.chats[m.chat] = {}
    }
    
    let chat = global.db.data.chats[m.chat]
    
    if (!args[0]) return m.reply("Silakan gunakan:\n*.antitagsw on/off*\n*.antitagsw <angka>* (contoh: .antitagsw 3)")
    
    if (args[0] === "on") {
        chat.antitagsw = true
        chat.antitagswLimit = chat.antitagswLimit || 1 // Set default kuota harian ke 1
        return m.reply(`*Anti Tag Status WhatsApp* berhasil diaktifkan.\nKuota tag harian: *${chat.antitagswLimit} kali / hari*. Jika melebihi kuota, pesan akan otomatis dihapus.`)
    } else if (args[0] === "off") {
        chat.antitagsw = false
        return m.reply("*Anti Tag Status WhatsApp* berhasil dinonaktifkan dalam grup ini.")
    } else if (!isNaN(args[0])) {
        // Jika inputan berupa angka
        let limit = parseInt(args[0])
        if (limit < 1) return m.reply("Batas minimum kuota adalah 1.")
        
        chat.antitagsw = true
        chat.antitagswLimit = limit
        return m.reply(`*Anti Tag Status WhatsApp* diaktifkan!\nSetiap member diperbolehkan nge-tag grup di SW sebanyak *${limit} kali / hari*. Jika melebihi batas, pesan akan otomatis dihapus oleh Bot.`)
    } else {
        return m.reply("Mohon pilih opsi yang valid: *on / off / angka* (contoh: .antitagsw 3)")
    }
}

handler.before = async (m, { conn, isBotAdmin, isAdmin }) => {
    global.db.data.chats = global.db.data.chats || {}
    global.db.data.users = global.db.data.users || {}
    
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
    
    let chat = global.db.data.chats[m.chat]
    let user = global.db.data.users[m.sender]
    
    if (!m.isGroup || !chat.antitagsw) return
    
    const isTaggingInStatus = (
        m.mtype === 'groupStatusMentionMessage' || 
        (m.quoted && m.quoted.mtype === 'groupStatusMentionMessage') ||
        (m.message && m.message.groupStatusMentionMessage) ||
        (m.message && m.message.protocolMessage && m.message.protocolMessage.type === 25)
    )
    
    if (!isTaggingInStatus) return
    
    // --- SISTEM KUOTA HARIAN ---
    // Dapatkan tanggal hari ini (Zona Waktu Indonesia/Jakarta)
    let today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
    
    // Reset hitungan jika hari sudah berganti
    if (user.tagswDate !== today) {
        user.tagswCount = 0
        user.tagswDate = today
    }
    
    // Tambah hitungan tag user hari ini
    user.tagswCount += 1
    let limit = chat.antitagswLimit || 1
    
    // JIKA MASIH DALAM KUOTA HARIAN (Boleh nge-tag)
    if (user.tagswCount <= limit) {
        // Bot diam saja dan membiarkan pesannya terkirim
        return
    }
    
    // JIKA SUDAH MELEBIHI KUOTA HARIAN (Pesannya dihapus)
    if (isBotAdmin) {
        await conn.sendMessage(m.chat, { delete: m.key })
    }
   
    if (isAdmin) { 
        let warningMessage = `Grup ini terdeteksi ditandai dalam Status WhatsApp\n\n` +
                            `@${m.sender.split("@")[0]}, kamu sudah mencapai batas maksimal tag grup hari ini (Limit: ${limit}x).\n\n` +
                            `Karena kamu Admin, pesanmu hanya dihapus.`
        
        return conn.sendMessage(m.chat, { text: warningMessage, mentions: [m.sender] })
    } else {
        let warningMessage = `@${m.sender.split("@")[0]}, kamu telah melewati batas tag SW hari ini (*Limit: ${limit}x / Hari*).\n\n` +
                            `Pesan otomatis dihapus. Harap patuhi aturan grup.`
        
        return conn.sendMessage(m.chat, { text: warningMessage, mentions: [m.sender] })
    }
}

handler.command = ['antitagsw']
handler.help = ['antitagsw'].map(a => a + ' *on/off/angka*');
handler.tags = ['admin', 'group']
handler.group = true
handler.admin = true

module.exports = handler