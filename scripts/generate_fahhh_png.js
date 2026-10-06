import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Define CTF Flag and 3-Loop Hex Chain
const finalFlag = 'sctf{f4hhh_th3_thr33_l00p_m3m3_st3g0}';
const hexLoop1 = Buffer.from(finalFlag, 'utf-8').toString('hex');
const hexLoop2 = Buffer.from(hexLoop1, 'utf-8').toString('hex');
const hexLoop3 = Buffer.from(hexLoop2, 'utf-8').toString('hex');
const payload = 'FAHH_STEGO:' + hexLoop3;

console.log('[Stego Generator] Target Flag:', finalFlag);
console.log('[Stego Generator] Hex Loop 1 (len):', hexLoop1.length);
console.log('[Stego Generator] Hex Loop 2 (len):', hexLoop2.length);
console.log('[Stego Generator] Hex Loop 3 (len):', hexLoop3.length);
console.log('[Stego Generator] Full Payload (len):', payload.length);

const width = 960;
const height = 640;
const png = new PNG({ width, height });

// Simple raster drawing helpers
function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function getPixel(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return [0, 0, 0, 0];
  const idx = (width * y + x) << 2;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
}

function fillRect(x0, y0, w, h, r, g, b) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(x, y, r, g, b);
    }
  }
}

// 2. Render Cyberpunk Background & Header
fillRect(0, 0, width, height, 4, 8, 18); // Dark navy cyber background

// Subtle scanline & cyber grid effect
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    let [r, g, b] = getPixel(x, y);
    if (y % 4 === 0) {
      r = Math.max(0, r - 3);
      g = Math.max(0, g - 3);
      b = Math.max(0, b - 3);
    }
    if (x % 40 === 0 || y % 40 === 0) {
      r = Math.min(255, r + 5);
      g = Math.min(255, g + 8);
      b = Math.min(255, b + 14);
    }
    setPixel(x, y, r, g, b);
  }
}

// Meme Frame Boundaries (center)
const memeX = 140;
const memeY = 90;
const memeW = 680;
const memeH = 430;

// Outer cyber glow border around meme
for (let thickness = 0; thickness < 3; thickness++) {
  const c = thickness === 0 ? [6, 182, 212] : [14, 116, 144];
  for (let x = memeX - thickness - 1; x < memeX + memeW + thickness + 1; x++) {
    setPixel(x, memeY - thickness - 1, c[0], c[1], c[2]);
    setPixel(x, memeY + memeH + thickness, c[0], c[1], c[2]);
  }
  for (let y = memeY - thickness - 1; y < memeY + memeH + thickness + 1; y++) {
    setPixel(memeX - thickness - 1, y, c[0], c[1], c[2]);
    setPixel(memeX + memeW + thickness, y, c[0], c[1], c[2]);
  }
}

// Draw Meme Scene inside frame
for (let y = memeY; y < memeY + memeH; y++) {
  for (let x = memeX; x < memeX + memeW; x++) {
    const nx = (x - memeX) / memeW; // 0..1
    const ny = (y - memeY) / memeH; // 0..1

    // Background gradient: blurred outdoor daylight with onlookers
    let r = 70 + Math.floor(ny * 40 + Math.sin(nx * 4) * 20);
    let g = 85 + Math.floor(ny * 50 + Math.cos(nx * 3) * 15);
    let b = 75 + Math.floor(ny * 35);

    // Vignette corners
    const distToCenter = Math.hypot(nx - 0.5, ny - 0.5);
    r = Math.floor(r * (1 - distToCenter * 0.4));
    g = Math.floor(g * (1 - distToCenter * 0.4));
    b = Math.floor(b * (1 - distToCenter * 0.4));

    // Salman Khan Figure Silhouette & Face
    const cx = 0.5; // horizontal center of character
    const cy = 0.48; // vertical center of screaming head
    const dx = nx - cx;
    const dy = ny - cy;

    // Head oval (tilted back)
    const headRadiusX = 0.17;
    const headRadiusY = 0.22;
    const inHead = (dx * dx) / (headRadiusX * headRadiusX) + (dy * dy) / (headRadiusY * headRadiusY) < 1.0;

    // Neck and shoulders
    const inNeck = Math.abs(dx) < 0.11 && ny > cy + 0.15 && ny < cy + 0.38;
    const inShoulders = ny >= cy + 0.32 && Math.abs(dx) < 0.38 * (1 + (ny - (cy + 0.32)) * 1.5);

    if (inHead || inNeck) {
      // Skin tones (sunlit olive Indian complexion)
      const light = 1.0 - (dy * 0.6) + (dx * 0.2);
      r = Math.min(255, Math.floor(190 * light));
      g = Math.min(255, Math.floor(145 * light));
      b = Math.min(255, Math.floor(115 * light));

      // Forehead wrinkles / muscle strain lines
      if (dy < -0.1 && dy > -0.16 && Math.abs(dx) < 0.1) {
        if (Math.sin(dy * 150) > 0.4) {
          r = Math.floor(r * 0.85);
          g = Math.floor(g * 0.85);
          b = Math.floor(b * 0.85);
        }
      }

      // Clenched shut eyes & eyebrows
      if (dy > -0.09 && dy < -0.04 && Math.abs(dx) < 0.13) {
        if (Math.abs(dx - 0.05) < 0.03 || Math.abs(dx + 0.05) < 0.03) {
          r = Math.floor(r * 0.5);
          g = Math.floor(g * 0.4);
          b = Math.floor(b * 0.35);
        }
      }

      // Screaming Wide-Open Mouth (dark cavern + teeth)
      const mouthY = dy - 0.08;
      const mouthRadiusX = 0.07;
      const mouthRadiusY = 0.08;
      if ((dx * dx) / (mouthRadiusX * mouthRadiusX) + (mouthY * mouthY) / (mouthRadiusY * mouthRadiusY) < 1.0) {
        // Upper and lower teeth rows
        if (mouthY > -0.07 && mouthY < -0.04 && Math.abs(dx) < 0.05) {
          r = 230; g = 225; b = 215; // Upper teeth
        } else if (mouthY > 0.04 && mouthY < 0.07 && Math.abs(dx) < 0.04) {
          r = 220; g = 215; b = 205; // Lower teeth
        } else if (mouthY > 0.01 && mouthY < 0.05 && Math.abs(dx) < 0.045) {
          r = 160; g = 60; b = 65; // Red tongue
        } else {
          r = 45; g = 18; b = 20; // Deep mouth cavity
        }
      }

      // Short black hair on top and sides
      if (dy < -0.12 || (Math.abs(dx) > 0.12 && dy < 0.05)) {
        r = Math.floor(r * 0.25);
        g = Math.floor(g * 0.25);
        b = Math.floor(b * 0.28);
      }
    } else if (inShoulders) {
      // Shirt / uniform (light blue / white collar with dark vest)
      if (Math.abs(dx) < 0.16) {
        r = 210; g = 220; b = 235; // Light blue-white collar
      } else {
        r = 45; g = 55; b = 75; // Navy/dark vest
      }
    }

    setPixel(x, y, r, g, b);
  }
}

// Draw Blocky Font Meme Text ("Fa HHH" and "Fahhh")
// Simple 7x9 bitmap font drawer with thick black outline
const FONT = {
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  a: [' ### ', '    #', ' ####', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  h: ['#    ', '#    ', '#### ', '#   #', '#   #'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

function drawChar(ch, startX, startY, scale = 8, color = [255, 255, 255], outlineColor = [0, 0, 0]) {
  const map = FONT[ch] || FONT[' '];
  // 1. Draw outline pass (radius = 3)
  for (let r = 1; r <= 3; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let row = 0; row < map.length; row++) {
          const line = map[row];
          for (let col = 0; col < line.length; col++) {
            if (line[col] === '#') {
              fillRect(
                startX + col * scale + dx,
                startY + row * scale + dy,
                scale,
                scale,
                outlineColor[0],
                outlineColor[1],
                outlineColor[2]
              );
            }
          }
        }
      }
    }
  }

  // 2. Draw fill pass
  for (let row = 0; row < map.length; row++) {
    const line = map[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === '#') {
        fillRect(
          startX + col * scale,
          startY + row * scale,
          scale,
          scale,
          color[0],
          color[1],
          color[2]
        );
      }
    }
  }
}

function drawMemeString(text, x, y, scale = 8) {
  let curX = x;
  for (const ch of text) {
    drawChar(ch, curX, y, scale);
    curX += (FONT[ch] ? FONT[ch][0].length : 5) * scale + scale;
  }
}

// Draw Top Meme Text: "Fa" on left, "HHH" on right
drawMemeString('Fa', memeX + 45, memeY + 35, 9);
drawMemeString('HHH', memeX + memeW - 225, memeY + 35, 9);

// Draw Bottom Meme Text: "Fahhh" centered
drawMemeString('Fahhh', memeX + Math.floor(memeW / 2) - 130, memeY + memeH - 75, 7);

// 3. EMBED STEGANOGRAPHY PAYLOAD INTO RGB LSB
// Append 4 zero bytes so extraction detects clean null-terminator
const payloadBuffer = Buffer.concat([Buffer.from(payload, 'utf8'), Buffer.from([0, 0, 0, 0])]);
const bitList = [];
for (let i = 0; i < payloadBuffer.length; i++) {
  const byte = payloadBuffer[i];
  for (let b = 7; b >= 0; b--) {
    bitList.push((byte >> b) & 1); // MSB first
  }
}

console.log(`[Stego Generator] Embedding ${bitList.length} bits (${payloadBuffer.length} bytes) into RGB LSB...`);

// Embed into RGB LSB starting from pixel (0, 0)
for (let i = 0; i < bitList.length; i++) {
  const pixelIndex = Math.floor(i / 3);
  const channel = i % 3; // 0=R, 1=G, 2=B
  const px = pixelIndex % width;
  const py = Math.floor(pixelIndex / width);
  const idx = (width * py + px) * 4 + channel;

  png.data[idx] = (png.data[idx] & ~1) | bitList[i];
}

// 4. VERIFY STEGANOGRAPHY EXTRACTION IMMEDIATELY
const testBits = [];
for (let i = 0; i < bitList.length; i++) {
  const pixelIndex = Math.floor(i / 3);
  const channel = i % 3;
  const px = pixelIndex % width;
  const py = Math.floor(pixelIndex / width);
  const idx = (width * py + px) * 4 + channel;
  testBits.push(png.data[idx] & 1);
}

const testBytes = [];
for (let i = 0; i < testBits.length; i += 8) {
  let val = 0;
  for (let b = 0; b < 8; b++) {
    val = (val << 1) | testBits[i + b];
  }
  if (val === 0) break;
  testBytes.push(val);
}

const recoveredPayload = Buffer.from(testBytes).toString('utf8');
if (recoveredPayload !== payload) {
  throw new Error('[Stego Generator] Verification failed! Extracted payload did not match.');
}

// Verify 3-loop decoding chain on recovered data:
const rawHex3 = recoveredPayload.replace('FAHH_STEGO:', '');
const dec1 = Buffer.from(rawHex3, 'hex').toString('utf8');
const dec2 = Buffer.from(dec1, 'hex').toString('utf8');
const dec3 = Buffer.from(dec2, 'hex').toString('utf8');

if (dec3 !== finalFlag) {
  throw new Error('[Stego Generator] 3-Loop decode verification failed! Result: ' + dec3);
}

console.log('[Stego Generator] PASS! 3-Loop Decode Output: ' + dec3);

// 5. Save PNG to public and dist
const outPathPublic = path.resolve(__dirname, '../public/fahhh_three_loop_ctf.png');
const outBuffer = PNG.sync.write(png);

fs.writeFileSync(outPathPublic, outBuffer);
console.log(`[Stego Generator] Saved lossless PNG to ${outPathPublic} (${outBuffer.length} bytes)`);

// Also save to dist if dist exists
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  const outPathDist = path.resolve(distDir, 'fahhh_three_loop_ctf.png');
  fs.writeFileSync(outPathDist, outBuffer);
  console.log(`[Stego Generator] Saved copy to ${outPathDist}`);
}
