const axios = require('axios');

async function processDownload(platform, input) {
    try {
        const API_KEY = global.btc;
        const BASE_URL = global.APIs.btc;
        let url = '';
        
        // 🧠 AUTO DETECT ENGINE: Mengecek apakah input berupa URL atau Teks Biasa (Pencarian)
        const isUrl = /^(https?:\/\/)/i.test(input.trim());
        const safeInput = encodeURIComponent(input.trim());

        switch(platform) {
            case 'pinterest':
                url = isUrl 
                    ? `${BASE_URL}/api/download/pinterest?url=${safeInput}&apikey=${API_KEY}`
                    : `${BASE_URL}/api/search/pinterest?text1=${safeInput}&apikey=${API_KEY}`;
                break;
            case 'spotify':
                url = isUrl 
                    ? `${BASE_URL}/api/download/spotify?url=${safeInput}&apikey=${API_KEY}`
                    : `${BASE_URL}/api/search/spotify?query=${safeInput}&apikey=${API_KEY}`;
                break;
            case 'tiktok':
                url = isUrl 
                    ? `${BASE_URL}/api/dowloader/tiktok?url=${safeInput}&apikey=${API_KEY}`
                    : `${BASE_URL}/api/search/tiktoks?query=${safeInput}&apikey=${API_KEY}`;
                break;
            case 'youtube':
                url = isUrl 
                    ? `${BASE_URL}/api/dowloader/yt?url=${safeInput}&apikey=${API_KEY}`
                    : `${BASE_URL}/api/search/yts?query=${safeInput}&apikey=${API_KEY}`;
                break;
            // Endpoint yang khusus untuk URL saja (Tidak punya fitur Search):
            case 'ig': url = `${BASE_URL}/api/dowloader/igdowloader?url=${safeInput}&apikey=${API_KEY}`; break;
            case 'gdrive': url = `${BASE_URL}/api/download/gdrive?url=${safeInput}&apikey=${API_KEY}`; break;
            case 'twitter': url = `${BASE_URL}/api/download/twitter2?url=${safeInput}&apikey=${API_KEY}`; break;
            case 'tiktok_slide': url = `${BASE_URL}/api/download/tiktokslide?url=${safeInput}&apikey=${API_KEY}`; break;
            default: throw new Error("Platform tidak didukung");
        }

        const response = await axios.get(url);
        
        if (!response.data) throw new Error("Tidak ada respon dari server API.");
        
        return response.data;
    } catch (error) {
        throw new Error(`[API ERROR] Gagal memproses data: ${error.message}`);
    }
}

module.exports = { processDownload };