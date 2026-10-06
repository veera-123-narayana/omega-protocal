import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Target Flag & 3-Loop Hex chain
const finalFlag = 'sctf{f4hhh_th3_thr33_l00p_m3m3_st3g0}';
const hex1 = Buffer.from(finalFlag, 'utf-8').toString('hex');
const hex2 = Buffer.from(hex1, 'utf-8').toString('hex');
const hex3 = Buffer.from(hex2, 'utf-8').toString('hex');
const payload = 'FAHH_STEGO:' + hex3;

console.log('=== FAHH // THE THREE-LOOP STEGO GENERATION ===');
console.log('Target CTF Flag:', finalFlag);
console.log('Hex Loop 1:', hex1);
console.log('Hex Loop 2:', hex2);
console.log('Hex Loop 3:', hex3);
console.log('Full Payload Prefix & Length:', payload.substring(0, 30) + '...', payload.length, 'chars');

// 2. Load the generated meme source visual
const jpgSourcePath = path.resolve(__dirname, '../src/assets/images/fahh_meme_source_1791312840186.jpg');
let width = 1000;
let height = 750;
let png = new PNG({ width, height });

if (fs.existsSync(jpgSourcePath)) {
  const jpgBuf = fs.readFileSync(jpgSourcePath);
  const rawJpg = jpeg.decode(jpgBuf, { useTArray: true });
  console.log(`Loaded source JPG (${rawJpg.width}x${rawJpg.height})`);

  // Scale and copy to PNG canvas
  const srcW = rawJpg.width;
  const srcH = rawJpg.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = Math.floor((x / width) * srcW);
      const srcY = Math.floor((y / height) * srcH);
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (y * width + x) * 4;

      png.data[dstIdx] = rawJpg.data[srcIdx];
      png.data[dstIdx + 1] = rawJpg.data[srcIdx + 1];
      png.data[dstIdx + 2] = rawJpg.data[srcIdx + 2];
      png.data[dstIdx + 3] = 255;
    }
  }
} else {
  console.warn('Source JPG not found, initializing canvas fallback');
  for (let i = 0; i < width * height * 4; i += 4) {
    png.data[i] = 10;
    png.data[i + 1] = 16;
    png.data[i + 2] = 28;
    png.data[i + 3] = 255;
  }
}

// 3. Draw bold Impact-style Meme Text overlays: "FA" (top left), "HHH" (top right), "FAHHH" (bottom)
// Bitmap glyph definitions
const GLYPHS = {
  F: [
    '######',
    '#     ',
    '##### ',
    '#     ',
    '#     ',
    '#     '
  ],
  A: [
    ' #### ',
    '#    #',
    '######',
    '#    #',
    '#    #',
    '#    #'
  ],
  H: [
    '#    #',
    '#    #',
    '######',
    '#    #',
    '#    #',
    '#    #'
  ],
  ' ': [
    '      ',
    '      ',
    '      ',
    '      ',
    '      ',
    '      '
  ]
};

function drawMemeGlyph(char, originX, originY, scale = 10) {
  const map = GLYPHS[char.toUpperCase()] || GLYPHS[' '];
  const h = map.length;
  const w = map[0].length;

  // Outline thickness
  const outlineRadius = 4;
  for (let dy = -outlineRadius; dy <= outlineRadius; dy++) {
    for (let dx = -outlineRadius; dx <= outlineRadius; dx++) {
      if (dx * dx + dy * dy > outlineRadius * outlineRadius) continue;
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          if (map[r][c] === '#') {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const px = originX + c * scale + sx + dx;
                const py = originY + r * scale + sy + dy;
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const idx = (py * width + px) * 4;
                  png.data[idx] = 0;
                  png.data[idx + 1] = 0;
                  png.data[idx + 2] = 0;
                }
              }
            }
          }
        }
      }
    }
  }

  // Inner fill (Crisp pure white)
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (map[r][c] === '#') {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = originX + c * scale + sx;
            const py = originY + r * scale + sy;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              png.data[idx] = 255;
              png.data[idx + 1] = 255;
              png.data[idx + 2] = 255;
            }
          }
        }
      }
    }
  }
}

function drawMemeWord(text, startX, startY, scale = 10) {
  let curX = startX;
  for (const ch of text) {
    drawMemeGlyph(ch, curX, startY, scale);
    curX += 7 * scale + Math.floor(scale * 0.4);
  }
}

// Draw classic Meme typography
drawMemeWord('FA', 70, 45, 12);
drawMemeWord('HHH', width - 290, 45, 12);
drawMemeWord('FAHHH', Math.floor(width / 2) - 200, height - 105, 9);

// Subtle cyber border styling around the canvas edges
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    // 3px cyan border
    if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) {
      const idx = (y * width + x) * 4;
      png.data[idx] = 6;
      png.data[idx + 1] = 182;
      png.data[idx + 2] = 212;
      png.data[idx + 3] = 255;
    }
  }
}

// 4. EMBED RGB LSB STEGANOGRAPHY PAYLOAD
// Payload format:
// FAHH_STEGO:<hex3>\0\0\0\0
const payloadBuf = Buffer.concat([Buffer.from(payload, 'utf-8'), Buffer.from([0, 0, 0, 0])]);
const bitList = [];
for (let i = 0; i < payloadBuf.length; i++) {
  const byte = payloadBuf[i];
  for (let b = 7; b >= 0; b--) {
    bitList.push((byte >> b) & 1); // MSB to LSB
  }
}

console.log(`Embedding ${bitList.length} bits (${payloadBuf.length} bytes) into RGB LSB starting at (0, 0)...`);

for (let i = 0; i < bitList.length; i++) {
  const pixelIndex = Math.floor(i / 3);
  const channel = i % 3; // 0=R, 1=G, 2=B
  const px = pixelIndex % width;
  const py = Math.floor(pixelIndex / width);
  const idx = (py * width + px) * 4 + channel;

  png.data[idx] = (png.data[idx] & ~1) | bitList[i];
}

// 5. TEST & VERIFY EXTRACTION LOGIC
const extractedBits = [];
for (let i = 0; i < bitList.length; i++) {
  const pixelIndex = Math.floor(i / 3);
  const channel = i % 3;
  const px = pixelIndex % width;
  const py = Math.floor(pixelIndex / width);
  const idx = (py * width + px) * 4 + channel;
  extractedBits.push(png.data[idx] & 1);
}

const extractedBytes = [];
for (let i = 0; i < extractedBits.length; i += 8) {
  let val = 0;
  for (let b = 0; b < 8; b++) {
    val = (val << 1) | extractedBits[i + b];
  }
  if (val === 0) break; // Null terminator reached
  extractedBytes.push(val);
}

const decodedPayload = Buffer.from(extractedBytes).toString('utf-8');
console.log('Decoded Payload Match:', decodedPayload === payload);

if (!decodedPayload.startsWith('FAHH_STEGO:')) {
  throw new Error('Prefix FAHH_STEGO: not found in decoded payload');
}

// Perform 3-Loop hex decode
const rawHexExtracted3 = decodedPayload.slice('FAHH_STEGO:'.length);
const step1 = Buffer.from(rawHexExtracted3, 'hex').toString('utf-8');
const step2 = Buffer.from(step1, 'hex').toString('utf-8');
const step3 = Buffer.from(step2, 'hex').toString('utf-8');

console.log('Hex Step 1 (len):', step1.length);
console.log('Hex Step 2 (len):', step2.length);
console.log('Hex Step 3 (Recovered Flag):', step3);

if (step3 !== finalFlag) {
  throw new Error(`Flag mismatch! Expected ${finalFlag}, got ${step3}`);
}
console.log('SUCCESS: All 3 hex loops successfully decoded to final CTF flag!');

// 6. Save final lossless PNG files
const pngBuffer = PNG.sync.write(png);

const publicPath = path.resolve(__dirname, '../public/fahhh_three_loop_ctf.png');
fs.writeFileSync(publicPath, pngBuffer);
console.log(`Wrote PNG to ${publicPath} (${pngBuffer.length} bytes)`);

const sectorPublicPath = path.resolve(__dirname, '../public/sectors/sector-14-fahh.png');
fs.mkdirSync(path.dirname(sectorPublicPath), { recursive: true });
fs.writeFileSync(sectorPublicPath, pngBuffer);
console.log(`Wrote PNG to ${sectorPublicPath}`);

const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  const distPath = path.resolve(distDir, 'fahhh_three_loop_ctf.png');
  fs.writeFileSync(distPath, pngBuffer);
  console.log(`Wrote PNG to ${distPath}`);
}

console.log('=== STEGO GENERATION COMPLETE ===');
