<div align="center">

<img src="image/Default.png" alt="Harps-MD Logo" width="150" style="border-radius: 50%"/>

# 🤖 HARPS-MD

### *Lightweight & Feature-Rich WhatsApp Bot*

[![Version](https://img.shields.io/badge/Version-4.0.0-blue?style=for-the-badge&logo=github)](https://github.com/VinzSocket/Harps-MD)
[![Baileys](https://img.shields.io/badge/Baileys-@vinzsocket%2Fbaileys%20v3.2.8-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/VinzSocket/Harps-MD)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](src/LICENSE)
[![Platform](https://img.shields.io/badge/Platform-WhatsApp%20MD-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/VinzSocket/Harps-MD)

---

> **Harps-MD** adalah WhatsApp bot berbasis Multi-Device (MD) yang dibangun di atas library **@vinzsocket/baileys**, dilengkapi ratusan fitur dari downloader, AI, game RPG, hingga manajemen grup — siap pakai dan mudah dikustomisasi.

[📦 Download](#-instalasi) · [🔧 Konfigurasi](#-konfigurasi) · [✨ Fitur](#-fitur) · [📁 Struktur](#-struktur-file) · [🐛 Issues](https://github.com/Kevin-b2t/Harps-MD/issues)

</div>

---

## 📌 Informasi Versi

| Info | Detail |
|------|--------|
| 🏷️ **Versi Bot** | `4.0.0` |
| 📚 **Library Baileys** | `@vinzsocket/baileys` v3.2.7 |
| 🟢 **Node.js** | v20 atau lebih baru |
| 📦 **Package Manager** | npm |
| 📄 **Entry Point** | `Settings.js` |
| ⚙️ **Mode** | WhatsApp Multi-Device (MD) |
| 🔑 **API Utama** | [BotCahX API](https://api.botcahx.eu.org) |

> **Catatan:** Bot ini menggunakan fork Baileys dari `@vinzsocket/baileys` yang telah dioptimasi untuk kompatibilitas dengan ekosistem Harps-MD.

---

## ✨ Fitur

<details>
<summary><b>🤖 Artificial Intelligence (AI)</b></summary>

| Plugin | Deskripsi |
|--------|-----------|
| `AI-gemini` | Chat dengan Google Gemini AI |
| `_AI-bard` | Integrasi Google Bard |
| `_AI-bing` | Chat dengan Bing AI |
| `_AI-blackbox` | Blackbox AI |
| `_AI-dalle` | Generate gambar via DALL·E |
| `_AI-lepton` | Lepton AI |
| `_AI-stablediffusion` | Generate gambar Stable Diffusion |
| `_AI-text2img` | Text to Image AI |
| `_AI-tofigure` | Analisis visual dengan AI |
| `_AI-tag` | Auto tag menggunakan AI |
| `_AI-agedetect` | Deteksi usia via AI |
| `_AI-ailirik` | Generate lirik lagu AI |
| `_AI-autoai` | Auto respons AI |
| `_AI-bardimg` | Generate gambar via Bard |

</details>

<details>
<summary><b>📥 Downloader</b></summary>

| Plugin | Platform |
|--------|----------|
| `downloader-aio` | All-in-One downloader |
| `downloader-ig` | Instagram (foto & video) |
| `downloader-fb` | Facebook |
| `downloader-play` | YouTube / Play |
| `downloader-soundcloud` | SoundCloud |
| `downloader-tiktok` | TikTok |
| `downloader-douyin` | Douyin |
| `downloader-capcut` | CapCut |
| `downloader-threads` | Threads |
| `downloader-rednote` | RedNote |
| `downloader-gdrive` | Google Drive |
| `downloader-snackvideo` | SnackVideo |
| `downloader-likee` | Likee |
| `downloader-cocofun` | CocoFun |
| `downloader-scribd` | Scribd |
| `downloader-slideshare` | SlideShare |
| `downloader-pastebin` | Pastebin |
| `downloader-gitclone` | Clone GitHub Repo |
| `donwloader-githubdl` | Download file GitHub |
| `downloader-telesticker` | Telegram Sticker |
| `downloader-gore` | Gore content (restricted) |
| `downloader-asupan` | Asupan content |
| `downloader-VideoAndAudio` | Video & Audio universal |

</details>

<details>
<summary><b>🛡️ Manajemen Grup</b></summary>

- ✅ Anti-link, anti-foto, anti-sticker, anti-spam, anti-call
- ✅ Anti konten porno (auto-delete)
- ✅ Auto welcome & goodbye member
- ✅ Sistem warn & kick otomatis
- ✅ Lock/unlock fitur grup per command
- ✅ Catatan grup (simpan, lihat, hapus)
- ✅ Auto react pesan
- ✅ Total chat tracking per member
- ✅ Jadwal sholat otomatis (autosholat)
- ✅ Auto bio dinamis

</details>

<details>
<summary><b>🎮 Game & RPG</b></summary>

| Plugin | Deskripsi |
|--------|-----------|
| `game-tictactoe` | Tic-Tac-Toe |
| `game-ular_tangga` | Ular Tangga |
| `game-werewolf` | Werewolf game |
| `game-sambungkata` | Sambung kata |
| `rpg_daily` | Daily reward RPG |
| `rpg_leaderboard` | Leaderboard RPG |
| `rpg_buydm` | Beli item RPG |
| `rpg_shop` | Toko RPG |
| `rpgG_warpause` | War & pause RPG |
| `xp-levelup` | Sistem XP & level up |
| `xp-limit` | Limit XP harian |
| `xp-regist` | Registrasi XP |

</details>

<details>
<summary><b>🖼️ Sticker & Media</b></summary>

- 🎨 Buat sticker dari foto, video, GIF
- 🎨 Sticker AI (auto generate)
- 🎨 Emoji sticker & Emoji mix
- 🎨 Sticker meme (smeme)
- 🎨 Random sticker
- 🎨 Edit EXIF sticker (packname/author)
- 🎨 Remove watermark sticker
- 🎨 GIF to image
- 🔊 Text-to-Sticker (TTS visual)
- 🔤 Font kustom 40+ pilihan

</details>

<details>
<summary><b>🔧 Tools & Utilitas</b></summary>

| Kategori | Fitur |
|----------|-------|
| 🔗 **URL** | Bitly, Cuttly, TinyURL, cek redirect |
| 🖼️ **Gambar** | HD enhance, resize, recolor, OCR, img2prompt |
| 🎵 **Audio** | Convert audio, vocal remover, ogg converter |
| 🎬 **Video** | HD video, audio2video, video2audio |
| 📱 **Info** | IP lookup, WHOIS, cek channel, device info |
| 💰 **Finance** | QRIS, cek ewallet, konversi mata uang, PLN |
| 📝 **Teks** | Base64, binary, font converter, nulis |
| 🌐 **Web** | Screenshot web, subdomain finder, SSH panel |
| 🔒 **Security** | 2FA, enkripsi, HLH checker |
| 📚 **Info** | KBBI, zodiak, kalender libur Indonesia |
| 📧 **Temp** | Temp mail |
| 🎵 **Musik** | What music, top TV |

</details>

<details>
<summary><b>👥 Stalker & Profil</b></summary>

- 🔍 Instagram stalker
- 🔍 GitHub stalker
- 🔍 TikTok stalker
- 🔍 Twitter/X stalker
- 🔍 YouTube channel stalker
- 🔍 SnackVideo stalker
- 👤 Cek profil & info WhatsApp

</details>

<details>
<summary><b>🏪 Store & Panel</b></summary>

- 🛒 Panel toko terintegrasi
- 📋 Set daftar produk
- 🔄 Update & hapus list
- 💸 Proses order otomatis (store-script)
- 🔧 Set script & konfigurasi panel

</details>

<details>
<summary><b>⚙️ Sistem & Bot Management</b></summary>

- 🔄 Auto restart saat crash
- 🌐 Web server built-in (multi-port fallback)
- 📊 System monitor (RAM, OS, plugin count)
- 🔌 Hot-reload plugin tanpa restart
- 👑 Sistem owner, moderator, premium
- ⏰ AFK system
- 📦 Cluster support
- 💾 Database: lowdb (lokal) & MongoDB (cloud)
- 🗂️ Script & panel store

</details>

---

## 📁 Struktur File

```
Harps-MD/
│
├── 📄 Settings.js              # Entry point utama bot (launcher + web server)
├── 📄 HARPSMD.mjs              # ESM module entry
├── 📄 Browser.js               # Konfigurasi browser/koneksi WA
├── 📄 Harps-Dispatcher.js      # Core dispatcher & message handler
├── 📄 config.js                # Konfigurasi global (owner, API keys, toggle fitur)
├── 📄 server.js                # Web server Express
├── 📄 run.js                   # Runner script
├── 📄 test.js                  # Testing script
├── 📄 speed.py                 # Python utility
├── 📄 package.json             # Dependensi & metadata
│
├── 📁 plugins/                 # Semua plugin bot (~200+ file)
│   ├── _AI-*.js                # Plugin AI
│   ├── downloader-*.js         # Plugin downloader
│   ├── game-*.js               # Plugin game
│   ├── group-*.js              # Plugin manajemen grup
│   ├── rpg*.js                 # Plugin RPG
│   ├── sticker-*.js            # Plugin sticker
│   ├── store-*.js              # Plugin toko
│   ├── tools-*.js              # Plugin utilitas
│   ├── stalker-*.js            # Plugin stalker
│   ├── xp-*.js                 # Plugin XP & leveling
│   └── _*.js                   # Plugin sistem (anti-spam, auto-*, dll)
│
├── 📁 lib/                     # Library & helper internal
│   ├── Harps-Client.js         # WhatsApp client wrapper
│   ├── functions.js            # Fungsi umum
│   ├── myfunc.js               # Fungsi kustom
│   ├── database.js             # Handler database
│   ├── cloudDBAdapter.js       # Adapter cloud DB
│   ├── mongoDB.js              # Koneksi MongoDB
│   ├── welcome.js              # Handler welcome message
│   ├── levelling.js            # Sistem leveling XP
│   ├── sticker.js              # Utility sticker
│   ├── webp.js                 # Handler WebP
│   ├── webp2mp4.js             # Converter WebP ke MP4
│   ├── exif.js                 # EXIF editor
│   ├── print.js                # Pretty print logger
│   ├── color.js                # Color utility
│   ├── converter.js            # Konverter media
│   ├── systemMonitor.js        # Monitor sistem
│   ├── cluster.js              # Cluster handler
│   ├── logs.js                 # Logger
│   ├── uploadFile.js           # Upload file utility
│   ├── uploadImage.js          # Upload gambar utility
│   ├── invoiceMaker.js         # Generator invoice
│   ├── group-totalchat.js      # Tracking total chat grup
│   ├── tictactoe.js            # Game Tic-Tac-Toe
│   ├── ular_tangga.js          # Game Ular Tangga
│   ├── werewolf.js             # Game Werewolf
│   ├── sambung-kata.js         # Game Sambung Kata
│   ├── Downloader-Apikey.js    # API key downloader
│   ├── lowdb/                  # Database lokal (lowdb)
│   └── json/
│       └── kbbi.json           # Database KBBI lokal
│
├── 📁 image/                   # Aset gambar bot
│   ├── Default.png             # Foto profil default
│   ├── welcome.png             # Gambar welcome
│   ├── afk.jpg                 # Gambar AFK
│   ├── foto.jpg                # Foto umum
│   ├── template_leaderboard.png
│   └── SystemCek.png
│
├── 📁 src/                     # Aset statis & resource
│   ├── LICENSE                 # File lisensi
│   ├── font/                   # 40+ file font (.ttf/.otf)
│   │   ├── HARPS-MONO.ttf      # Font kustom Harps
│   │   ├── Roboto-*.ttf        # Keluarga font Roboto
│   │   └── ...
│   ├── Aesthetic/              # Gambar aesthetic
│   └── kertas/                 # Aset texture kertas
│
├── 📁 media/                   # Media statis
│   └── sticker/
│       └── emror.webp          # Sticker error
│
└── 📁 views/                   # Web UI
    ├── index.html              # Halaman web bot
    ├── index.js                # Script frontend
    ├── style.css               # Stylesheet
    └── img/
        ├── dark/               # Aset tema gelap
        └── light/              # Aset tema terang
```

---

## 🚀 Instalasi

### Prasyarat

- Node.js v20+
- npm
- Git

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/VinzSocket/Harps-MD.git
cd Harps-MD

# 2. Install dependensi
npm install

# 3. Konfigurasi bot (lihat bagian Konfigurasi di bawah)
nano config.js

# 4. Jalankan bot
npm start
```

---

## ⚙️ Konfigurasi

Edit file `config.js` sesuai kebutuhan:

```js
// ─── WAJIB DIISI ───────────────────────────────────────────
global.owner       = ["628xxxxxxxxxx"];   // Nomor owner (format: 628xxx)
global.nameowner   = "Nama Kamu";         // Nama owner
global.numberowner = "628xxxxxxxxxx";     // Nomor owner (duplikat untuk fungsi tertentu)
global.mail        = "email@kamu.com";    // Email support
global.gc          = "https://chat.whatsapp.com/..."; // Link grup WA
global.wm          = "Harps-MD";          // Nama watermark bot

// ─── TOGGLE FITUR ──────────────────────────────────────────
global.autobio   = false;   // Auto update bio bot
global.antiporn  = false;   // Auto hapus konten porno di grup
global.spam      = false;   // Anti spam aktif
global.gcspam    = false;   // Kunci grup saat spam terdeteksi

// ─── API KEYS ──────────────────────────────────────────────
global.btc       = "VinzKey0110";   // API key BotCahX (daftar di api.botcahx.eu.org)
global.aksesKey  = "VinzKey0110";   // Akses key premium (opsional)
```

> 💡 **Tips:** Gunakan file `.env` untuk menyimpan API key secara aman, lalu aktifkan baris `process.env.API_KEY_BTC` di `config.js`.

---

## 📡 Web Server

Bot otomatis menjalankan web server Express di salah satu port berikut (urutan fallback):

| Port | Status |
|------|--------|
| `4000` | Primary |
| `5000` | Fallback 1 |
| `6000` | Fallback 2 |
| `7000` | Fallback 3 |
| `8000` | Fallback 4 |

Akses dashboard: `http://localhost:4000`

---

## 🗄️ Database

Harps-MD mendukung dua mode database:

| Mode | File | Keterangan |
|------|------|------------|
| **Lokal** | `lib/lowdb/` | Menggunakan lowdb (JSON file) — default |
| **Cloud** | `lib/mongoDB.js` | Menggunakan MongoDB Atlas — untuk multi-instance |

---

## 🤝 Kontribusi

Pull request dan issue sangat disambut! Silakan fork repo ini dan submit PR kamu.

---

## 📞 Kontak & Support

| Platform | Link |
|----------|------|
| 💬 **Grup WhatsApp** | [Join Grup](https://chat.whatsapp.com/LkLHwUWpXQJ3kcrpqWLBbO) |
| 📢 **Channel WA** | [Follow Channel](https://whatsapp.com/channel/0029Vaeovqk1noyyUalf9z16) |
| 📸 **Instagram** | [@prm2.0](https://instagram.com/prm2.0) |
| 🐛 **Bug Report** | [GitHub Issues](https://github.com/VinzSocket/Harps-MD/issues) |
| 🌐 **API BotCahX** | [api.botcahx.eu.org](https://api.botcahx.eu.org) |

---

## 📜 Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat [`src/LICENSE`](src/LICENSE) untuk detail lengkap.

---

<div align="center">

**Made with ❤️ by [HARPSMD](https://github.com/VinzSocket/Harps-MD)**

*Powered by [@vinzsocket/baileys](https://github.com/VinzSocket) v3.2.7*

</div>
