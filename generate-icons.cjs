const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePNG(width, height, drawFn) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Icon drawer: Kinoma glowing ring + K letterform
function drawKinomaIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Dark deep charcoal/violet (#0b0c12 -> #13141f)
  const bgGrad = (y / h) * 0.15;
  let r = Math.round(11 + bgGrad * 10);
  let g = Math.round(12 + bgGrad * 10);
  let b = Math.round(18 + bgGrad * 18);
  let a = 255;

  // Maskable mode has safe margin (80% circle)
  const scale = isMaskable ? 0.72 : 0.88;
  const ringRadius = (w * 0.38) * scale;
  const ringWidth = (w * 0.055) * scale;

  // Ring glow
  const ringDist = Math.abs(dist - ringRadius);
  if (ringDist < ringWidth) {
    const t = 1 - (ringDist / ringWidth);
    // Gradient from purple #c084fc to violet #9333ea
    const angle = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
    const pr = Math.round(192 * (1 - angle * 0.4));
    const pg = Math.round(132 * (1 - angle * 0.5));
    const pb = 252;
    r = Math.round(r * (1 - t) + pr * t);
    g = Math.round(g * (1 - t) + pg * t);
    b = Math.round(b * (1 - t) + pb * t);
  }

  // Draw central 'K' pillar
  const kx = dx / scale;
  const ky = dy / scale;
  const pW = w * 0.07;
  const pH = h * 0.38;

  // Left pillar of K
  if (kx >= -w * 0.16 && kx <= -w * 0.16 + pW && Math.abs(ky) <= pH / 2) {
    r = 216; g = 180; b = 254; // #d8b4fe
  }

  // Upper diagonal of K
  const d1x = kx + w * 0.12;
  const d1y = ky + h * 0.02;
  if (d1x > 0 && d1x < w * 0.22 && Math.abs(d1y + d1x * 0.9) < pW * 0.6) {
    r = 255; g = 255; b = 255; // White
  }

  // Lower diagonal of K
  const d2x = kx + w * 0.10;
  const d2y = ky - h * 0.02;
  if (d2x > 0 && d2x < w * 0.24 && Math.abs(d2y - d2x * 0.95) < pW * 0.65) {
    r = 168; g = 85; b = 247; // #a855f7
  }

  return [r, g, b, a];
}

// Draw 16:9 Android TV Leanback Banner (320x180)
function drawTVBanner(x, y, w, h) {
  // Deep dark gradient
  let r = 14, g = 15, b = 22, a = 255;
  
  // Subtle radial violet accent on the left
  const dx = x - w * 0.25;
  const dy = y - h * 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 80) {
    const t = (1 - dist / 80) * 0.4;
    r = Math.round(r * (1 - t) + 120 * t);
    g = Math.round(g * (1 - t) + 60 * t);
    b = Math.round(b * (1 - t) + 220 * t);
  }

  // Ring on left side (x ~ 80, y ~ 90)
  const ringDist = Math.abs(dist - 36);
  if (ringDist < 6) {
    const t = 1 - (ringDist / 6);
    r = Math.round(r * (1 - t) + 192 * t);
    g = Math.round(g * (1 - t) + 132 * t);
    b = Math.round(b * (1 - t) + 252 * t);
  }

  // TV badge in top right
  if (x > w - 60 && x < w - 16 && y > 14 && y < 34) {
    r = 30; g = 32; b = 46;
  }

  return [r, g, b, a];
}

const pubDir = path.join(__dirname, 'public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

// 1. 192x192 PNG
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), generatePNG(192, 192, (x, y, w, h) => drawKinomaIcon(x, y, w, h, false)));
// 2. 512x512 PNG
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), generatePNG(512, 512, (x, y, w, h) => drawKinomaIcon(x, y, w, h, false)));
// 3. 512x512 Maskable PNG
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, (x, y, w, h) => drawKinomaIcon(x, y, w, h, true)));
// 4. Apple Touch Icon (180x180)
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), generatePNG(180, 180, (x, y, w, h) => drawKinomaIcon(x, y, w, h, false)));
// 5. Favicon (48x48)
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), generatePNG(48, 48, (x, y, w, h) => drawKinomaIcon(x, y, w, h, false)));
// 6. Android TV Leanback Banner (320x180)
fs.writeFileSync(path.join(pubDir, 'tv-banner-320x180.png'), generatePNG(320, 180, (x, y, w, h) => drawTVBanner(x, y, w, h)));

console.log('Successfully generated all PWA, Apple Touch, and Android TV PNG icons!');
