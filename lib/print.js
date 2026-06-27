let WAMessageStubType = null

let urlRegex = require('url-regex-safe')({ strict: false })
let PhoneNumber = require('awesome-phonenumber')
let terminalImage = global.opts['img'] ? require('terminal-image') : null
let chalk = require('chalk')
let fs = require('fs')

module.exports = async function (m, conn = { user: {} }) {
  try {
    if (!WAMessageStubType) {
      try {
        const { loadBaileys } = await import('../HARPSMD.mjs');
        const baileys = await loadBaileys();
        WAMessageStubType = baileys.WAMessageStubType || baileys.default?.WAMessageStubType || baileys.proto?.MessageStubType || {}
      } catch (e) {
        WAMessageStubType = {};
      }
    }

    let senderJid = m.sender || '';
    let chatJid = m.chat || '';

    let _name = senderJid ? await conn.getName(senderJid).catch(() => '') : '';
    let senderNum = senderJid ? PhoneNumber('+' + senderJid.replace('@s.whatsapp.net', '')).getNumber('international') : 'System/Unknown';
    let sender = senderNum + (_name ? ' ~ ' + _name : '');
    
    let chat = chatJid ? await conn.getName(chatJid).catch(() => '') : '';
    let img;
    
    try {
      if (global.opts['img'] && terminalImage && m.download)
        img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
    } catch (e) {
      // Abaikan error download gambar
    }

    let filesize = (m.msg ?
      m.msg.vcard ? m.msg.vcard.length :
      m.msg.fileLength ? m.msg.fileLength.low || m.msg.fileLength :
      m.msg.axolotlSenderKeyDistributionMessage ? m.msg.axolotlSenderKeyDistributionMessage.length :
      m.text ? m.text.length : 0
    : m.text ? m.text.length : 0) || 0

    let user = global.DATABASE?.data?.users ? global.DATABASE.data.users[m.sender] : null;
    let me = PhoneNumber('+' + (conn.user?.jid || '').replace('@s.whatsapp.net', '')).getNumber('international')
    
    // ---------------------------------------------------------
    // Logika Total Grup yang Aman
    // ---------------------------------------------------------
    let chatsData = Object.keys(conn.chats || global.db?.data?.chats || {})
    let totalGroups = chatsData.filter(jid => jid?.endsWith('@g.us')).length
    
    let ts = m.messageTimestamp?.low || m.messageTimestamp || Math.floor(Date.now() / 1000);
    let timeStr = new Date(1000 * ts).toTimeString().split(' ')[0]
    
    let sizeStr = filesize === 0 ? '0 B' : (filesize / 1000 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1) + ' ' + (['', ...'KMGTP'][Math.floor(Math.log(filesize) / Math.log(1000))] || '') + 'B'
    let msgType = m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : 'Teks'
    let stubType = m.messageStubType ? (WAMessageStubType[m.messageStubType] || 'System') : 'Pesan Biasa'

    // ---------------------------------------------------------
    // UI Terminal
    // ---------------------------------------------------------
    console.log(`\n${chalk.cyanBright('╭━━━')} ${chalk.bgCyanBright.black(' 📬 PESAN BARU ')} ${chalk.cyanBright('━━━━━━━━━━━━━━━━━━━━━━━━━━━╮')}`)
    console.log(`${chalk.cyanBright('│')} 🤖 ${chalk.bold.white('Bot      :')} ${chalk.greenBright(me + ' ~ ' + (conn.user?.name || ''))}`)
    console.log(`${chalk.cyanBright('│')} 🌐 ${chalk.bold.white('Grup Bot :')} ${chalk.bgYellowBright.black(` ${totalGroups} Grup Aktif `)}`)
    console.log(`${chalk.cyanBright('├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤')}`)
    console.log(`${chalk.cyanBright('│')} ⏰ ${chalk.bold.white('Waktu    :')} ${chalk.yellowBright(timeStr)}`)
    console.log(`${chalk.cyanBright('│')} 📤 ${chalk.bold.white('Dari     :')} ${chalk.magentaBright(sender)}`)
    console.log(`${chalk.cyanBright('│')} 📥 ${chalk.bold.white('Ke/Grup  :')} ${chalk.blueBright(m.chat + (chat ? ' ~ ' + chat : ''))}`)
    console.log(`${chalk.cyanBright('├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤')}`)
    console.log(`${chalk.cyanBright('│')} 📑 ${chalk.bold.white('Tipe     :')} ${chalk.cyanBright(stubType)} | ${chalk.greenBright(msgType)}`)
    console.log(`${chalk.cyanBright('│')} 📊 ${chalk.bold.white('Ukuran   :')} ${chalk.redBright(sizeStr)}`)
    console.log(`${chalk.cyanBright('│')} 🌟 ${chalk.bold.white('Status   :')} EXP: ${chalk.yellowBright(m.exp ?? '?')} ${user ? chalk.white('| Lvl: ') + chalk.greenBright(user.exp || 0) + chalk.white(' | Limit: ') + chalk.redBright(user.limit || 0) : ''}`)
    console.log(`${chalk.cyanBright('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯')}`)

    if (img) console.log(img.trimEnd())

    if (typeof m.text === 'string' && m.text) {
      let log = m.text.replace(/\u200e+/g, '')
      let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
      let mdFormat = (depth = 4) => (_, type, text, monospace) => {
        let types = { _: 'italic', '*': 'bold', '~': 'strikethrough' }
        text = text || monospace
        return !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)))
      }
      if (log.length < 4096)
        log = log.replace(urlRegex, (url, i, text) => {
          let end = url.length + i
          return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1])) ? chalk.blueBright.underline(url) : url
        })
      log = log.replace(mdRegex, mdFormat(4))
      if (m.mentionedJid) for (let usr of m.mentionedJid) log = log.replace('@' + usr.split`@`[0], chalk.bgBlueBright.white('@' + await conn.getName(usr).catch(()=>'')))
      
      console.log(`💬 ${chalk.bold.white('Isi Pesan:')}\n${m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellowBright(log) : chalk.whiteBright(log)}`)
    }

    if (m.messageStubParameters) console.log(m.messageStubParameters.map(jid => {
      jid = conn.decodeJid(jid)
      let name = conn.getName(jid) // Sync call for simplicity in original
      return chalk.gray(PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international') + (name ? ' ~' + name : ''))
    }).join(', '))

    if (/document/i.test(m.mtype)) console.log(`📄 ${chalk.magentaBright(m.msg?.filename || m.msg?.displayName || 'Document')}`)
    else if (/ContactsArray/i.test(m.mtype)) console.log(`👨‍👩‍👧‍👦 `)
    else if (/contact/i.test(m.mtype)) console.log(`👨 ${chalk.greenBright(m.msg?.displayName || '')}`)
    else if (/audio/i.test(m.mtype)) {
      let s = m.msg?.seconds || 0
      console.log(`${m.msg?.ptt ? '🎤 (PTT ' : '🎵 ('}AUDIO) ${chalk.cyanBright(Math.floor(s / 60).toString().padStart(2, 0) + ':' + (s % 60).toString().padStart(2, 0))}`)
    }

    console.log() 
  } catch (err) {
    console.log(chalk.redBright('Terjadi kesalahan ringan di logger print.js:'), err.message);
  }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'lib/print.js'"))
  delete require.cache[file]
  require(file)
})