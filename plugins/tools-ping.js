const os = require('os');
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');
const { generateSystemImage } = require('../lib/systemMonitor');

// --- Helper Functions ---
const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const clockString = (ms) => {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor(ms / 3600000) % 24;
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
};

let handler = async (m, { conn }) => {
    try {
        await m.reply('⏳ _Mengambil data server dan menggambar sistem..._');
        
        // ==================== GATHERING SYSTEM DATA ====================
        const botId = conn.user?.name || conn.user?.jid?.split('@')[0] || 'Harps BotMD';
        
        const oldPing = performance.now();
        const cpuStart = os.cpus();
        await new Promise(res => setTimeout(res, 100)); // Delay buat ngitung CPU Load
        const cpuEnd = os.cpus();
        const newPing = performance.now();
        const speedPing = (newPing - oldPing).toFixed(2);

        // Kalkulasi CPU
        let idleStart = 0, totalStart = 0, idleEnd = 0, totalEnd = 0;
        cpuStart.forEach(c => { for (let type in c.times) totalStart += c.times[type]; idleStart += c.times.idle; });
        cpuEnd.forEach(c => { for (let type in c.times) totalEnd += c.times[type]; idleEnd += c.times.idle; });
        const cpuUsedPct = Math.round(100 - (~-(idleEnd - idleStart) / ~-(totalEnd - totalStart) * 100));
        
        const cpuModelRaw = os.cpus()[0].model.replace(/\(R\)|\(TM\)/g, '').trim();
        const cpuModel = cpuModelRaw.length > 25 ? cpuModelRaw.substring(0, 22) + '...' : cpuModelRaw;
        const cpuCores = os.cpus().length;
        const cpuSpeed = os.cpus()[0].speed;

        // Kalkulasi RAM
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const usedRam = totalRam - freeRam;
        const ramPct = Math.round((usedRam / totalRam) * 100);
        const usedMem = process.memoryUsage();
        const totalH = usedMem.heapTotal;

        // Kalkulasi Uptime & Waktu
        const osUptime = clockString(os.uptime() * 1000);
        const botUptime = clockString(process.uptime() * 1000);
        const date = new Date();
        const timeStr = `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}.${date.getSeconds().toString().padStart(2, '0')} WIB`;

        // Kalkulasi Disk
        let diskTotal = '0 GB', diskUsedStr = '0 GB', diskFree = '0 GB', diskPct = 0;
        try {
            let df = execSync("df -h / | awk 'NR==2 {print $2,$3,$4,$5}'").toString().trim().split(/\s+/);
            diskTotal = df[0]; diskUsedStr = df[1]; diskFree = df[2]; diskPct = parseInt(df[3].replace('%', '')) || 0;
        } catch (e) {
            diskTotal = 'Unknown'; diskUsedStr = '?'; diskPct = 0;
        }

        // ==================== CETAK BIRU KOORDINAT (KIRIM KE CANVAS) ====================
        const layoutConfig = {
            texts: [
                // Header & Info
                { text: `${botId}-${os.hostname()} • ${speedPing}ms • Node ${process.version}`, x: 95, y: 105, font: '14px Arial', color: '#8A92A6', align: 'left' },
                { text: os.platform().toUpperCase(), x: 100, y: 445, font: 'bold 16px Arial', color: '#FFFFFF', align: 'left' },
                { text: os.arch(), x: 320, y: 445, font: 'bold 16px Arial', color: '#FFFFFF', align: 'left' },
                { text: botUptime, x: 100, y: 505, font: 'bold 16px Arial', color: '#FFFFFF', align: 'left' },
                { text: osUptime, x: 320, y: 505, font: 'bold 16px Arial', color: '#FFFFFF', align: 'left' },
                { text: `${speedPing}ms`, x: 420, y: 445, font: 'bold 16px Arial', color: '#FFFFFF', align: 'left' },
                
                // Text Box 1: CPU
                { text: `${cpuCores} Cores • ${cpuSpeed} MHz`, x: 50, y: 173, font: '12px Arial', color: '#8A92A6', align: 'left' },
                { text: `${cpuUsedPct}%`, x: 200, y: 264, font: 'bold 24px Arial', color: '#FFFFFF', align: 'center' },
                { text: cpuModel, x: 205, y: 320, font: '12px Arial', color: '#8A92A6', align: 'center' },

                // Text Box 2: RAM
                { text: `Total ${formatBytes(totalRam)}`, x: 395, y: 173, font: '12px Arial', color: '#8A92A6', align: 'left' },
                { text: `${ramPct}%`, x: 540, y: 264, font: 'bold 24px Arial', color: '#FFFFFF', align: 'center' },
                { text: `Used: ${formatBytes(usedRam)}`, x: 475, y: 320, font: '12px Arial', color: '#8A92A6', align: 'center' },
                { text: `Free: ${formatBytes(freeRam)}`, x: 605, y: 320, font: '12px Arial', color: '#8A92A6', align: 'center' },

                // Text Box 3: DISK
                { text: `Total ${diskTotal}`, x: 83, y: 173, font: '12px Arial', color: '#8A92A6', align: 'left' },
                { text: `${diskPct}%`, x: 870: 264, font: 'bold 24px Arial', color: '#FFFFFF', align: 'center' },
                { text: `${diskUsedStr} / ${diskFree}`, x: 840, y: 345, font: '12px Arial', color: '#8A92A6', align: 'center' },

                // Text Detail Memory
                { text: formatBytes(usedMem.rss), x: 620, y: 435, font: 'bold 14px Arial', color: '#FFFFFF', align: 'left' },
                { text: formatBytes(usedMem.heapUsed), x: 620, y: 555, font: 'bold 14px Arial', color: '#FFFFFF', align: 'left' },
                { text: formatBytes(usedMem.external), x: 840, y: 435, font: 'bold 14px Arial', color: '#FFFFFF', align: 'left' },
                { text: formatBytes(totalH), x: 840, y: 495, font: 'bold 14px Arial', color: '#FFFFFF', align: 'left' },

                // Footer
                { text: timeStr, x: 75, y: 965, font: '14px Arial', color: '#FFFFFF', align: 'left' },
                { text: 'Harps BotMD', x: 950, y: 965, font: 'bold 16px Arial', color: '#FFFFFF', align: 'right' }
            ],
            circles: [
                { percentage: cpuUsedPct, x: 200, y: 254, radius: 45, trackColor: '#2A3042', barColor: '#3498DB', lineWidth: 12 },
                { percentage: ramPct, x: 540, y: 254, radius: 45, trackColor: '#2A3042', barColor: '#9B59B6', lineWidth: 12 },
                { percentage: diskPct, x: 870, y: 254, radius: 45, trackColor: '#2A3042', barColor: '#1ABC9C', lineWidth: 12 }
            ],
            miniBars: [
                { percentage: (usedMem.rss / totalRam) * 100, x: 530, y: 445, width: 140, height: 6, trackColor: '#2A3042', barColor: '#3498DB' },
                { percentage: (usedMem.heapUsed / totalH) * 100, x: 530, y: 505, width: 140, height: 6, trackColor: '#2A3042', barColor: '#9B59B6' },
                { percentage: 10, x: 750, y: 445, width: 140, height: 6, trackColor: '#2A3042', barColor: '#2ECC71' },
                { percentage: 100, x: 750, y: 505, width: 140, height: 6, trackColor: '#2A3042', barColor: '#E74C3C' }
            ],
            netLines: [
                { x: 105, y: 840, width: 800, height: 180, offset: 20, color: '#3498DB', lineWidth: 3 },
                { x: 105, y: 840, width: 800, height: 180, offset: 50, color: '#E91E63', lineWidth: 3 }
            ]
        };

        // ==================== EKSEKUSI GAMBAR ====================
        const imageBuffer = await generateSystemImage(layoutConfig);

        if (!imageBuffer) {
            return m.reply('❌ Gagal merender gambar. Cek konsol VPS lu.');
        }

        await conn.sendMessage(m.chat, { 
            image: imageBuffer, 
            caption: '🚀 *SYSTEM MONITOR REPORT* 🚀' 
        }, { quoted: m });

    } catch (e) {
        console.error('[CEKSYSTEM ERROR]', e);
        m.reply(`❌ *Terjadi Kesalahan:*\n${e.message || e}`);
    }
};

handler.help = ['ceksystem', 'ping'];
handler.tags = ['info'];
handler.command = /^(ceksystem|ping|speed)$/i;

module.exports = handler;
