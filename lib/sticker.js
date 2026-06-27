const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ffmpeg } = require('./converter.js');
const { spawn } = require('child_process');
const uploadFile = require('./uploadFile.js');
const uploadImage = require('./uploadImage.js');

const tmp = path.join(__dirname, '../tmp');

function sticker2(img, url) {
  return new Promise(async (resolve, reject) => {
    try {
      if (url) {
        const { default: fetch } = await import('node-fetch');
        let res = await fetch(url);
        if (res.status !== 200) throw await res.text();
        img = await res.buffer();
      }
      let inp = path.join(tmp, +new Date + '.jpeg');
      await fs.promises.writeFile(inp, img);
      let ff = spawn('ffmpeg', [
        '-y',
        '-i', inp,
        '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
        '-f', 'png',
        '-'
      ]);
      ff.on('error', reject);
      ff.on('close', async () => {
        await fs.promises.unlink(inp);
      });
      let bufs = [];
      const [_spawnprocess, ..._spawnargs] = [...(global.support?.gm ? ['gm'] : global.support?.magick ? ['magick'] : []), 'convert', 'png:-', 'webp:-'];
      let im = spawn(_spawnprocess, _spawnargs);
      im.on('error', e => console.error(e)); // Hindari error undefined conn
      im.stdout.on('data', chunk => bufs.push(chunk));
      ff.stdout.pipe(im.stdin);
      im.on('exit', () => {
        resolve(Buffer.concat(bufs));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function canvas(code, type = 'png', quality = 0.92) {
  const { default: fetch } = await import('node-fetch');
  let res = await fetch('https://nurutomo.herokuapp.com/api/canvas?' + queryURL({
    type,
    quality
  }), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': code.length.toString()
    },
    body: code
  });
  let image = await res.buffer();
  return image;
}

function queryURL(queries) {
  return new URLSearchParams(Object.entries(queries)).toString();
}

/**
 * Image to Sticker
 */
async function sticker1(img, url) {
  url = url ? url : await uploadImage(img);
  const { fromBuffer } = await import('file-type');
  let { mime } = url ? { mime: 'image/jpeg' } : await fromBuffer(img);
  let sc = `let im = await loadImg('data:${mime};base64,'+(await window.loadToDataURI('${url}')))
c.width = c.height = 512
let max = Math.max(im.width, im.height)
let w = 512 * im.width / max
let h = 512 * im.height / max
ctx.drawImage(im, 256 - w / 2, 256 - h / 2, w, h)
`;
  return await canvas(sc, 'webp');
}

/**
 * Image/Video to Sticker
 */
async function sticker3(img, url, packname, author) {
  url = url ? url : await uploadFile(img);
  const { default: fetch } = await import('node-fetch');
  let res = await fetch('https://api.xteam.xyz/sticker/wm?' + new URLSearchParams(Object.entries({
    url,
    packname,
    author
  })).toString());
  return await res.buffer();
}

/**
 * Image to Sticker
 */
async function sticker4(img, url) {
  if (url) {
    const { default: fetch } = await import('node-fetch');
    let res = await fetch(url);
    if (res.status !== 200) throw await res.text();
    img = await res.buffer();
  }
  return await ffmpeg(img, [
    '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1'
  ], 'jpeg', 'webp');
}

async function sticker5(img, url, packname, author, categories = ['']) {
  const WSF = require('wa-sticker-formatter');
  const stickerMetadata = {
    type: 'full',
    pack: packname,
    author,
    categories,
  };
  return await new WSF.Sticker(img ? img : url, stickerMetadata).build();
}

/**
 * Add WhatsApp JSON Exif Metadata
 */
async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
  const webp = require('node-webpmux'); // Fitur opsional tetap aman diload di sini
  const img = new webp.Image();
  const stickerPackId = crypto.randomBytes(32).toString('hex');
  const json = { 'sticker-pack-id': stickerPackId, 'sticker-pack-name': packname, 'sticker-pack-publisher': author, 'emojis': categories, ...extra };
  let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  let exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);
  await img.loadBuffer(webpSticker);
  img.exif = exif;
  return await img.saveBuffer();
}

const sticker = async (img, url, ...args) => {
  let lastError;
  for (let func of [
    typeof sticker3 !== 'undefined' ? sticker3 : null,
    global?.support?.ffmpeg && global?.support?.ffmpegWebp && (typeof sticker4 !== 'undefined' ? sticker4 : null),
    global?.support?.ffmpeg && (global?.support?.convert || global?.support?.magick || global?.support?.gm) && (typeof sticker2 !== 'undefined' ? sticker2 : null),
    typeof sticker1 !== 'undefined' ? sticker1 : null
  ].filter(f => f)) {
    try {
      let stiker = await func(img, url, ...args);
      if (stiker.includes('WEBP')) {
        try {
          return await addExif(stiker, ...args);
        } catch (e) {
          return stiker;
        }
      }
      if (stiker.includes('html')) continue;
      throw stiker.toString();
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError;
};

// Export sesuai format CommonJS
module.exports = {
  sticker,
  sticker1,
  sticker2,
  sticker3,
  sticker4,
  sticker5,
  addExif
};