// ==========================================
// FITUR RPG LEADERBOARD (GLOBAL)
// Terintegrasi dengan Player & NPC
// ==========================================

function formatSingkat(n) {
    n = n || 0;
    if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T';
    if (n >= 1e9)  return (n / 1e9).toFixed(2)  + ' M';
    if (n >= 1e6)  return (n / 1e6).toFixed(2)  + ' Jt';
    return n.toLocaleString('id-ID');
}

let handler = async (m, { conn, args }) => {
    let dbUsers = global.db.data.users || {};
    
    // Map data user & NPC dan kalkulasi total aset kekayaan
    let users = Object.entries(dbUsers).map(([key, value]) => {
        let totalKasPT = 0;
        if (value.perusahaan && Array.isArray(value.perusahaan)) {
            value.perusahaan.forEach(pt => totalKasPT += (pt.saldo || 0));
        }
        
        let totalKekayaan = (value.money || 0) + (value.bank || 0) + totalKasPT;

        return {
            ...value, 
            jid: key,
            kekayaan: totalKekayaan
        };
    });

    if (users.length === 0) {
        return conn.reply(m.chat, '• *Leaderboard* •\n\nBelum ada data user di dalam database.', m);
    }

    let len = args[0] && args[0].length > 0 ? Math.min(10, Math.max(parseInt(args[0]), 10)) : Math.min(10, users.length);

    // Sorting berdasarkan masing-masing kategori
    let sortedKekayaan = users.slice().sort((a, b) => (b.kekayaan || 0) - (a.kekayaan || 0));
    let sortedExp = users.slice().sort((a, b) => (b.exp || 0) - (a.exp || 0));
    let sortedLim = users.slice().sort((a, b) => (b.limit || 0) - (a.limit || 0));
    let sortedLevel = users.slice().sort((a, b) => (b.level || 0) - (a.level || 0));
    let sortedMoney = users.slice().sort((a, b) => (b.money || 0) - (a.money || 0));
    let sortedDiamond = users.slice().sort((a, b) => (b.diamond || 0) - (a.diamond || 0));
    let sortedEmas = users.slice().sort((a, b) => (b.emas || 0) - (a.emas || 0));
    let sortedBank = users.slice().sort((a, b) => (b.bank || 0) - (a.bank || 0));

    // Ekstrak ID untuk mencari ranking player yang mengetik command
    let usersKekayaan = sortedKekayaan.map(u => u.jid);
    let usersExp = sortedExp.map(u => u.jid);
    let usersLim = sortedLim.map(u => u.jid);
    let usersLevel = sortedLevel.map(u => u.jid);
    let usersMoney = sortedMoney.map(u => u.jid);
    let usersDiamond = sortedDiamond.map(u => u.jid);
    let usersEmas = sortedEmas.map(u => u.jid);
    let usersBank = sortedBank.map(u => u.jid);

    // Fungsi pembeda nama Player Asli vs NPC
    const getUserName = async (jid) => {
        let u = dbUsers[jid];
        // Tambahkan ikon Robot jika dia adalah NPC dari rpg-npc.js
        if (u && u.isNPC) return `🤖 ${u.name}`; 
        
        // Tambahkan ikon User jika dia player asli
        if (u && u.name && !u.isNPC) return `👤 ${u.name}`;
        
        try {
            let name = await conn.getName(jid);
            return `👤 ${name || jid.split('@')[0]}`;
        } catch {
            return `👤 ${jid.split('@')[0]}`;
        }
    };

    // Render List UI menggunakan Promise.all
    let kekayaanList = await Promise.all(sortedKekayaan.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _Rp ${formatSingkat(u.kekayaan)} Aset_`));
    let expList = await Promise.all(sortedExp.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _${formatSingkat(u.exp)} Exp_`));
    let limList = await Promise.all(sortedLim.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _${formatSingkat(u.limit)} Limit_`));
    let levelList = await Promise.all(sortedLevel.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _Level ${u.level || 0}_`));
    let moneyList = await Promise.all(sortedMoney.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _Rp ${formatSingkat(u.money)}_`));
    let diamondList = await Promise.all(sortedDiamond.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _${formatSingkat(u.diamond)} Diamond_`));
    let emasList = await Promise.all(sortedEmas.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _${formatSingkat(u.emas)} Emas_`));
    let bankList = await Promise.all(sortedBank.slice(0, len).map(async (u, i) => `${i + 1}. *${await getUserName(u.jid)}* • _Rp ${formatSingkat(u.bank)}_`));

    let text = `
🏆 *LEADERBOARD GLOBAL RPG* 🏆
_Pertarungan antara Player (👤) vs NPC (🤖)_

💰 *Top ${len} Aset Konglomerat*
Kamu: *${usersKekayaan.indexOf(m.sender) + 1}* dari *${usersKekayaan.length}*

${kekayaanList.join('\n') || 'Tidak ada data'}

💵 *Top ${len} Uang Tunai*
Kamu: *${usersMoney.indexOf(m.sender) + 1}* dari *${usersMoney.length}*

${moneyList.join('\n') || 'Tidak ada data'}

🏦 *Top ${len} Tabungan Bank*
Kamu: *${usersBank.indexOf(m.sender) + 1}* dari *${usersBank.length}*

${bankList.join('\n') || 'Tidak ada data'}

📈 *Top ${len} Level Tertinggi*
Kamu: *${usersLevel.indexOf(m.sender) + 1}* dari *${usersLevel.length}*

${levelList.join('\n') || 'Tidak ada data'}

✨ *Top ${len} EXP*
Kamu: *${usersExp.indexOf(m.sender) + 1}* dari *${usersExp.length}*

${expList.join('\n') || 'Tidak ada data'}

💠 *Top ${len} Diamond*
Kamu: *${usersDiamond.indexOf(m.sender) + 1}* dari *${usersDiamond.length}*

${diamondList.join('\n') || 'Tidak ada data'}

🥇 *Top ${len} Emas*
Kamu: *${usersEmas.indexOf(m.sender) + 1}* dari *${usersEmas.length}*

${emasList.join('\n') || 'Tidak ada data'}

🎟️ *Top ${len} Limit*
Kamu: *${usersLim.indexOf(m.sender) + 1}* dari *${usersLim.length}*

${limList.join('\n') || 'Tidak ada data'}
`.trim();

    conn.reply(m.chat, text, m);
};

handler.help = ['leaderboard <jumlah user>'];
handler.tags = ['info'];
handler.command = /^(leaderboard|lb)$/i;

handler.owner = false;
handler.mods = false;
handler.premium = false;
handler.group = true;
handler.private = false;

handler.admin = false;
handler.botAdmin = false;
handler.rpg = true;

handler.fail = null;

module.exports = handler;
