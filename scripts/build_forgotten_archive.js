import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== BUILDING "THE FORGOTTEN ARCHIVE" CTF CHALLENGE ===');

// 1. Target Flag & 3-Step Hex Encoding Chain
const finalFlag = 'sctf{forgotten_archive_lsb}';
const step1Hex = Buffer.from(finalFlag, 'utf-8').toString('hex');
const step2Hex = Buffer.from(step1Hex, 'utf-8').toString('hex');
const step3Hex = Buffer.from(step2Hex, 'utf-8').toString('hex');

const hiddenText = 'FA14_PAYLOAD:' + step3Hex;

// 4-byte header 'FA14' + 4-byte big-endian payload length + hidden text + null terminator
const magicHeader = Buffer.from('FA14', 'utf-8');
const lenBuffer = Buffer.alloc(4);
lenBuffer.writeUInt32BE(Buffer.byteLength(hiddenText, 'utf-8'), 0);
const textBuffer = Buffer.from(hiddenText, 'utf-8');
const terminator = Buffer.from([0, 0, 0, 0]);

const stegoPayload = Buffer.concat([magicHeader, lenBuffer, textBuffer, terminator]);

console.log('Final Target Flag:', finalFlag);
console.log('Step 1 Hex (len):', step1Hex.length);
console.log('Step 2 Hex (len):', step2Hex.length);
console.log('Step 3 Hex (len):', step3Hex.length);
console.log('Hidden Text Prefix:', hiddenText.slice(0, 20) + '...');
console.log('Total Stego Payload Bytes:', stegoPayload.length);

// 2. Generate archive_fragment.png (800x600 normal workstation backup schematic)
const width = 800;
const height = 600;
const png = new PNG({ width, height });

// Fill background with realistic dark slate workstation console / system monitor tones
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    
    // Subtle gradient & grid lines resembling a legacy monitoring workstation
    const isGrid = (x % 50 === 0 || y % 50 === 0);
    const grad = Math.floor((y / height) * 25);
    
    let r = 24 + grad;
    let g = 32 + grad;
    let b = 44 + grad;

    if (isGrid) {
      r += 8;
      g += 10;
      b += 14;
    }

    // Top title bar area (legacy OS window header)
    if (y < 40) {
      r = 30;
      g = 55;
      b = 85;
    } else if (y === 40) {
      r = 70;
      g = 120;
      b = 180;
    }

    // Draw some schematic blocks (server racks, storage arrays, network switches)
    // Server Rack 1: (80, 80) to (240, 480)
    if (x >= 80 && x <= 240 && y >= 80 && y <= 480) {
      const rackY = (y - 80) % 30;
      if (rackY === 0 || rackY === 1) {
        r = 15; g = 20; b = 28;
      } else {
        r = 45; g = 52; b = 64;
        if (x >= 95 && x <= 110 && rackY >= 10 && rackY <= 20) {
          // Green activity LED
          r = 34; g = 197; b = 94;
        } else if (x >= 120 && x <= 135 && rackY >= 10 && rackY <= 20) {
          // Amber storage LED
          r = 234; g = 179; b = 8;
        }
      }
    }

    // Server Rack 2 (Backup SAN): (300, 80) to (460, 480)
    if (x >= 300 && x <= 460 && y >= 80 && y <= 480) {
      const rackY = (y - 80) % 25;
      if (rackY === 0 || rackY === 1) {
        r = 15; g = 20; b = 28;
      } else {
        r = 40; g = 48; b = 60;
        if (x >= 315 && x <= 330 && rackY >= 8 && rackY <= 16) {
          r = 6; g = 182; b = 212; // Cyan fiber LED
        }
      }
    }

    // Console / Terminal Output Box: (520, 80) to (740, 320)
    if (x >= 520 && x <= 740 && y >= 80 && y <= 320) {
      r = 12; g = 16; b = 22;
      // Border
      if (x === 520 || x === 740 || y === 80 || y === 320) {
        r = 60; g = 90; b = 130;
      }
    }

    // Status Meter Box: (520, 360) to (740, 480)
    if (x >= 520 && x <= 740 && y >= 360 && y <= 480) {
      r = 18; g = 24; b = 34;
      if (x === 520 || x === 740 || y === 360 || y === 480) {
        r = 60; g = 90; b = 130;
      }
    }

    // Bottom footer telemetry strip
    if (y > 540) {
      r = 18; g = 22; b = 30;
      if (y === 541) {
        r = 50; g = 70; b = 100;
      }
    }

    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = 255;
  }
}

// 3. Embed RGB LSB Steganography
// Bits extracted sequentially: R, G, B channels, MSB to LSB
const bitList = [];
for (let i = 0; i < stegoPayload.length; i++) {
  const byte = stegoPayload[i];
  for (let b = 7; b >= 0; b--) {
    bitList.push((byte >> b) & 1);
  }
}

console.log(`Embedding ${bitList.length} bits into pixel RGB LSBs...`);

for (let i = 0; i < bitList.length; i++) {
  const pixelIndex = Math.floor(i / 3);
  const channel = i % 3; // 0=R, 1=G, 2=B
  const px = pixelIndex % width;
  const py = Math.floor(pixelIndex / width);
  const idx = (py * width + px) * 4 + channel;

  png.data[idx] = (png.data[idx] & ~1) | bitList[i];
}

const pngBuffer = PNG.sync.write(png, { filterType: 0 });
console.log(`Rendered archive_fragment.png (${pngBuffer.length} bytes)`);

// 4. Verify Steganography Extraction Directly on the Generated PNG Buffer
const testPng = PNG.sync.read(pngBuffer);
const extractedBits = [];
// Extract first bitList.length bits
for (let i = 0; i < bitList.length; i++) {
  const pixelIndex = Math.floor(i / 3);
  const channel = i % 3;
  const px = pixelIndex % testPng.width;
  const py = Math.floor(pixelIndex / testPng.width);
  const idx = (py * testPng.width + px) * 4 + channel;
  extractedBits.push(testPng.data[idx] & 1);
}

const extractedBytes = [];
for (let i = 0; i < extractedBits.length; i += 8) {
  let val = 0;
  for (let b = 0; b < 8; b++) {
    val = (val << 1) | extractedBits[i + b];
  }
  extractedBytes.push(val);
}

const extractedBuffer = Buffer.from(extractedBytes);
const extractedMagic = extractedBuffer.slice(0, 4).toString('utf-8');
const extractedLen = extractedBuffer.readUInt32BE(4);
const extractedHidden = extractedBuffer.slice(8, 8 + extractedLen).toString('utf-8');

console.log('Verifying LSB Extraction:');
console.log('  Magic:', extractedMagic, '=== FA14 ?', extractedMagic === 'FA14');
console.log('  Length:', extractedLen);
console.log('  Payload Header:', extractedHidden.slice(0, 13), '=== FA14_PAYLOAD: ?', extractedHidden.startsWith('FA14_PAYLOAD:'));

if (extractedMagic !== 'FA14' || !extractedHidden.startsWith('FA14_PAYLOAD:')) {
  throw new Error('LSB verification failed!');
}

// 3-Loop Hex Decode Verification
const hexChain = extractedHidden.slice('FA14_PAYLOAD:'.length);
const loop1 = Buffer.from(hexChain, 'hex').toString('utf-8');
const loop2 = Buffer.from(loop1, 'hex').toString('utf-8');
const loop3 = Buffer.from(loop2, 'hex').toString('utf-8');

console.log('  Decoded Hex Loop 1 (len):', loop1.length);
console.log('  Decoded Hex Loop 2 (len):', loop2.length);
console.log('  Decoded Hex Loop 3 (Recovered Flag):', loop3);

if (loop3 !== finalFlag) {
  throw new Error('Recovered flag does not match target!');
}
console.log('STEGO EXTRACTION & 3-LOOP DECODE VERIFIED 100%!');

// 5. Generate Other Realistic Archive Files
const readmeContent = `FORGOTTEN ARCHIVE

Backup recovered from an old workstation.

Most files are routine.
One artifact may be worth closer inspection.
`;

const manifestContent = `backup_01.txt
notes.txt
archive_fragment.png
thumbs.db
`;

const backup01Content = `Nightly backup completed successfully.
No integrity warnings were reported.
`;

const notesContent = `Remember to archive old project material before cleanup.
`;

// Synthesize authentic Windows OLE compound document header for thumbs.db
const thumbsBuffer = Buffer.alloc(1024);
// OLE2 magic signature: D0 CF 11 E0 A1 B1 1A E1
thumbsBuffer[0] = 0xd0;
thumbsBuffer[1] = 0xcf;
thumbsBuffer[2] = 0x11;
thumbsBuffer[3] = 0xe0;
thumbsBuffer[4] = 0xa1;
thumbsBuffer[5] = 0xb1;
thumbsBuffer[6] = 0x1a;
thumbsBuffer[7] = 0xe1;
// Windows Shell thumbnail cache record metadata tags
const thumbsTag = Buffer.from('Catalog\x00Thumbnail Cache Storage\x002018-04-12T03:14:07Z', 'ascii');
thumbsTag.copy(thumbsBuffer, 16);

// 6. Build the ZIP archive: the_forgotten_archive.zip using JSZip
const zip = new JSZip();
const oldDate = new Date('2018-04-12T03:14:07.000Z');

zip.file('README.txt', readmeContent, { date: oldDate });
zip.file('manifest.txt', manifestContent, { date: oldDate });
zip.file('backup_01.txt', backup01Content, { date: oldDate });
zip.file('notes.txt', notesContent, { date: oldDate });
zip.file('thumbs.db', thumbsBuffer, { date: oldDate });
zip.file('archive_fragment.png', pngBuffer, { date: oldDate });

const zipBuffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 }
});

console.log(`Generated the_forgotten_archive.zip (${zipBuffer.length} bytes)`);

// 7. Save outputs to public and dist
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const zipOutPath = path.resolve(publicDir, 'the_forgotten_archive.zip');
fs.writeFileSync(zipOutPath, zipBuffer);
console.log(`Wrote ${zipOutPath}`);

const pngOutPath = path.resolve(publicDir, 'archive_fragment.png');
fs.writeFileSync(pngOutPath, pngBuffer);
console.log(`Wrote ${pngOutPath}`);

const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.resolve(distDir, 'the_forgotten_archive.zip'), zipBuffer);
  fs.writeFileSync(path.resolve(distDir, 'archive_fragment.png'), pngBuffer);
  console.log(`Copied assets to dist`);
}

// 8. Test unpacking the ZIP archive to verify integrity
const verifyZip = await JSZip.loadAsync(zipBuffer);
const zipFiles = Object.keys(verifyZip.files);
console.log('Verifying ZIP Archive Contents:');
console.log(zipFiles);

const extractedPngBuf = await verifyZip.file('archive_fragment.png').async('nodebuffer');
console.log('Unpacked PNG matches source:', extractedPngBuf.equals(pngBuffer));

console.log('=== BUILD COMPLETE AND VERIFIED ===');
