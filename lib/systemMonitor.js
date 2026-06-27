const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

async function generateSystemImage(config) {
    try {
        const templateImg = path.join(process.cwd(), 'media', 'SystemCek.png'); 
        if (!fs.existsSync(templateImg)) {
            throw new Error(`FILE GAMBAR TIDAK DITEMUKAN di: ${templateImg}`);
        }

        const bg = await loadImage(templateImg);
        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext('2d');

        // Render Background
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // 1. RENDER SEMUA TEKS
        if (config.texts) {
            config.texts.forEach(c => {
                ctx.font = c.font; 
                ctx.fillStyle = c.color; 
                ctx.textAlign = c.align; 
                ctx.fillText(c.text, c.x, c.y);
            });
        }

        // 2. RENDER SEMUA GRAFIK LINGKARAN (Circle Chart)
        if (config.circles) {
            config.circles.forEach(c => {
                // Background Track
                ctx.beginPath(); 
                ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI); 
                ctx.strokeStyle = c.trackColor; 
                ctx.lineWidth = c.lineWidth; 
                ctx.stroke();

                // Value Bar
                ctx.beginPath(); 
                const startAngle = Math.PI * 1.5; 
                const endAngle = startAngle + (c.percentage / 100) * (2 * Math.PI);
                ctx.arc(c.x, c.y, c.radius, startAngle, endAngle); 
                ctx.strokeStyle = c.barColor; 
                ctx.lineCap = 'round'; 
                ctx.lineWidth = c.lineWidth; 
                ctx.stroke();
            });
        }

        // 3. RENDER SEMUA MINI BAR (Memory Details)
        if (config.miniBars) {
            config.miniBars.forEach(c => {
                // Background Track
                ctx.fillStyle = c.trackColor; 
                ctx.fillRect(c.x, c.y, c.width, c.height);
                // Value Bar
                ctx.fillStyle = c.barColor; 
                ctx.fillRect(c.x, c.y, c.width * (c.percentage / 100), c.height);
            });
        }

        // 4. RENDER GARIS TRAFIK JARINGAN (Net Lines)
        if (config.netLines) {
            config.netLines.forEach(c => {
                ctx.beginPath(); 
                ctx.moveTo(c.x, c.y - c.offset);
                for (let i = 1; i <= 10; i++) {
                    ctx.lineTo(c.x + (i * (c.width / 10)), c.y - (Math.floor(Math.random() * (c.height - 40)) + 40));
                }
                ctx.strokeStyle = c.color; 
                ctx.lineWidth = c.lineWidth; 
                ctx.stroke();
            });
        }

        return canvas.toBuffer('image/png');
    } catch (err) {
        console.error("Canvas Engine Error:", err);
        return null;
    }
}

module.exports = { generateSystemImage };
