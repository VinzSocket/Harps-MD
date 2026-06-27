const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const util = require('util');
const execPromise = util.promisify(exec);
const { generateWAMessageFromContent, prepareWAMessageMedia, buildInteractiveAdditionalNodes } = require('@vinzsocket/baileys');

const GITHUB_OWNER = 'VinzSocket';
const DB_REPO = 'DATABASE';
const BOT_REPO = 'Harps-MD';
const GITHUB_BRANCH = 'main';
const DB_FILE = './database.json';

const DB_BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${DB_REPO}/contents`;
const BOT_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${BOT_REPO}`;

setInterval(async () => {
    console.log('🔄 [DB-Backup] Auto-upload database...');
    const GITHUB_TOKEN = global.githubKey || ''; 
    
    if (!GITHUB_TOKEN) return console.log('❌ [DB-Backup] Gagal: Token GitHub tidak ditemukan di config.js');
    if (!fs.existsSync(DB_FILE)) return console.log('❌ [DB-Backup] Gagal: File database.json tidak ditemukan');
    
    try {
        const b64 = fs.readFileSync(DB_FILE).toString('base64');
        const repoPath = path.basename(DB_FILE);
        let sha = null;
        
        const resSha = await fetch(`${DB_BASE_URL}/${repoPath}?ref=${GITHUB_BRANCH}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
        });
        if (resSha.ok) sha = (await resSha.json()).sha;

        const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const resUpload = await fetch(`${DB_BASE_URL}/${repoPath}`, {
            method: 'PUT',
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `🔄 Auto-Backup: ${repoPath} [${waktu}]`,
                content: b64, branch: GITHUB_BRANCH, ...(sha ? { sha } : {})
            })
        });

        if (resUpload.ok) console.log('✅ [DB-Backup] Berhasil diupload ke GitHub!');
        else console.log(`❌ [DB-Backup] Gagal: ${(await resUpload.json()).message}`);
    } catch (e) {
        console.log(`❌ [DB-Backup] Error: ${e.message}`);
    }
}, 60 * 60 * 1000);

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const GITHUB_TOKEN = global.githubKey || '';
    let msgKey;

    const editProgress = async (newText) => {
        if (msgKey) await conn.sendMessage(m.chat, { text: newText, edit: msgKey }).catch(() => null);
    };

    if (command.toLowerCase() === 'cekupdate' || (args[0] && args[0].toLowerCase() === 'cek')) {
        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 📊 𝗦𝗧𝗔𝗧𝗨𝗦 𝗦𝗬𝗦𝗧𝗘𝗠 ] ──\n│ ⏳ Memeriksa NPM & GitHub...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;

        let textGithub = '';
        let textNpm = '';
        const pkgPath = path.join(process.cwd(), 'package.json'); 

        try {
            const packageJsonLokal = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            let baileysName = Object.keys(packageJsonLokal.dependencies).find(pkg => pkg.includes('baileys'));
            
            if (!baileysName) {
                textNpm = '│ Npm : Tidak Ditemukan\n│ Belum Ada Pembaruan Jika Ada Error Hubungin Owner.';
            } else {
                let censoredName = baileysName;
                if (baileysName.startsWith('@') && baileysName.includes('/')) {
                    let parts = baileysName.split('/');
                    let scope = parts[0];
                    let pkg = parts[1];
                    let censorScope = scope.substring(0, 4) + 'x'.repeat(scope.length > 4 ? scope.length - 4 : 5);
                    let censorPkg = 'x'.repeat(pkg.length || 7);
                    censoredName = `${censorScope}/${censorPkg}`;
                }

                let currentVersion = packageJsonLokal.dependencies[baileysName].replace(/[\^~]/g, '');
                const { stdout: npmOut } = await execPromise(`npm view ${baileysName} version`);
                let latestVersion = npmOut.trim();

                let npmStatus = currentVersion === latestVersion 
                    ? 'Belum Ada Pembaruan Jika Ada Error Hubungin Owner.' 
                    : `Ada Pembaruan Terhadap Baileys, Sebaiknya Anda Unduh Patch Terbaru ke ${currentVersion} =====> ${latestVersion}`;
                
                textNpm = `│ Npm : ${censoredName}@${currentVersion}\n│ ${npmStatus}`;
            }
        } catch (e) {
            textNpm = '│ Npm : Error Membaca Data\n│ Belum Ada Pembaruan Jika Ada Error Hubungin Owner.';
        }

        try {
            const packageJsonLokal = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            let githubVersionLokal = packageJsonLokal.version || 'Unknown';
            let githubVersionRemote = githubVersionLokal;

            const urlPkg = `https://api.github.com/repos/${GITHUB_OWNER}/${BOT_REPO}/contents/package.json?ref=${GITHUB_BRANCH}`;
            const fetchOptions = GITHUB_TOKEN ? { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } } : {};
            const resPkg = await fetch(urlPkg, fetchOptions);
            
            if (resPkg.ok) {
                const dataPkg = await resPkg.json();
                const contentPkg = Buffer.from(dataPkg.content, 'base64').toString('utf8');
                const remotePkgJson = JSON.parse(contentPkg);
                githubVersionRemote = remotePkgJson.version || githubVersionLokal;
            } else {
                throw new Error("Gagal mengambil package.json dari GitHub");
            }

            let githubStatus = '';
            if (githubVersionLokal === githubVersionRemote) {
                githubStatus = 'Tidak Ada Pembaruan Jika Ada Error Segera Hubungin Owner.';
            } else {
                githubStatus = `Ada Pembaruan Terhadap Patch Script @${BOT_REPO} ${githubVersionLokal} =====> ${githubVersionRemote}`;
            }

            textGithub = `│ Github : @${BOT_REPO}@${githubVersionLokal}\n│ ${githubStatus}`;
        } catch (e) {
            textGithub = `│ Github : @${BOT_REPO}@Error\n│ Mohon Maaf Ada Masalah Di GitHub ${BOT_REPO}`;
        }

        let finalReport = `┌── [ 📊 𝗦𝗧𝗔𝗧𝗨𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 𝗕𝗢𝗧 ] ──\n│\n${textNpm}\n│\n${textGithub}\n│\n└──────────────`;
        return await editProgress(finalReport);
    }

    if (!args[0]) {
        let mediaGambar;
        try {
            mediaGambar = fs.readFileSync('./image/foto.jpg'); 
        } catch (err) {
            return m.reply('❌ Kesalahan: File gambar tidak ditemukan di folder `./image/foto.jpg`.');
        }

        let media = await prepareWAMessageMedia({
            document: mediaGambar,
            fileName: 'System Update', 
            mimetype: 'image/jpeg', 
            jpegThumbnail: mediaGambar 
        }, { upload: conn.waUploadToServer });

        let listSections = [
            {
                title: "⚙️ SYSTEM & UPDATE",
                highlight_label: "Penting",
                rows: [
                    { title: "🔍 Cek Update Bot", description: "Cek ketersediaan script di GitHub & versi NPM", id: `${usedPrefix}cekupdate` },
                    { title: "📥 Download Script GitHub", description: "Hanya Unduh file ke /System/Script-Downloader/", id: `${usedPrefix}update core` },
                    { title: "🚀 Terapkan Update Script", description: "Pindah file unduhan ke Script Bot Utama", id: `${usedPrefix}update applyupdate` },
                    { title: "📦 Update Baileys NPM", description: "Perbarui library Baileys & sync ke GitHub", id: `${usedPrefix}update baileys` }
                ]
            },
            {
                title: "🗄️ DATABASE MANAGEMENT",
                highlight_label: "Backup",
                rows: [
                    { title: "📥 Download Database", description: "Ambil database.json dari GitHub", id: `${usedPrefix}update downloaddb` },
                    { title: "📤 Upload Database", description: "Backup manual database.json ke GitHub", id: `${usedPrefix}update uploaddb` }
                ]
            },
            {
                title: "🧹 MAINTENANCE",
                highlight_label: "Tools",
                rows: [
                    { title: "🧹 Perbaiki File Ganda", description: "Hapus file duplikat di folder plugins", id: `${usedPrefix}update perbaikifile` }
                ]
            }
        ];

        let textData = `┌─⊷ *SYSTEM MANAGEMENT*\n┃\n┃ Halo Owner 👋\n┃ Silakan pilih opsi manajemen\n┃ sistem bot di bawah ini.\n└──────────────`;

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: { mentionedJid: [m.sender] }, 
                        body: { text: textData },
                        footer: { text: "© HARPS BOT MD" },
                        header: { 
                            hasMediaAttachment: true,
                            documentMessage: media.documentMessage 
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "⚙️ PILIH AKSI DISINI",
                                        sections: listSections
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { 
            messageId: msg.key.id, 
            additionalNodes: buildInteractiveAdditionalNodes(m.chat, msg.message) 
        });
        return;
    }

    const action = args[0].toLowerCase();

    if (action === 'core') {
        const targetRepo = `https://github.com/${GITHUB_OWNER}/${BOT_REPO}.git`;
        const extractFolder = path.join(process.cwd(), 'System', 'Script-Downloader');

        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ 🚀 Menghubungkan ke GitHub...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;

        try {
            const res = await fetch(BOT_API_URL);
            if (!res.ok) {
                return await editProgress(`┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ 🚨 Mohon Maaf Ada Masalah Di GitHub ${BOT_REPO}\n└──────────────`);
            }
            
            const data = await res.json();
            if (data.size === 0) {
                return await editProgress(`┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ 📂 GitHub Repo Berhasil Ditemukan Tapi Tidak Ada File\n│ 🛑 Proses unduh dibatalkan.\n└──────────────`);
            }

            await editProgress(`┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ ✨ File Ditemukan!\n│ 📁 Menyiapkan folder penyimpanan...\n└──────────────`);

            if (fs.existsSync(extractFolder)) {
                fs.rmSync(extractFolder, { recursive: true, force: true });
            }
            fs.mkdirSync(extractFolder, { recursive: true });

            await editProgress(`┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ ⏳ Mengunduh seluruh file (Clone)...\n│ 📍 Path: /System/Script-Downloader/\n└──────────────`);

            const gitCmd = `git clone --depth 1 ${targetRepo} .`;
            
            exec(gitCmd, { cwd: extractFolder }, async (error) => {
                if (error) {
                    return await editProgress(`┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ ❌ Gagal mengunduh script!\n│ Error: ${error.message}\n└──────────────`);
                }
                
                await editProgress(`┌── [ 🎉 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗦𝗨𝗞𝗦𝗘𝗦 ] ──\n│ ✅ Script berhasil diunduh secara penuh!\n│\n│ 📍 Tersimpan Rapi Di:\n│ 🗂️ /System/Script-Downloader/\n│\n│ 💡 Gunakan menu "Terapkan Update" untuk memindahkannya ke folder utama bot.\n└──────────────`);
            });

        } catch (e) {
            await editProgress(`┌── [ 📥 𝗦𝗖𝗥𝗜𝗣𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 ] ──\n│ ❌ Terjadi Kesalahan: ${e.message}\n└──────────────`);
        }
    }

    else if (action === 'applyupdate') {
        const extractFolder = path.join(process.cwd(), 'System', 'Script-Downloader');
        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 🚀 𝗔𝗣𝗣𝗟𝗬 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ⏳ Memeriksa folder unduhan...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;

        if (!fs.existsSync(extractFolder) || fs.readdirSync(extractFolder).length === 0) {
            return await editProgress(`┌── [ 🚀 𝗔𝗣𝗣𝗟𝗬 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ❌ Folder unduhan kosong!\n│\n│ 💡 Silakan download script terlebih dahulu menggunakan menu:\n│ 📥 Download Script GitHub\n└──────────────`);
        }

        await editProgress(`┌── [ 🚀 𝗔𝗣𝗣𝗟𝗬 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ⏳ Memindahkan script ke folder utama...\n│ Proses ini akan menimpa file lama bot.\n└──────────────`);

        const githubPkgPath = path.join(extractFolder, 'package.json');
        if (fs.existsSync(githubPkgPath)) {
            try {
                fs.unlinkSync(githubPkgPath);
                console.log('✅ [Update] File package.json dari GitHub diabaikan.');
            } catch (err) {
                console.log(`⚠️ [Update] Gagal menghapus package.json unduhan: ${err.message}`);
            }
        }

        try {
            if (fs.cpSync) {
                fs.cpSync(extractFolder, process.cwd(), { recursive: true, force: true });
            } else {
                throw new Error("fs.cpSync tidak didukung.");
            }

            await editProgress(`┌── [ 🎉 𝗨𝗣𝗗𝗔𝗧𝗘 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 ] ──\n│ ✅ Script utama bot telah ditimpa dengan\n│ file terbaru dari folder unduhan.\n│\n│ ⚠️ Penting: Silakan RESTART bot Anda agar efek update berjalan.\n└──────────────`);
        } catch (e) {
            exec(`cp -rf "${extractFolder}"/* ./`, async (err) => {
                if(err) {
                     return await editProgress(`┌── [ 🚀 𝗔𝗣𝗣𝗟𝗬 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ❌ Gagal menerapkan update!\n│ Error: ${err.message}\n└──────────────`);
                }
                await editProgress(`┌── [ 🎉 𝗨𝗣𝗗𝗔𝗧𝗘 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 ] ──\n│ ✅ Script utama bot telah ditimpa dengan\n│ file terbaru dari folder unduhan.\n│\n│ ⚠️ Penting: Silakan RESTART bot Anda agar efek update berjalan.\n└──────────────`);
            });
        }
    }

    else if (action === 'baileys') {
        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ 🔍 Membaca package.json...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;
        const pkgPath = path.join(process.cwd(), 'package.json');

        try {
            let packageJsonContent = fs.readFileSync(pkgPath, 'utf8');
            let packageJson = JSON.parse(packageJsonContent);
            let baileysName = Object.keys(packageJson.dependencies).find(pkg => pkg.includes('baileys'));
            
            if (!baileysName) return await editProgress('┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ❌ Gagal menemukan library Baileys!\n└──────────────');

            let cleanName = baileysName.replace('@', ''); 
            let censoredName = '@' + cleanName.substring(0, 3) + 'x'.repeat(cleanName.length - 3);
            let currentVersion = packageJson.dependencies[baileysName].replace(/[\^~]/g, '');

            await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ 📦 Package: ${censoredName}\n│ 🏷️ Versi Saat Ini: ${currentVersion}\n│ 📡 Mengecek versi terbaru NPM...\n└──────────────`);

            exec(`npm view ${baileysName} version`, async (err, stdout) => {
                if (err) return await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ❌ Gagal menghubungi server NPM!\n└──────────────`);
                
                let latestVersion = stdout.trim();
                
                if (currentVersion === latestVersion) {
                    return await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ✅ Baileys sudah versi terbaru!\n│\n│ 📦 Package: ${censoredName}\n│ 🏷️ Versi Terpasang: ${currentVersion}\n│ 🌐 Versi di NPM: ${latestVersion}\n└──────────────`);
                }

                await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ 🚀 Menginstal pembaruan lokal...\n│ 📉 Lama: ${currentVersion}  ➡️  📈 Baru: ${latestVersion}\n│ ⏳ Sedang mengunduh via NPM...\n└──────────────`);

                exec(`npm install ${baileysName}@latest --save`, async (errInstall) => {
                    if (errInstall) return await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ❌ Gagal menginstal versi baru!\n└──────────────`);
                    
                    await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ 🚀 Install Lokal Berhasil!\n│ ⚙️ Menyinkronkan ke GitHub...\n└──────────────`);

                    let githubStatus = "│ ⚠️ Gagal sync ke GitHub (Token Invalid/Kosong)";
                    
                    try {
                        let updatedPkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                        updatedPkgJson.dependencies[baileysName] = `^${latestVersion}`;
                        
                        if (updatedPkgJson.version) {
                            let vParts = updatedPkgJson.version.split('.');
                            vParts[2] = parseInt(vParts[2]) + 1;
                            updatedPkgJson.version = vParts.join('.');
                        }

                        let newPkgString = JSON.stringify(updatedPkgJson, null, 4);
                        fs.writeFileSync(pkgPath, newPkgString);

                        if (GITHUB_TOKEN) {
                            const url = `https://api.github.com/repos/${GITHUB_OWNER}/Harps-MD/contents/package.json`;
                            let sha = null;
                            const resSha = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
                                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
                            });
                            if (resSha.ok) sha = (await resSha.json()).sha;
                            
                            const resUpload = await fetch(url, {
                                method: 'PUT',
                                headers: {
                                    Authorization: `token ${GITHUB_TOKEN}`,
                                    Accept: 'application/vnd.github.v3+json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    message: `🚀 Auto-Update: ${baileysName} to v${latestVersion}`,
                                    content: Buffer.from(newPkgString).toString('base64'),
                                    branch: GITHUB_BRANCH,
                                    ...(sha ? { sha } : {})
                                })
                            });
                            
                            if (resUpload.ok) {
                                githubStatus = "│ ☁️ GitHub Sync: package.json Tersimpan!";
                            } else {
                                let errData = await resUpload.json();
                                githubStatus = `│ ⚠️ GitHub Error: ${errData.message}`;
                            }
                        }
                    } catch (e) {
                        githubStatus = `│ ⚠️ GitHub Sync Error: ${e.message}`;
                    }

                    await editProgress(`┌── [ 🎉 𝗨𝗣𝗗𝗔𝗧𝗘 𝗦𝗘𝗟𝗘𝗦𝗔𝗜 ] ──\n│ 📦 Package: ${censoredName}\n│ ✅ Versi Lokal: ${latestVersion}\n${githubStatus}\n│\n│ ⚠️ Penting: Silakan restart bot Anda.\n└──────────────`);
                });
            });
        } catch (e) { await editProgress(`┌── [ 📦 𝗕𝗔𝗜𝗟𝗘𝗬𝗦 𝗨𝗣𝗗𝗔𝗧𝗘 ] ──\n│ ❌ Terjadi Kesalahan Sistem!\n└──────────────`); }
    }

    else if (action === 'downloaddb') {
        if (!GITHUB_TOKEN) return m.reply('❌ Token GitHub (global.githubKey) tidak ditemukan di config.js');
        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 📥 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗗𝗕 ] ──\n│ 📡 Mengambil database.json...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;

        try {
            const repoPath = path.basename(DB_FILE);
            const res = await fetch(`${DB_BASE_URL}/${repoPath}?ref=${GITHUB_BRANCH}`, {
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });
            if (!res.ok) throw new Error(`Gagal ambil dari GitHub (${res.status})`);
            
            const data = await res.json();
            const text = Buffer.from(data.content, 'base64').toString('utf8');
            JSON.parse(text); 
            fs.writeFileSync(DB_FILE, text);
            
            await editProgress(`┌── [ 📥 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗗𝗕 ] ──\n│ ✅ Download Berhasil!\n│ 📦 File: database.json telah diganti.\n│ ⚠️ Penting: Restart bot Anda!\n└──────────────`);
        } catch (e) { await editProgress(`┌── [ 📥 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗗𝗕 ] ──\n│ ❌ Gagal mengunduh DB!\n│ Error: ${e.message}\n└──────────────`); }
    }

    else if (action === 'uploaddb') {
        if (!GITHUB_TOKEN) return m.reply('❌ Token GitHub (global.githubKey) tidak ditemukan di config.js');
        if (!fs.existsSync(DB_FILE)) return m.reply('❌ File database.json tidak ditemukan.');

        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 📤 𝗨𝗣𝗟𝗢𝗔𝗗 𝗗𝗕 ] ──\n│ 📤 Membaca database.json...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;

        try {
            const b64 = fs.readFileSync(DB_FILE).toString('base64');
            const repoPath = path.basename(DB_FILE);
            let sha = null;
            
            const resSha = await fetch(`${DB_BASE_URL}/${repoPath}?ref=${GITHUB_BRANCH}`, {
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }
            });
            if (resSha.ok) sha = (await resSha.json()).sha;

            const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            const resUpload = await fetch(`${DB_BASE_URL}/${repoPath}`, {
                method: 'PUT',
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `🔄 Backup Manual: ${repoPath} [${waktu}]`,
                    content: b64, branch: GITHUB_BRANCH, ...(sha ? { sha } : {})
                })
            });

            if (resUpload.ok) {
                await editProgress(`┌── [ 📤 𝗨𝗣𝗟𝗢𝗔𝗗 𝗗𝗕 ] ──\n│ ✅ Upload Berhasil!\n│ 📦 File: database.json telah dibackup.\n│ 🕐 Waktu: ${waktu}\n└──────────────`);
            } else { throw new Error((await resUpload.json()).message); }
        } catch (e) { await editProgress(`┌── [ 📤 𝗨𝗣𝗟𝗢𝗔𝗗 𝗗𝗕 ] ──\n│ ❌ Gagal mengupload DB!\n│ Error: ${e.message}\n└──────────────`); }
    }

    else if (action === 'perbaikifile') {
        let initMsg = await conn.sendMessage(m.chat, { text: '┌── [ 🧹 𝗖𝗟𝗘𝗔𝗡𝗨𝗣 𝗙𝗜𝗟𝗘 ] ──\n│ ⏳ Memindai file ganda...\n└──────────────' }, { quoted: m });
        msgKey = initMsg.key;

        const targetDir = './plugins'; 
        let hashes = {};
        let deletedFiles = [];

        const getAllFiles = (dir) => {
            let results = [];
            const list = fs.readdirSync(dir);
            list.forEach((file) => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) results = results.concat(getAllFiles(filePath));
                else results.push({ path: filePath, time: stat.mtimeMs });
            });
            return results;
        };

        try {
            const allFiles = getAllFiles(targetDir);
            for (let fileObj of allFiles) {
                if (!fileObj.path.endsWith('.js')) continue;
                const content = fs.readFileSync(fileObj.path);
                const hash = crypto.createHash('md5').update(content).digest('hex');
                if (!hashes[hash]) hashes[hash] = [];
                hashes[hash].push(fileObj);
            }

            for (let hash in hashes) {
                let fileGroup = hashes[hash];
                if (fileGroup.length > 1) {
                    fileGroup.sort((a, b) => b.time - a.time); 
                    for (let i = 1; i < fileGroup.length; i++) {
                        fs.unlinkSync(fileGroup[i].path);
                        deletedFiles.push(path.basename(fileGroup[i].path));
                    }
                }
            }

            if (deletedFiles.length === 0) {
                await editProgress(`┌── [ 🧹 𝗖𝗟𝗘𝗔𝗡𝗨𝗣 𝗙𝗜𝗟𝗘 ] ──\n│ ✅ Folder Bersih!\n│ Tidak ada file duplikat ditemukan.\n└──────────────`);
            } else {
                await editProgress(`┌── [ 🧹 𝗖𝗟𝗘𝗔𝗡𝗨𝗣 𝗙𝗜𝗟𝗘 ] ──\n│ ✅ Pembersihan Selesai!\n│ 🗑️ Menghapus ${deletedFiles.length} file lama:\n│ • ${deletedFiles.join('\n│ • ')}\n└──────────────`);
            }
        } catch (e) { await editProgress(`┌── [ 🧹 𝗖𝗟𝗘𝗔𝗡𝗨𝗣 𝗙𝗜𝗟𝗘 ] ──\n│ ❌ Gagal memindai file!\n│ Error: ${e.message}\n└──────────────`); }
    }
};

handler.help = ['update', 'cekupdate'];
handler.tags = ['owner'];
handler.command = /^(update|gitpull|db|cekupdate)$/i;
handler.rowner = true; 

module.exports = handler;
