const { createCanvas, loadImage } = require('canvas')
const path = require('path')
const fs = require('fs')

async function createWelcome(isAdd, ppUrl, memberName, groupName, memCount) {
    try {
        const canvas = createCanvas(1280, 720)
        const ctx = canvas.getContext('2d')

        // Panggil background dari folder image
        const templateImg = path.join(__dirname, '../image/welcome.png')
        if (!fs.existsSync(templateImg)) return null;

        const bg = await loadImage(templateImg)
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        let avatar;
        try {
            avatar = await loadImage(ppUrl)
        } catch {
            avatar = await loadImage('https://telegra.ph/file/24fa902ead26340f3df2c.png')
        }

        const avatarX = canvas.width / 2
        const avatarY = 220
        const avatarRadius = 120

        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true)
        ctx.lineWidth = 10
        ctx.strokeStyle = "#00FFFF"
        ctx.stroke()
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
        ctx.restore()

        ctx.font = 'bold 75px Arial'
        ctx.fillStyle = '#00FFFF' 
        ctx.textAlign = 'center'
        ctx.fillText(isAdd ? "SELAMAT DATANG" : "SELAMAT TINGGAL", canvas.width / 2, 420)

        ctx.beginPath()
        ctx.moveTo(canvas.width / 2 - 250, 450)
        ctx.lineTo(canvas.width / 2 + 250, 450)
        ctx.lineWidth = 4
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.stroke()

        ctx.font = 'bold 45px Arial'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(isAdd ? "Semoga Betah" : "Selamat Jalan", canvas.width / 2, 520)

        ctx.font = '30px Arial'
        ctx.fillStyle = '#B0BEC5'
        ctx.fillText((groupName || '').toUpperCase(), canvas.width / 2, 570)

        let countText = isAdd ? `Member #${memCount}` : `Member Keluar`
        ctx.font = 'bold 30px Arial'
        
        let textWidth = ctx.measureText(countText).width
        let boxWidth = textWidth + 80
        let boxHeight = 60
        let boxX = (canvas.width / 2) - (boxWidth / 2)
        let boxY = 610
        let radius = 30
        
        ctx.beginPath()
        ctx.moveTo(boxX + radius, boxY)
        ctx.lineTo(boxX + boxWidth - radius, boxY)
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius)
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius)
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight)
        ctx.lineTo(boxX + radius, boxY + boxHeight)
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius)
        ctx.lineTo(boxX, boxY + radius)
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY)
        ctx.closePath()
        
        ctx.lineWidth = 3
        ctx.strokeStyle = "#00FFFF"
        ctx.stroke()
        
        ctx.fillStyle = '#00FFFF'
        ctx.fillText(countText, canvas.width / 2, boxY + 41)

        return canvas.toBuffer('image/png')
    } catch (err) {
        console.error("Error di lib/welcome.js:", err)
        return null 
    }
}

module.exports = { createWelcome }