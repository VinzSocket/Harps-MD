const namaNpc = [
    "Firefly", "Raka", "Alif", "Arya", "Arga", "Furina", "Aksa", "Adit", "Akbar", "Axel", 
    "Bima", "Bagas", "Bara", "Banu", "Daffa", "Damar", "Dika", "Dimas", "Danu", "Dilan", 
    "Evan", "Elvan", "Ega", "Fajar", "Fikri", "Faris", "Farhan", "Galang", "Gibran", "Hafiz", 
    "Haikal", "Ilham", "Irfan", "Iqbal", "Jovan", "Jordan", "Karel", "Kevin", "Hutao", "Kai", 
    "Luthfi", "Leon", "Malik", "Naufal", "Nanda", "Niko", "Omar", "Pandu", "Pras", "Rafi", 
    "Rafa", "Rayhan", "Reyhan", "Reza", "Rangga", "Rizky", "Rio", "Saka", "Sena", "Satya", 
    "Syahrul", "Tegar", "Shiroko", "Vino", "Vian", "Yoga", "Yusuf", "Zidan", "Zaky", "Zayyan", 
    "Abi", "Abin", "Adnan", "Arel", "Bayu", "Candra", "Darel", "Dery", "Farel", "Ghani", 
    "Hilmi", "Jefri", "Kavin", "Lazu", "Miko", "Nara", "Ojan", "Pasha", "Qivan", "Rasyid", 
    "Sandi", "Taufik", "Ubay", "Varel", "Wira", "Yafi", "Zafran", "Arvin", "Alvan", "Rifan",
    "Aether","Lumine","Paimon","Amber","Kaeya","Lisa","Jean","Diluc","Venti","Razor","Bennett",
    "Noelle","Fischl","Sucrose","Mona","Barbara","Klee","Diona","Albedo","Rosaria","Eula","Mika",
    "Tartaglia","Zhongli","Xiao","Ganyu","Keqing","Ningguang","Beidou","Xiangling","Xingqiu",
    "Chongyun","Xinyan","Yanfei","Shenhe","YunJin","Yelan","Yaoyao","Baizhu","Gaming","Xianyun",
    "RaidenShogun","YaeMiko","KamisatoAyato","KamisatoAyaka","Yoimiya","Kokomi","Kazuha","Thoma",
    "Sayu","Gorou","Itto","Sara","Shinobu","Heizou","Kirara","Chiori","Wanderer","Nahida",
    "Alhaitham","Cyno","Tighnari","Nilou","Dehya","Candace","Layla","Faruzan","Kaveh","Sethos",
    "Neuvillette","Wriothesley","Navia","Lyney","Lynette","Freminet","Charlotte","Chevreuse",
    "Sigewinne","Arlecchino","Clorinde","Emilie","Dainsleif","Signora","Dottore","Capitano",
    "Columbina","Pierro","Pantalone","Pulcinella","Sandrone","Guizhong","Rukkhadevata","Egeria",
    "Deshret","Makoto","Rhinedottir","Skirk","Alice","Hoshino","Serika","Nonomi","Ayane","Hina",
    "Iori","Haruna","Aru","Mutsuki","Kayoko","Haruka","Izumi","Junko","Akari","Yuuka","Noa",
    "Koyuki","Aris","Momoi","Midori","Yuzu","Neru","Asuna","Karin","Akane","Toki","Mika","Nagisa",
    "Seia","Koharu","Hanako","Azusa","Hifumi","Tsurugi","Hasumi","Mashiro","Ichika","Mine",
    "Serina","Hanae","Fuuka","Juri","Izuna","Michiru","Tsukuyo","Wakamo","Kasumi","Megu","Kanna",
    "Fubuki","Kirino","Saori","Atsuko","Misaki","Hiyori","Miyako","Saki","Miyu","Moe","Chihiro",
    "Maki","Hare","Kotama","Himari","Eimi","Shun","Kokona","Mina","Rumi","Saya","Shizuko","Pina",
    "Kaede","Mimori","Tsubaki","Umika","Natsu","Kazusa","Reisa","Yoshimi","Airi","Minori","Nodoka",
    "Shigure","Miku","Rin","Ayumu","Momoka","Sora","Plana","Arona","BlackSuit","Maestro",
    "Golconde","Decalcomanie","Beatrice","Phrenapates","Kuzunoha","Yume","Caelus","Stelle",
    "March7th","DanHeng","Himeko","Welt","Kafka","SilverWolf","Blade","JingYuan","Yanqing",
    "Bailu","Tingyun","Sushang","Qingque","FuXuan","Luocha","Yukong","Jingliu","ImbibitorLunae",
    "Huohuo","Hanya","Xueyi","RuanMei","DrRatio","BlackSwan","Sparkle","Misha","Acheron",
    "Aventurine","Gallagher","Robin","Boothill","Jade","Topaz","Numby","Cocolia","Phantylia",
    "Gepard","Serval","Pela","Lynx","Natasha","Clara","Svarog","Hook","Sampo","Luka","Arlan",
    "Asta","Herta","Guinaifen","Sunday","Kiana","Mei","BronyaZaychik","Theresa","MurataHimeko",
    "FuHua","YaeSakura","Kallen","Rita","Durandal","SeeleVollerei","Rozaliya","Liliya","Elysia",
    "Eden","Aponia","Mobius","Vill-V","Kalpas","Su","Sakura","Kosma","Griseo","Pardofelis","Kevin",
    "Otto","Siegfried","Cecilia","Raven","Sora","Carole","Timido","Lyle","Adam","RaidenMei",
    "Herrscher","Sirin","Bella","Benares","Klein","Niggurath","Tesla","Einstein","WeltJoyce",
    "WeltYang","Prometheus","Amiya","Kal'tsit","Chen","Talulah","W","Exusiai","Texas","Lappland",
    "SilverAsh","Surtr","Eyjafjalla","Ifrit","Saria","Hoshiguma","Skadi","Specter","Gladiia",
    "Mudrock","Thorns","Phantom","Angelina","Schwarz","Hellagur","Blaze","Rosmontis","Nian","Dusk",
    "Ling","Chongyue","Shu","ZuoLe","Saga","Ceobe","Suzuran","Mostima","Magallan","Weedy","Eunectes",
    "Blemishine","Passenger","Carnelian","Pallas","Mizuki","Fartooth","Flametail","Gnosis","Lee",
    "Goldenglow","Fiammetta","Horn","Irene","Lumen","Dorothy","Pozyomka","Gavial","Mlynar",
    "Stainless","Penance","Vigil","Reed","Lin","Qiubai","Ines","Ho'olheyak","Muelsyse","Typhon",
    "Rover","Yangyang","Chixia","Baizhi","Sanhua","Mortefi","Danjin","Aalto","Jianxin","Lingyang",
    "Calcharo","Encore","Verina","Jiyan","Yinlin","Jinhsi","Changli","Yuanwu","Taoqi","Jue","Scar",
    "Phrolova","GeshuLin","XiangliYao","Zhezhi","Camellya","Alto","Shorekeeper","Yilin","Genzone",
    "Chun","Jueyuan","Zhaozheng","Zhaoyu","Mash","Artoria","Gilgamesh","Emiya","CuChulainn",
    "Medusa","Heracles","SasakiKojiro","Hassan","Jeanned'Arc","Jalter","Nero","Tamamo","Altera",
    "Scathach","Iskandar","Waver","Ozymandias","Nitocris","Cleopatra","Merlin","KingHassan",
    "Musashi","Tomoe","Muramasa","Morgan","Melusine","Barghest","BaobhanSith","Oberon","Castoria",
    "Koyanskaya","Douman","Kama","Parvati","Ishtar","Ereshkigal","Quetzalcoatl","Tiamat","Abigail",
    "Hokusai","YangGuifei","BB","Meltryllis","Passionlip","Kingprotea","Belle","Wise","Anby",
    "Nicole","Billy","Nekomata","Corin","VonLycaon","Ellen","Soukaku","Koleda","Anton","Ben","Grace",
    "Soldier11","ZhuYuan","Qingyi","JaneDoe","Seth","Rina","Rapi","Anis","Neon","Marian","Shifty",
    "Viper","RedHood","SnowWhite","Scarlet","Rapunzel","Privaty","Yuni","Mihara","Rupee","Ludmilla",
    "Jackal","Blanc","Noir","Tia","Naga","Liter","Centi","Marciana","Crown","Chime","Modernia",
    "Nihilister","Chatterbox","Enikk","Einkk","Diesel","Brid","Soline","Eunhwa"
];

function getRandomName() { 
    return `[NPC] ${namaNpc[Math.floor(Math.random() * namaNpc.length)]}`; 
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        if (!global.db || !global.db.data || !global.db.data.users) return m.reply('❌ Database user belum siap.');
        if (!global.db.data.negara) global.db.data.negara = { kas: 100000000000, bank: false };
        if (!global.rpgJobs) return m.reply('❌ Data pekerjaan belum terbaca! Cek rpg-pekerjaan.js dan RESTART BOT.');

        let action = command.toLowerCase();

        if (action === 'setnpc') {
            let jumlah = parseInt(args[0]);
            if (isNaN(jumlah) || jumlah < 1 || jumlah > 600) {
                return m.reply(`⚠️ Format: *${usedPrefix}setnpc <jumlah>*\n_Maks: 600 NPC_`);
            }

            m.reply(`⏳ Meng-generate ${jumlah} NPC Eksekutif...`);

            const jobsKeys = Object.keys(global.rpgJobs);
            const kelasBawah = jobsKeys.filter(j => global.rpgJobs[j].level <= 20);
            const kelasMenengah = jobsKeys.filter(j => global.rpgJobs[j].level > 20 && global.rpgJobs[j].level <= 40);
            const kelasAtas = jobsKeys.filter(j => global.rpgJobs[j].level > 40);

            let countBawah = 0, countMenengah = 0, countAtas = 0;

            for (let i = 0; i < jumlah; i++) {
                let npcId = `npc_${Date.now()}_${Math.floor(Math.random() * 10000)}@s.whatsapp.net`;
                let r = Math.random();
                let kasta, jobListTarget, baseLevel, baseMoney;

                if (r < 0.60) {
                    kasta = 'Bawah'; jobListTarget = kelasBawah; baseLevel = Math.floor(Math.random() * 15) + 1; baseMoney = Math.floor(Math.random() * 500000); countBawah++;
                } else if (r < 0.90) {
                    kasta = 'Menengah'; jobListTarget = kelasMenengah; baseLevel = Math.floor(Math.random() * 20) + 21; baseMoney = Math.floor(Math.random() * 5000000) + 1000000; countMenengah++;
                } else {
                    kasta = 'Atas'; jobListTarget = kelasAtas; baseLevel = Math.floor(Math.random() * 60) + 41; baseMoney = Math.floor(Math.random() * 50000000) + 10000000; countAtas++;
                }

                if (jobListTarget.length === 0) jobListTarget = jobsKeys; 

                let profesi = jobListTarget[Math.floor(Math.random() * jobListTarget.length)];
                let targetHargaRumah = Math.floor(Math.random() * (657000000 - 355000000 + 1)) + 355000000;

                global.db.data.users[npcId] = {
                    name: getRandomName(),
                    kasta: kasta,
                    job: profesi,
                    level: baseLevel,
                    money: baseMoney,
                    bank: 0, 
                    emas: 0,
                    diamond: 0,
                    exp: 0,
                    pekerjaansatu: 0, 
                    punyaRumah: false,
                    hargaRumah: targetHargaRumah, 
                    lastPajakRumah: Date.now(),
                    lastBankTax: Date.now(),
                    perusahaan: [], 
                    isNPC: true
                };
            }

            let txt = `✅ *SUKSES MEMBUAT ${jumlah} POPULASI NPC*\n\n`
                + `📊 *Demografi:*\n`
                + `• Atas: ${countAtas}\n`
                + `• Menengah: ${countMenengah}\n`
                + `• Bawah: ${countBawah}\n\n`
                + `_Sistem NPC telah Aktif di background._`;
            
            return m.reply(txt);
        }

        if (action === 'delnpc') {
            let total = 0;
            for (let uid in global.db.data.users) {
                let u = global.db.data.users[uid];
                if (u && (u.isNPC || uid.startsWith('npc_'))) {
                    delete global.db.data.users[uid];
                    total++;
                }
            }
            return m.reply(`✅ *TERHAPUS ${total} NPC* dari database.`);
        }

        if (action === 'resetnpc') {
            let total = 0;
            for (let uid in global.db.data.users) {
                let u = global.db.data.users[uid];
                if (u && (u.isNPC || uid.startsWith('npc_'))) {
                    delete global.db.data.users[uid];
                    total++;
                }
            }
            global.db.data.lastNpcTick = 0;
            global.db.data.lastNpcHourlyTick = 0;
            
            return m.reply(`🔄 *SISTEM NPC DI-RESET TOTAL*\n\nBerhasil menghapus ${total} NPC dan mereset ulang seluruh timer siklus kegiatan NPC ke titik nol.`);
        }

    } catch (e) {
        console.error('ERROR COMMAND NPC ADMIN:', e);
        m.reply(`❌ Terjadi error: ${e.message}`);
    }
};

handler.help = ['setnpc <jumlah>', 'delnpc', 'resetnpc'];
handler.tags = ['owner'];
handler.command = /^(setnpc|delnpc|resetnpc)$/i;

handler.owner = true;

module.exports = handler;
