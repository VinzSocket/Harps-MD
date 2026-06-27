const { GoogleGenerativeAI } = require('@google/generative-ai');

let handler = async (m, { text, usedPrefix, command }) => {
    // Jika tidak ada teks pertanyaan
    if (!text) throw `Pertanyaan tidak boleh kosong!\n\nContoh:\n*${usedPrefix}${command} Siapa penemu lampu?*`

    // Mengambil API Key dari config.js
    let apiKey = global.key_google;

    if (!apiKey) throw 'API Key Gemini belum disetting di config.js!';

    try {
        // Mengirimkan pesan loading dari config.js (Tunggu sedang di proses...)
        m.reply(global.wait);

        // Inisialisasi AI dengan API Key
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Meminta jawaban ke AI
        const result = await model.generateContent(text);
        const response = result.response.text();

        // Mengirim hasil jawaban AI ke user
        m.reply(response);
        
    } catch (error) {
        console.error("Error Gemini AI:", error);
        // Mengirimkan pesan error dari config.js (Server Error)
        m.reply(global.eror + '\n\nMungkin API Key limit atau tidak valid.');
    }
}

// Menambahkan ke menu bot
handler.help = ['gemini']
handler.tags = ['ai'] // Kategori di menu
handler.command = /^(gemini)$/i // Bot akan merespons command .gemini

module.exports = handler