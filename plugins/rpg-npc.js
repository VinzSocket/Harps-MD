const namaPerusahaan = [
    "PT Harps Teknologi Nusantara", "PT Harps Digital Indonesia", "PT Harps Solusi Integrasi", "PT Harps Sistem Cerdas", "PT Harps Data Informatika", "PT Harps Jaringan Teknologi", "PT Harps Inovasi Digital", "PT Harps Media Teknologi", "PT Harps Karya Nusantara", "PT Harps Cipta Teknologi", 
    "PT Raka Teknologi Nusantara", "PT Raka Digital Indonesia", "PT Raka Solusi Sistem", "PT Raka Data Informatika", "PT Raka Inovasi Teknologi", "PT Raka Cipta Digital", "PT Raka Media Nusantara", "PT Raka Sistem Integrasi", "PT Raka Jaringan Digital", "PT Raka Prima Teknologi", 
    "PT Alvin Teknologi Nusantara", "PT Alvin Digital Indonesia", "PT Alvin Solusi Sistem", "PT Alvin Inovasi Teknologi", "PT Alvin Cipta Nusantara", "PT Alvin Data Informatika", "PT Alvin Sistem Integrasi", "PT Alvin Media Digital", "PT Alvin Prima Teknologi", "PT Alvin Jaringan Nusantara", 
    "CV Harps Media Kreatif", "CV Harps Solusi Digital", "CV Harps Cipta Mandiri", "CV Harps Teknologi Sejahtera", "CV Harps Mitra Nusantara", "CV Harps Data Komputama", "CV Harps Karya Digital", "CV Harps Inovasi Mandiri", "CV Harps Sistem Utama", "CV Harps Jaya Teknologi", 
    "CV Raka Media Kreatif", "CV Raka Solusi Digital", "CV Raka Cipta Mandiri", "CV Raka Teknologi Sejahtera", "CV Raka Mitra Nusantara", "CV Raka Data Komputama", "CV Raka Karya Digital", "CV Raka Inovasi Mandiri", "CV Raka Sistem Utama", "CV Raka Jaya Teknologi", 
    "CV Alvin Media Kreatif", "CV Alvin Solusi Digital", "CV Alvin Cipta Mandiri", "CV Alvin Teknologi Sejahtera", "CV Alvin Mitra Nusantara", "CV Alvin Data Komputama", "CV Alvin Karya Digital", "CV Alvin Inovasi Mandiri", "CV Alvin Sistem Utama", "CV Alvin Jaya Teknologi", 
    "Firma Harps Konsultan Digital", "Firma Harps Mitra Teknologi", "Firma Harps Solusi Bisnis", "Firma Harps Rekacipta Sistem", "Firma Harps Integrasi Data", "Firma Harps Karya Informatika", "Firma Harps Inovasi Usaha", "Firma Harps Mitra Nusantara", 
    "Firma Raka Konsultan Digital", "Firma Raka Mitra Teknologi", "Firma Raka Solusi Bisnis", "Firma Raka Rekacipta Sistem", "Firma Raka Integrasi Data", "Firma Raka Karya Informatika", "Firma Raka Inovasi Usaha", "Firma Raka Mitra Nusantara", 
    "UD Harps Jaya Komputer", "UD Harps Sumber Digital", "UD Harps Mitra Usaha", "UD Harps Sentra Teknologi", "UD Harps Karya Mandiri", "UD Harps Prima Data", 
    "UD Raka Jaya Komputer", "UD Raka Sumber Digital", "UD Raka Mitra Usaha", "UD Raka Sentra Teknologi", "UD Raka Karya Mandiri", "UD Raka Prima Data"
];

function formatRp(n) { return 'Rp ' + (n || 0).toLocaleString('id-ID'); }
function formatSingkat(n) {
    n = n || 0;
    if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T';
    if (n >= 1e9)  return (n / 1e9).toFixed(2)  + ' M';
    if (n >= 1e6)  return (n / 1e6).toFixed(2)  + ' Jt';
    return n.toLocaleString('id-ID');
}

function getMarketStatus(seedOffset) {
    let d = new Date();
    let jamCounter = Math.floor(d.getTime() / (1000 * 60 * 60));
    let jamDalamHari = d.getHours(); 
    
    let x = Math.sin(jamCounter + seedOffset) * 10000;
    let rng = x - Math.floor(x);
    let persentase = 0;
    
    if (jamCounter % 72 === 0) { persentase = 2.0; } 
    else if (jamDalamHari % 8 === 0) { persentase = (41 + (rng * 79)) / 100; } 
    else if (jamDalamHari === 23) { persentase = -0.60; } 
    else {
        if (rng > 0.5) persentase = (10 + (rng * 30)) / 100;
        else persentase = -((20 + (rng * 20)) / 100);
    }
    return persentase;
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        if (!global.db || !global.db.data || !global.db.data.users) return m.reply('❌ Database user belum siap.');
        if (!global.db.data.negara) global.db.data.negara = { kas: 100000000000, bank: false };
        if (!global.db.data.negara.pdam) global.db.data.negara.pdam = { saldo: 0, investasi: {}, totalInvestasi: 0 };
        
        let action = command.toLowerCase();

        if (action === 'infonpc' || action === 'globalnpc') {
            let providerNames = {};
            for (let uid in global.db.data.users) {
                let u = global.db.data.users[uid];
                if (u && Array.isArray(u.perusahaan)) {
                    u.perusahaan.forEach(pt => {
                        if (pt && pt.type === 'listrik') providerNames[pt.id] = pt.name || String(pt.id);
                    });
                }
            }

            let total = 0, kaya = 0, menengah = 0, miskin = 0, punyaRumah = 0, totalInvestor = 0;
            let totalUangBeredar = 0, totalUangDiBank = 0, totalPerusahaan = 0, totalKasPT = 0;
            let totalEmas = 0, totalDiamond = 0;
            let listrikRumahPLN = 0, listrikRumahSwasta = {};
            
            let totalKonsumsiListrik15m = 0, totalKonsumsiAir15m = 0; 
            let totalKonsumsiPTListrik15m = 0, totalKonsumsiPTAir15m = 0; 
            
            let pctEmas = getMarketStatus(1);
            let Semas = Math.floor(1296000 + (1296000 * pctEmas));
            let pctDiamond = getMarketStatus(2);
            let Sdiamond = Math.floor(4081000 + (4081000 * pctDiamond));

            for (let uid in global.db.data.users) {
                let u = global.db.data.users[uid];
                if (u && (u.isNPC || uid.startsWith('npc_'))) {
                    total++;
                    totalUangBeredar += (u.money || 0);
                    totalUangDiBank += (u.bank || 0);
                    
                    if (u.kasta === 'Atas') kaya++;
                    if (u.kasta === 'Menengah') menengah++;
                    if (u.kasta === 'Bawah') miskin++;
                    if (u.punyaRumah) {
                        punyaRumah++;
                        if (!u.sumberListrikRumah || u.sumberListrikRumah === 'negara') {
                            listrikRumahPLN++;
                        } else {
                            listrikRumahSwasta[u.sumberListrikRumah] = (listrikRumahSwasta[u.sumberListrikRumah] || 0) + 1;
                        }
                        totalKonsumsiListrik15m += (u.konsumsiListrikRumah || 2000);
                        totalKonsumsiAir15m += (u.konsumsiAirRumah || 4);
                    }
                    
                    totalEmas += (u.emas || 0);
                    totalDiamond += (u.diamond || 0);
                    
                    let totalAsetNPC = (u.money || 0) + (u.bank || 0) + ((u.emas || 0) * Semas) + ((u.diamond || 0) * Sdiamond);
                    
                    if (u.perusahaan && u.perusahaan.length > 0) {
                        totalPerusahaan += u.perusahaan.length;
                        u.perusahaan.forEach(pt => {
                            totalKasPT += (pt.saldo || 0);
                            totalAsetNPC += (pt.saldo || 0);
                            
                            totalKonsumsiPTListrik15m += (pt.konsumsiListrik15m || 8750);
                            totalKonsumsiPTAir15m += (pt.konsumsiAir15m || 375);
                        });
                    }
                    
                    if (totalAsetNPC >= 7000000000) totalInvestor++;
                }
            }

            let bebanListrikHarian = global.db.data.negara.bebanListrikHarian || 0;
            let bebanAirHarian = global.db.data.negara.bebanAirHarian || 0;

            let txt = `🌐 *GLOBAL STATISTIK NPC*\n\n`
                + `👥 *Demografi Populasi*\n`
                + `• Total NPC: ${total} Warga\n`
                + `• Kasta Atas: ${kaya} Warga\n`
                + `• Kasta Menengah: ${menengah} Warga\n`
                + `• Kasta Bawah: ${miskin} Warga\n`
                + `• 🏡 Total Rumah: ${punyaRumah} Unit\n`
                + `• Investor Paus (>7M): ${totalInvestor} NPC\n\n`
                + `💰 *Sirkulasi Finansial*\n`
                + `• Tunai di Tangan: ${formatSingkat(totalUangBeredar)}\n`
                + `• Simpanan di Bank: ${formatSingkat(totalUangDiBank)}\n`
                + `• Total Aset Emas: ${totalEmas.toLocaleString('id-ID')} Batang\n`
                + `• Total Aset Diamond: ${totalDiamond.toLocaleString('id-ID')} Butir\n\n`
                + `🏭 *Sektor BUMN & Swasta*\n`
                + `• Total Perusahaan Swasta: ${totalPerusahaan} PT\n`
                + `• Total Kas Perusahaan: ${formatSingkat(totalKasPT)}\n`
                + `• ⚡ Total Beban Listrik (Hari Ini): ${(bebanListrikHarian / 1000).toLocaleString('id-ID', {maximumFractionDigits: 1})} kWh\n`
                + `• 💧 Total Beban PDAM (Hari Ini): ${bebanAirHarian.toLocaleString('id-ID')} L\n\n`
                + `⏱️ *Konsumsi Rumah / 15 Menit*\n`
                + `• ⚡ Total Listrik: ${(totalKonsumsiListrik15m / 1000).toLocaleString('id-ID', {maximumFractionDigits: 2})} kWh\n`
                + `• 💧 Total Air: ${totalKonsumsiAir15m.toLocaleString('id-ID')} L\n\n`
                + `🏢 *Konsumsi Perusahaan / 15 Menit*\n`
                + `• ⚡ Total Listrik: ${(totalKonsumsiPTListrik15m / 1000).toLocaleString('id-ID', {maximumFractionDigits: 2})} kWh\n`
                + `• 💧 Total Air: ${totalKonsumsiPTAir15m.toLocaleString('id-ID')} L\n\n`
                + `🏠 *Sumber Listrik Rumah NPC*\n`
                + `• ⚡ PLN (Negara): ${listrikRumahPLN} Rumah\n`
                + (() => {
                    let lines = '';
                    let swastaEntries = Object.entries(listrikRumahSwasta).sort((a, b) => b[1] - a[1]);
                    if (swastaEntries.length === 0) {
                        lines += `• 🏭 Swasta: Tidak ada`;
                    } else {
                        swastaEntries.forEach(([provId, jml]) => {
                            let namaTampil = providerNames[provId] || providerNames[parseInt(provId)] || String(provId);
                            lines += `• 🏭 ${namaTampil}: ${jml} Rumah\n`;
                        });
                        lines = lines.trimEnd();
                    }
                    return lines;
                })();
            return m.reply(txt);
        }

        if (action === 'leaderboardnpc') {
            let pctEmas = getMarketStatus(1);
            let Semas = Math.floor(1296000 + (1296000 * pctEmas));
            
            let pctDiamond = getMarketStatus(2);
            let Sdiamond = Math.floor(4081000 + (4081000 * pctDiamond));

            let npcList = [];
            for (let uid in global.db.data.users) {
                let u = global.db.data.users[uid];
                if (u && (u.isNPC || uid.startsWith('npc_'))) {
                    let asetInvestasi = ((u.emas || 0) * Semas) + ((u.diamond || 0) * Sdiamond);
                    let totalKekayaan = (u.money || 0) + (u.bank || 0) + asetInvestasi;
                    
                    if (u.perusahaan && u.perusahaan.length > 0) {
                        u.perusahaan.forEach(pt => totalKekayaan += (pt.saldo || 0));
                    }
                    
                    npcList.push({
                        name: u.name,
                        kasta: u.kasta,
                        job: u.job,
                        wealth: totalKekayaan,
                        emas: u.emas || 0,
                        diamond: u.diamond || 0
                    });
                }
            }

            if (npcList.length === 0) return m.reply('❌ Belum ada NPC di server.');

            npcList.sort((a, b) => b.wealth - a.wealth);
            let topNpc = npcList.slice(0, 10);

            let txt = `🏆 *LEADERBOARD KONGLOMERAT NPC (TOP 10)* 🏆\n_Total aset: Tunai + Bank + Saham + Kas PT_\n\n`;
            topNpc.forEach((npc, i) => {
                let investStatus = (npc.emas > 0 || npc.diamond > 0) ? `\n   💎 Aset: ${npc.emas} Emas | ${npc.diamond} Diamond` : "";
                txt += `${i + 1}. *${npc.name}*\n`
                    + `   💼 Profesi: ${npc.job}\n`
                    + `   🏅 Kasta: ${npc.kasta}\n`
                    + `   💰 Total Kekayaan: ${formatRp(npc.wealth)}${investStatus}\n\n`;
            });
            
            return m.reply(txt.trim());
        }

    } catch (e) {
        console.error('ERROR COMMAND NPC USER:', e);
    }
};

handler.before = async function (m, { conn }) {
    try {
        if (!global.db || !global.db.data || !global.db.data.users) return;
        if (!global.db.data.negara) global.db.data.negara = { kas: 100000000000, bank: false };
        if (!global.db.data.negara.pdam) global.db.data.negara.pdam = { saldo: 0, investasi: {}, totalInvestasi: 0 };
        
        let negara = global.db.data.negara;
        
        let dWIB = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
        let currentDateString = dWIB.toDateString();

        if (negara.lastResetBeban !== currentDateString) {
            negara.bebanListrikHarian = 0;
            negara.bebanAirHarian = 0;
            negara.lastResetBeban = currentDateString;
        }

        if (!global.rpgJobs || !global.rpgBiayaInduk) return;
        
        let now = Date.now();
        if (!global.db.data.lastNpcTick) global.db.data.lastNpcTick = now;
        if (!global.db.data.lastNpcHourlyTick) global.db.data.lastNpcHourlyTick = now;

        let npcs = Object.keys(global.db.data.users).filter(uid => {
            let u = global.db.data.users[uid];
            return u && (u.isNPC || uid.startsWith('npc_'));
        });

        if (npcs.length === 0) return; 

        let listrikProviders = {};
        for (let uid in global.db.data.users) {
            let u = global.db.data.users[uid];
            if (u && Array.isArray(u.perusahaan)) {
                u.perusahaan.forEach(pt => {
                    if (pt && pt.type === 'listrik') {
                        listrikProviders[pt.id] = pt;
                    }
                });
            }
        }
        const getSwastaListrikFast = (minDaya = 0) => {
            return Object.keys(listrikProviders).filter(id => (listrikProviders[id].kapasitasTersedia || 0) >= minDaya);
        };

        const jobsKeys = Object.keys(global.rpgJobs);
        const kelasMenengah = jobsKeys.filter(j => global.rpgJobs[j].level > 20 && global.rpgJobs[j].level <= 40);
        const kelasAtas = jobsKeys.filter(j => global.rpgJobs[j].level > 40);

        if (now - global.db.data.lastNpcTick >= 900000) {
            
            for (let uid of npcs) {
                let npc = global.db.data.users[uid];
                if (!npc) continue;

                if (npc.perusahaan && npc.perusahaan.length > 0) {
                    npc.perusahaan.forEach(pt => {
                        if (!pt.konsumsiListrik15m) pt.konsumsiListrik15m = Math.floor(Math.random() * (12500 - 5000 + 1)) + 5000;
                        if (!pt.konsumsiAir15m) pt.konsumsiAir15m = Math.floor(Math.random() * (500 - 250 + 1)) + 250;
                        
                        let driftListrikPT = Math.floor(pt.konsumsiListrik15m * (Math.random() * 0.2 - 0.1));
                        pt.konsumsiListrik15m = Math.min(12500, Math.max(5000, pt.konsumsiListrik15m + driftListrikPT));
                        
                        let driftAirPT = Math.floor(pt.konsumsiAir15m * (Math.random() * 0.2 - 0.1));
                        pt.konsumsiAir15m = Math.min(500, Math.max(250, pt.konsumsiAir15m + driftAirPT));
                    });
                }

                if (npc.punyaRumah && (npc.bank || 0) === 0 && (npc.money || 0) > 1000000) {
                    let migrasi = Math.floor((npc.money || 0) * 0.7);
                    npc.money -= migrasi;
                    npc.bank = (npc.bank || 0) + migrasi;
                }
                
                let jobData = global.rpgJobs[npc.job];
                if (jobData) {
                    let gajiKotor = Math.floor(Math.random() * (jobData.maxPay - jobData.minPay + 1)) + jobData.minPay;
                    let potonganPajak = Math.floor(gajiKotor * 0.04);
                    let gajiBersih = gajiKotor - potonganPajak;

                    npc.money = (npc.money || 0) + gajiBersih;
                    npc.exp = (npc.exp || 0) + jobData.exp;
                    negara.kas += potonganPajak;
                }

                {
                    let moneyNow = npc.money || 0;
                    let hargaRumahBuffer = npc.punyaRumah ? 0 : (npc.hargaRumah || 0);
                    let bufferOperasional = 500000; 
                    let batasTabung = hargaRumahBuffer + bufferOperasional;

                    if (moneyNow > batasTabung) {
                        let sisaLebih = moneyNow - batasTabung;
                        let setoran = Math.floor(sisaLebih * 0.6);
                        if (setoran > 0) {
                            npc.money -= setoran;
                            npc.bank = (npc.bank || 0) + setoran;
                        }
                    }
                }

                let saldoBank = npc.bank || 0;
                let totalWealthKasta = (npc.money || 0) + saldoBank + ((npc.emas || 0) * (global.db.data.negara?.hargaEmas || 50000)) + ((npc.diamond || 0) * (global.db.data.negara?.hargaDiamond || 1000000));
                if (totalWealthKasta >= 976000000000 && npc.kasta !== 'Atas') {
                    npc.kasta = 'Atas';
                    npc.job = kelasAtas.length > 0 ? kelasAtas[Math.floor(Math.random() * kelasAtas.length)] : npc.job;
                } else if (totalWealthKasta >= 800000000 && npc.kasta === 'Bawah') {
                    npc.kasta = 'Menengah';
                    npc.job = kelasMenengah.length > 0 ? kelasMenengah[Math.floor(Math.random() * kelasMenengah.length)] : npc.job;
                }

                let expNeeded = (npc.level || 1) * 10000;
                if (npc.exp >= expNeeded) {
                    npc.level++;
                    npc.exp -= expNeeded;
                }

                if (!npc.punyaRumah && npc.money >= npc.hargaRumah) {
                    npc.money -= npc.hargaRumah;
                    npc.punyaRumah = true;
                    npc.sumberListrikRumah = 'negara'; 
                    npc.lastPajakRumah = now;
                    npc.konsumsiListrikRumah = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
                    npc.konsumsiAirRumah = Math.floor(Math.random() * (6 - 2 + 1)) + 2;
                    negara.kas += Math.floor(npc.hargaRumah * 0.05); 
                }

                if (npc.punyaRumah) {
                    if (!npc.konsumsiListrikRumah || npc.konsumsiListrikRumah > 3000) npc.konsumsiListrikRumah = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
                    if (!npc.konsumsiAirRumah || npc.konsumsiAirRumah > 6) npc.konsumsiAirRumah = Math.floor(Math.random() * (6 - 2 + 1)) + 2;

                    let driftListrik = Math.floor(npc.konsumsiListrikRumah * (Math.random() * 0.2 - 0.1));
                    npc.konsumsiListrikRumah = Math.min(3000, Math.max(1000, npc.konsumsiListrikRumah + driftListrik));

                    let driftAir = Math.floor(npc.konsumsiAirRumah * (Math.random() * 0.2 - 0.1));
                    npc.konsumsiAirRumah = Math.min(6, Math.max(2, npc.konsumsiAirRumah + driftAir));

                    let pemakaianListrik = npc.konsumsiListrikRumah;
                    let pemakaianAir = npc.konsumsiAirRumah;

                    negara.bebanListrikHarian = (negara.bebanListrikHarian || 0) + pemakaianListrik;
                    negara.bebanAirHarian = (negara.bebanAirHarian || 0) + pemakaianAir;

                    if (!npc.sumberListrikRumah) npc.sumberListrikRumah = 'negara';

                    let plnKapasitas = negara.pln ? (negara.pln.kapasitasTersedia || 0) : 0;
                    let daftarSwastaMampu = getSwastaListrikFast(pemakaianListrik);

                    if (npc.sumberListrikRumah === 'negara') {
                        if (plnKapasitas < pemakaianListrik && daftarSwastaMampu.length > 0) {
                            if (Math.random() < 0.30) {
                                npc.sumberListrikRumah = daftarSwastaMampu[Math.floor(Math.random() * daftarSwastaMampu.length)];
                            }
                        }
                    } else {
                        let prov = listrikProviders[npc.sumberListrikRumah];
                        if (!prov || (prov.kapasitasTersedia || 0) < pemakaianListrik) {
                            if (Math.random() < 0.30) {
                                if (daftarSwastaMampu.length > 0) {
                                    npc.sumberListrikRumah = daftarSwastaMampu[Math.floor(Math.random() * daftarSwastaMampu.length)];
                                } else if (plnKapasitas >= pemakaianListrik) {
                                    npc.sumberListrikRumah = 'negara';
                                }
                            }
                        } else if (plnKapasitas >= pemakaianListrik && Math.random() < 0.1) {
                            let hargaSwasta = prov.hargaListrikCustom || 18600;
                            let hargaPLN = negara.pln ? (negara.pln.hargaPerWatt || 14400) : 14400;
                            if (hargaPLN < hargaSwasta) {
                                npc.sumberListrikRumah = 'negara';
                            }
                        }
                    }

                    if (npc.sumberListrikRumah === 'negara') {
                        if (negara.pln) {
                            let diambil = Math.min(pemakaianListrik, negara.pln.kapasitasTersedia || 0);
                            negara.pln.dayaTerpakai = (negara.pln.dayaTerpakai || 0) + pemakaianListrik; 
                            negara.pln.kapasitasTersedia = Math.max(0, (negara.pln.kapasitasTersedia || 0) - diambil);
                        }
                    } else {
                        let prov = listrikProviders[npc.sumberListrikRumah];
                        if (prov) {
                            let diambil = Math.min(pemakaianListrik, prov.kapasitasTersedia || 0);
                            prov.dayaTerpakai = (prov.dayaTerpakai || 0) + pemakaianListrik; 
                            prov.kapasitasTersedia = Math.max(0, (prov.kapasitasTersedia || 0) - diambil);
                        }
                    }

                    if (negara.pdam) {
                        let airDiambil = Math.min(pemakaianAir, negara.pdam.kapasitasTersedia || 0);
                        negara.pdam.airTerpakai = (negara.pdam.airTerpakai || 0) + pemakaianAir; 
                        negara.pdam.kapasitasTersedia = Math.max(0, (negara.pdam.kapasitasTersedia || 0) - airDiambil);
                    }

                    npc.akumulasiListrikRumah = (npc.akumulasiListrikRumah || 0) + pemakaianListrik;
                    npc.akumulasiAirRumah = (npc.akumulasiAirRumah || 0) + pemakaianAir;

                    let dayPassed = Math.floor((now - npc.lastPajakRumah) / (24 * 60 * 60 * 1000));
                    if (dayPassed >= 1) {
                        let pajakRumah = Math.floor(npc.hargaRumah * 0.07 * dayPassed);

                        if (npc.money >= pajakRumah) {
                            npc.money -= pajakRumah;
                            negara.kas += pajakRumah;
                        } else if ((npc.money + (npc.bank || 0)) >= pajakRumah) {
                            let kekurangan = pajakRumah - npc.money;
                            npc.money = 0; 
                            npc.bank -= kekurangan; 
                            negara.kas += pajakRumah;
                        } else {
                            negara.kas += npc.money + (npc.bank || 0); 
                            npc.money = 0;
                            npc.bank = 0;
                            npc.punyaRumah = false; 
                            npc.sumberListrikRumah = 'negara';
                            npc.hargaRumah = Math.floor(Math.random() * (657000000 - 355000000 + 1)) + 355000000;
                        }
                        npc.lastPajakRumah += (dayPassed * 24 * 60 * 60 * 1000);
                    }
                }
            }
            global.db.data.lastNpcTick = now;
        }

        if (now - global.db.data.lastNpcHourlyTick >= 3600000) { 
            const HARGA_LISTRIK_NEGARA_DEFAULT = 14400; 
            const HARGA_AIR_NEGARA_DEFAULT = 16000;

            let pctEmas = getMarketStatus(1);
            let Bemas = Math.floor(1545000 + (1545000 * pctEmas));
            let Semas = Math.floor(1296000 + (1296000 * pctEmas));
            
            let pctDiamond = getMarketStatus(2);
            let Bdiamond = Math.floor(5810000 + (5810000 * pctDiamond));
            let Sdiamond = Math.floor(4081000 + (4081000 * pctDiamond));

            let tarifListrikPT = 1500000;
            let tarifPDAMPT = 800000;

            for (let uid of npcs) {
                let npc = global.db.data.users[uid];
                if (!npc) continue;
                
                if (npc.punyaRumah) {
                    let akuListrik = npc.akumulasiListrikRumah || 0;
                    let akuAir = npc.akumulasiAirRumah || 0;

                    let hargaPerW, hargaPerL;
                    if (!npc.sumberListrikRumah || npc.sumberListrikRumah === 'negara') {
                        hargaPerW = negara.pln ? (negara.pln.hargaPerWatt || HARGA_LISTRIK_NEGARA_DEFAULT) : HARGA_LISTRIK_NEGARA_DEFAULT;
                    } else {
                        let prov = listrikProviders[npc.sumberListrikRumah];
                        hargaPerW = prov ? (prov.hargaListrikCustom || HARGA_LISTRIK_NEGARA_DEFAULT) : HARGA_LISTRIK_NEGARA_DEFAULT;
                    }
                    hargaPerL = negara.pdam ? (negara.pdam.hargaPerLiter || HARGA_AIR_NEGARA_DEFAULT) : HARGA_AIR_NEGARA_DEFAULT;

                    let tarifListrikRumah = Math.floor(akuListrik * hargaPerW);
                    let tarifPDAMRumah = Math.floor(akuAir * hargaPerL);
                    let totalTagihanRumah = tarifListrikRumah + tarifPDAMRumah;

                    npc.akumulasiListrikRumah = 0;
                    npc.akumulasiAirRumah = 0;

                    if (totalTagihanRumah > 0) {
                        let bayarSukses = false;
                        if (npc.money >= totalTagihanRumah) {
                            npc.money -= totalTagihanRumah;
                            bayarSukses = true;
                        } else if ((npc.money + (npc.bank || 0)) >= totalTagihanRumah) {
                            let sisa = totalTagihanRumah - npc.money;
                            npc.money = 0;
                            npc.bank -= sisa;
                            bayarSukses = true;
                        }

                        if (bayarSukses) {
                            negara.pdam.saldo += tarifPDAMRumah;

                            if (!npc.sumberListrikRumah || npc.sumberListrikRumah === 'negara') {
                                negara.kas += tarifListrikRumah;
                            } else {
                                let prov = listrikProviders[npc.sumberListrikRumah];
                                if (prov) prov.saldo += tarifListrikRumah;
                                else negara.kas += tarifListrikRumah;
                            }
                        }
                    }
                }

                let npcTotalWealth = (npc.money || 0) + (npc.bank || 0) + ((npc.emas || 0) * Semas) + ((npc.diamond || 0) * Sdiamond);
                if (npc.perusahaan && npc.perusahaan.length > 0) {
                    npc.perusahaan.forEach(pt => npcTotalWealth += (pt.saldo || 0));
                }

                const MAX_ITEM_PER_TX = 10000;
                if (npcTotalWealth >= 7000000000) {
                    if (!npc.isPaus) npc.isPaus = true;
                    let bankNow = npc.bank || 0;

                    if (pctEmas < 0 && bankNow > 0) {
                        let budget = Math.floor(bankNow * 0.10);
                        let qty = Math.min(Math.floor(budget / Bemas), MAX_ITEM_PER_TX);
                        if (qty > 0) {
                            npc.bank -= qty * Bemas;
                            npc.emas = (npc.emas || 0) + qty;
                        }
                    } else if (pctEmas > 0 && (npc.emas || 0) > 0) {
                        let qtyJual = Math.min(npc.emas, MAX_ITEM_PER_TX);
                        let grossIncome = qtyJual * Semas;
                        let tax = Math.floor(grossIncome * 0.05);
                        negara.kas += tax;
                        npc.bank = (npc.bank || 0) + (grossIncome - tax);
                        npc.emas -= qtyJual;
                    }

                    bankNow = npc.bank || 0;
                    if (pctDiamond < 0 && bankNow > 0) {
                        let budget = Math.floor(bankNow * 0.10);
                        let qty = Math.min(Math.floor(budget / Bdiamond), MAX_ITEM_PER_TX);
                        if (qty > 0) {
                            npc.bank -= qty * Bdiamond;
                            npc.diamond = (npc.diamond || 0) + qty;
                        }
                    } else if (pctDiamond > 0 && (npc.diamond || 0) > 0) {
                        let qtyJual = Math.min(npc.diamond, MAX_ITEM_PER_TX);
                        let grossIncome = qtyJual * Sdiamond;
                        let tax = Math.floor(grossIncome * 0.05);
                        negara.kas += tax;
                        npc.bank = (npc.bank || 0) + (grossIncome - tax);
                        npc.diamond -= qtyJual;
                    }
                } else if (npc.isPaus) {
                    npc.isPaus = false;
                }

                if (npcTotalWealth > 150000000000 && (!npc.perusahaan || npc.perusahaan.length === 0)) {
                    if (!npc.perusahaan) npc.perusahaan = [];
                    
                    let hargaModalPT = 75000000000; 
                    
                    if ((npc.bank || 0) >= hargaModalPT) {
                        npc.bank -= hargaModalPT; 
                        
                        let tipePT = ['tambang', 'daurulang', 'minuman', 'senjata']; 
                        let tipeTerpilih = tipePT[Math.floor(Math.random() * tipePT.length)];
                        let namaAcak = namaPerusahaan[Math.floor(Math.random() * namaPerusahaan.length)];
                        
                        let newPT = {
                            id: Date.now() + Math.floor(Math.random() * 1000), 
                            name: namaAcak, 
                            type: tipeTerpilih, 
                            saldo: 10000000000, 
                            hutang: 0, 
                            lastTax: now,
                            pabrik: [], 
                            gudang: {}, 
                            investors: {}, 
                            investOpen: false, 
                            isProduksi: false, 
                            karyawan: Math.floor(Math.random() * 1000) + 100, 
                            lastSalary: now,
                            gudangLevel: 1, 
                            sumberListrik: 'negara'
                        };

                        npc.perusahaan.push(newPT);
                    }
                }

                if ((npc.money || 0) > 10000000 && global.rpgSemuaProduk) {
                    let keys = Object.keys(global.rpgSemuaProduk);
                    let randomKey = keys[Math.floor(Math.random() * keys.length)];
                    let targetDb = global.rpgSemuaProduk[randomKey].db;
                    
                    let qtyBeli = Math.floor(Math.random() * 200) + 50; 
                    let basePrice = global.rpgBaseHargaPasar[targetDb] || 1000;
                    
                    let totalBelanja = basePrice * qtyBeli;
                    if (npc.money >= totalBelanja) {
                        npc.money -= totalBelanja;
                        negara.kas += Math.floor(totalBelanja * 0.1); 
                    }
                }

                if (!npc.perusahaan) continue;
                
                for (let pt of npc.perusahaan) {
                    if (!pt) continue;

                    let konsumsiListrikPT = (pt.konsumsiListrik15m || 8750) * 4; 
                    let konsumsiAirPT = (pt.konsumsiAir15m || 375) * 4; 
                    
                    negara.bebanListrikHarian = (negara.bebanListrikHarian || 0) + konsumsiListrikPT;
                    negara.bebanAirHarian = (negara.bebanAirHarian || 0) + konsumsiAirPT;

                    let plnAdaDaya = negara.pln && (negara.pln.kapasitasTersedia || 0) >= konsumsiListrikPT;
                    
                    if (pt.sumberListrik === 'negara' && !plnAdaDaya) {
                        let swastaList = getSwastaListrikFast(konsumsiListrikPT);
                        if (swastaList.length > 0 && Math.random() < 0.30) { 
                            pt.sumberListrik = swastaList[Math.floor(Math.random() * swastaList.length)];
                        }
                    } else if (pt.sumberListrik !== 'negara') {
                        let prov = listrikProviders[pt.sumberListrik];
                        if (!prov || (prov.kapasitasTersedia || 0) < konsumsiListrikPT) {
                            if (Math.random() < 0.30) { 
                                let swastaList = getSwastaListrikFast(konsumsiListrikPT);
                                if (swastaList.length > 0) pt.sumberListrik = swastaList[Math.floor(Math.random() * swastaList.length)];
                                else if (plnAdaDaya) pt.sumberListrik = 'negara';
                                else pt.sumberListrik = 'negara';
                            }
                        }
                    }

                    let totalTagihanPT = tarifListrikPT + tarifPDAMPT;
                    if (pt.saldo >= totalTagihanPT) {
                        pt.saldo -= totalTagihanPT;
                        
                        if (negara.pdam && (negara.pdam.kapasitasTersedia || 0) >= konsumsiAirPT) {
                            negara.pdam.saldo += tarifPDAMPT;
                            negara.pdam.airTerpakai = (negara.pdam.airTerpakai || 0) + konsumsiAirPT;
                            negara.pdam.kapasitasTersedia -= konsumsiAirPT;
                        }
                        
                        if (pt.sumberListrik === 'negara') {
                            negara.kas += tarifListrikPT;
                            if (negara.pln && (negara.pln.kapasitasTersedia || 0) >= konsumsiListrikPT) {
                                negara.pln.dayaTerpakai = (negara.pln.dayaTerpakai || 0) + konsumsiListrikPT;
                                negara.pln.kapasitasTersedia -= konsumsiListrikPT;
                            }
                        } else {
                            let prov = listrikProviders[pt.sumberListrik];
                            if (prov) {
                                prov.saldo += tarifListrikPT;
                                prov.dayaTerpakai = (prov.dayaTerpakai || 0) + konsumsiListrikPT;
                                prov.kapasitasTersedia -= konsumsiListrikPT;
                            } else {
                                negara.kas += tarifListrikPT;
                            }
                        }
                    }
                    
                    if (pt.type !== 'listrik' && global.rpgSemuaProduk && global.rpgBaseHargaPasar) {
                        let produkTersedia = Object.keys(global.rpgSemuaProduk).filter(k => global.rpgSemuaProduk[k].type === pt.type);
                        
                        if (produkTersedia.length > 0) {
                            let idProduk = produkTersedia[Math.floor(Math.random() * produkTersedia.length)];
                            let produk = global.rpgSemuaProduk[idProduk];
                            
                            let qty = Math.floor(Math.random() * 5000) + 1000; 
                            let modalProduksi = produk.prodCost * qty;
                            
                            if (pt.saldo >= modalProduksi) {
                                pt.saldo -= modalProduksi; 
                                
                                let basePrice = global.rpgBaseHargaPasar[produk.db] || (produk.prodCost * 2);
                                let currentStock = (global.db.data.market && global.db.data.market[produk.db]) ? global.db.data.market[produk.db].stock : 100000;
                                let ratio = 100000 / Math.max(1, currentStock);
                                
                                if (ratio > 3.0) ratio = 3.0; 
                                if (ratio < 0.2) ratio = 0.2;
                                
                                let hargaJualGlobal = Math.max(1, Math.floor(basePrice * ratio * 0.75)); 
                                let pendapatan = hargaJualGlobal * qty;
                                
                                let pajakPPN = Math.floor(pendapatan * 0.05); 
                                let logistik = Math.floor(pendapatan * 0.05);
                                let profitBersih = pendapatan - pajakPPN - logistik;
                                
                                negara.kas += pajakPPN;
                                pt.saldo += profitBersih; 
                            }
                        }
                    }
                }
            }
            global.db.data.lastNpcHourlyTick = now;
        }
    } catch (e) {
    }
    return;
};

handler.help = ['infonpc', 'globalnpc', 'leaderboardnpc'];
handler.tags = ['rpg'];
handler.command = /^(infonpc|globalnpc|leaderboardnpc)$/i;

handler.owner = false;
handler.mods = false;
handler.premium = false;
handler.group = false;
handler.private = false;
handler.admin = false;
handler.botAdmin = false;
handler.rpg = true;

module.exports = handler;
