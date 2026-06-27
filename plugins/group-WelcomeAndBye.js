let handler = async (m, { conn, text, isROwner, isOwner, command }) => {
  if (!text) throw 'Teksnya mana?\n\n*Keterangan:*\n@user (Mention)\n@subject (Judul Grup)\n@desc (Deskripsi Grup)'

  let cmd = command.toLowerCase()
  
  // Memastikan database chat ada agar tidak terjadi error undefined
  let chat = global.db.data.chats[m.chat]
  if (!chat) chat = global.db.data.chats[m.chat] = {}

  if (cmd === 'setwelcome') {
    if (isROwner) global.conn.welcome = text
    else if (isOwner) conn.welcome = text
    
    chat.sWelcome = text
    m.reply('✅ Welcome berhasil diatur\n@user (Mention)\n@subject (Judul Grup)\n@desc (Deskripsi Grup)')
  }

  if (cmd === 'setbye') {
    if (isROwner) global.conn.bye = text
    else if (isOwner) conn.bye = text
    
    chat.sBye = text
    m.reply('✅ Bye berhasil diatur\n@user (Mention)')
  }
}

handler.help = ['setwelcome <teks>', 'setbye <teks>']
handler.tags = ['owner', 'group']
handler.command = /^(setwelcome|setbye)$/i

handler.botAdmin = true

module.exports = handler