import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, colorRgb) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data: height scanlines, each line starts with filter byte 0, followed by width * 4 bytes
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Inner circle with gradient
        const t = dist / radius;
        rawData[pxOffset + 0] = Math.round(colorRgb[0] * (1 - t * 0.3));
        rawData[pxOffset + 1] = Math.round(colorRgb[1] * (1 - t * 0.2));
        rawData[pxOffset + 2] = Math.round(colorRgb[2] * (1 - t * 0.1));
        rawData[pxOffset + 3] = 255;
      } else {
        // Background dark slate
        rawData[pxOffset + 0] = 15;
        rawData[pxOffset + 1] = 23;
        rawData[pxOffset + 2] = 42;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);

  const crcTarget = Buffer.concat([Buffer.from(type), data]);
  const crc = crc32(crcTarget);
  buf.writeUInt32BE(crc, 8 + len);

  return buf;
}

// CRC-32 table
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
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve('public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write 192x192 and 512x512 icons
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, [16, 185, 129]));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, [16, 185, 129]));
fs.writeFileSync(path.resolve('public', 'apple-touch-icon.png'), createPng(180, 180, [16, 185, 129]));

console.log('Generated PWA PNG icons successfully in public/icons/');
