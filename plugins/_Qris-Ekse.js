const axios = require('axios');
const QRCode = require('qrcode');
const { generateInvoice } = require('../lib/invoiceMaker'); // Import Tukang Cetak Struk

if (!global.qrisSesi) global.qrisSesi = {}; 

async function bayarQris(conn, m, namaProduk, nominal, usedPrefix, isOwner = false, aksiSukses = null) {
    
    // 👑 JALUR VVIP OWNER
    if (isOwner) {
        let invData = {
            invoice: 'VVIP-' + Math.floor(Math.random() * 100000),
            date: new Date().toLocaleString('id-ID'),
            product: namaProduk,
            amount: 0 // Gratis
        };
        let invBuffer = await generateInvoice(invData);

        let captionText = `👑 *AKSES VVIP DETECTED!*\n\n• *Produk:* ${namaProduk}\n• *Status:* Lunas (Gratis Owner)\n\nPesanan sedang diproses ke PM lu sekarang!`;

        if (invBuffer) {
            await conn.sendMessage(m.chat, { image: invBuffer, caption: captionText }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: captionText }, { quoted: m });
        }

        if (typeof aksiSukses === 'function') {
            try { await aksiSukses(); } catch (err) {}
        }
        return;
    }

    // 👤 JALUR PEMBELI BIASA
    if (!global.Qris) return m.reply("❌ API Key QRIS belum diatur di config.");
    if (global.qrisSesi[m.sender]) return m.reply(`⏳ Lu masih ada tagihan nganggur. Ketik *${usedPrefix}batal* dulu.`);

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    try {
        const resCreate = await axios.post(
            'https://www.bayar.gg/api/create-payment.php', 
            { amount: nominal, description: `Beli: ${namaProduk}`, payment_method: 'qris', payment_url: 'https://pay.vinz.com' },
            { headers: { 'X-API-Key': global.Qris, 'Content-Type': 'application/json' } }
        );

        const data = resCreate.data.data;
        if (!data || !data.qris_string) throw new Error("Gagal generate QRIS.");

        let qrBuffer = await QRCode.toBuffer(data.qris_string, { scale: 8 });

        let qrisMsg = await conn.sendMessage(m.chat, {
            image: qrBuffer,
            caption: `🛒 *TAGIHAN PEMBAYARAN*\n\n` +
                     `• *Produk:* ${namaProduk}\n` +
                     `• *Tagihan:* Rp${data.final_amount.toLocaleString('id-ID')}\n` +
                     `• *Invoice:* ${data.invoice_id}\n\n` +
                     `Silakan Scan QR di atas. Bot bakal nungguin pembayaran lu.\n` +
                     `⏳ _Waktu: 5 Menit_ | ❌ _Ketik *${usedPrefix}batal* buat cancel_`
        }, { quoted: m });
        
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

        global.qrisSesi[m.sender] = { invoice: data.invoice_id, msgKey: qrisMsg.key };

        let isPaid = false;
        let checkCount = 0;
        const maxChecks = 30; 

        let timerCek = setInterval(async () => {
            if (!global.qrisSesi[m.sender] || global.qrisSesi[m.sender].invoice !== data.invoice_id) {
                clearInterval(timerCek); return;
            }

            checkCount++;

            if (checkCount >= maxChecks) {
                clearInterval(timerCek);
                delete global.qrisSesi[m.sender]; 
                try { await conn.sendMessage(m.chat, { delete: qrisMsg.key }); } catch(e){}
                if (!isPaid) {
                    await conn.sendMessage(m.chat, { text: `⏳ *BATAL OTOMATIS*\nWaktu 5 menit habis buat invoice *${data.invoice_id}*.` }, { quoted: m });
                }
                return;
            }

            try {
                const resCheck = await axios.post(
                    'https://www.bayar.gg/api/check-payment.php', 
                    { invoice_id: data.invoice_id },
                    { headers: { 'X-API-Key': global.Qris, 'Content-Type': 'application/json' } }
                );

                let statusTx = resCheck.data.data?.status || resCheck.data.status;

                // 🚀 EKSEKUSI KETIKA PEMBELI LUNAS
                if (statusTx === 'paid' || statusTx === 'success') {
                    isPaid = true;
                    clearInterval(timerCek);
                    delete global.qrisSesi[m.sender]; 
                    try { await conn.sendMessage(m.chat, { delete: qrisMsg.key }); } catch(e){}

                    // 1. Siapkan Cetak Struk
                    let invData = {
                        invoice: data.invoice_id,
                        date: new Date().toLocaleString('id-ID'),
                        product: namaProduk,
                        amount: nominal
                    };
                    let invBuffer = await generateInvoice(invData);
                    let captionLunas = `🎉 *PEMBAYARAN BERHASIL (LUNAS!)*\n\nPesanan lu sedang diproses. *Cek pesan pribadi (PM) lu sekarang!* File akan dikirim ke sana.\n@${m.sender.split('@')[0]}`;

                    // 2. Kirim Struk ke Chat
                    if (invBuffer) {
                        await conn.sendMessage(m.chat, { image: invBuffer, caption: captionLunas, mentions: [m.sender] }, { quoted: m });
                    } else {
                        await conn.sendMessage(m.chat, { text: captionLunas, mentions: [m.sender] }, { quoted: m });
                    }

                    // 3. Suruh script.js buat ngirim ZIP filenya ke PM pembeli (Auto-Delivery)
                    if (typeof aksiSukses === 'function') {
                        try { await aksiSukses(); } catch (err) {}
                    }
                }
            } catch (e) { }
        }, 10000); 

        global.qrisSesi[m.sender].interval = timerCek;

    } catch (err) {
        m.reply("❌ Gagal nyambung ke Server Pembayaran.");
    }
}

module.exports = bayarQris;
