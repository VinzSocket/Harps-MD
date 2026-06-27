let handler = async(m, { conn, text, participants, command }) => {
    let cmd = command.toLowerCase()
    
    // Ambil semua ID member grup untuk keperluan mention
    let memberIds = participants.map(a => a.id)

    if (cmd === 'tagall') {
        // --- TAMPILAN TAGALL YANG LEBIH AESTHETIC ---
        let teks = `乂  *P E N G U M U M A N* 乂\n\n`
        teks += `📢 *Pesan:* ${text ? text : 'Tidak ada pesan'}\n\n`
        teks += `*👥 Anggota Grup:*\n┌─\n`
        
        for (let mem of participants) {
            teks += `│ ◦ @${mem.id.split('@')[0]}\n`
        }
        teks += `└────\n`

        // Kirim pesan dengan mention terlihat
        await conn.sendMessage(m.chat, { text: teks, mentions: memberIds }, { quoted: m })
        
    } else if (cmd === 'hidetag' || cmd === 'h') {
        // --- FITUR HIDETAG (TAG TERSEMBUNYI) ---
        // Pesan akan muncul seperti teks biasa, tapi notifikasi masuk ke semua member
        let pesan = text ? text : '📢 Ada pengumuman dari Admin!'
        
        await conn.sendMessage(m.chat, { text: pesan, mentions: memberIds }, { quoted: m })
    }
}

handler.help = ['tagall <pesan>', 'hidetag <pesan>', 'h <pesan>']
handler.tags = ['group']
// Regex command digabung agar mendeteksi tagall, hidetag, dan h
handler.command = /^(tagall|hidetag|h)$/i

handler.group = true
handler.admin = true

module.exports = handler