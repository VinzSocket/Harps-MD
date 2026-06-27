const fs = require('fs');
const path = require('path');

let handler = async (m, { conn, usedPrefix }) => {
    await m.reply('⏳ _Scanning sistem root dan memori plugin..._');

    let pluginDir = path.join(__dirname, '../plugins'); // Sesuaikan jika folder lu namanya beda
    let files = fs.readdirSync(pluginDir).filter(v => v.endsWith('.js'));

    let brokenPlugins = [];
    let allCommands = [];
    let commandConflicts = [];

    for (let file of files) {
        let fullPath = path.join(pluginDir, file);
        try {
            // Bersihkan memori cache node.js untuk file ini agar scan hasil terbaru
            delete require.cache[require.resolve(fullPath)];
            let plugin = require(fullPath);

            // ==========================================
            // TIER 8: BROKEN PLUGIN SCANNER
            // ==========================================
            if (!plugin || typeof plugin !== 'function') {
                brokenPlugins.push({ file, reason: 'Struktur modul salah (Gagal menemukan module.exports = handler)' });
                continue;
            }

            // ==========================================
            // TIER 7: COMMAND CONFLICT DETECTOR
            // ==========================================
            if (plugin.command) {
                // Standarisasi command ke bentuk Array String
                let cmds = Array.isArray(plugin.command) ? plugin.command :
                           (plugin.command instanceof RegExp ? [plugin.command.toString()] : [plugin.command]);

                cmds.forEach(cmd => {
                    let cmdString = cmd.toString();
                    
                    // Cari apakah Regex/String command ini udah pernah didaftarkan sama file lain
                    let existing = allCommands.find(c => c.cmd === cmdString);
                    if (existing) {
                        commandConflicts.push(`Tabrakan: *${cmdString}*\n📍 ${existing.file}  ⚔️  ${file}`);
                    } else {
                        allCommands.push({ cmd: cmdString, file });
                    }
                });
            }
        } catch (e) {
            // Tangkap Syntax Error / Import Module yang gagal
            brokenPlugins.push({ file, reason: e.message.split('\n')[0] });
        }
    }

    // ==========================================
    // FORMATTING LAPORAN ANALITIK
    // ==========================================
    let report = `📊 *HARPS PLUGIN DIAGNOSTIC*\n\n`;
    report += `📂 Total File: *${files.length}*\n`;
    report += `✅ Sehat: *${files.length - brokenPlugins.length}*\n\n`;

    if (brokenPlugins.length > 0) {
        report += `🚨 *PLUGIN RUSAK (${brokenPlugins.length}):*\n`;
        brokenPlugins.forEach(p => {
            report += `❌ *${p.file}*\n   _Detail: ${p.reason}_\n\n`;
        });
    } else {
        report += `🚨 *PLUGIN RUSAK:* Aman (0)\n\n`;
    }

    if (commandConflicts.length > 0) {
        report += `⚠️ *COMMAND BENTROK (${commandConflicts.length}):*\n`;
        commandConflicts.forEach(c => {
            report += `${c}\n\n`;
        });
    } else {
        report += `⚠️ *COMMAND BENTROK:* Aman (0)\n`;
    }

    m.reply(report.trim());
};

handler.help = ['scanplugin'];
handler.tags = ['owner'];
handler.command = /^(scanplugin|checkplugin|cekplugin)$/i;
handler.owner = true; // Mutlak khusus owner

module.exports = handler;
