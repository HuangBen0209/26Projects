const fs = require('fs');
const path = require('path');

const size = 256;
const png = createSimplePNG(size);

fs.writeFileSync(path.join(__dirname, '../public/icon.png'), png);
console.log('Icon created at public/icon.png');

function createSimplePNG(size) {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length);
    
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc32(crcData));
    
    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0);
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      
      let r, g, b;
      
      if (dist < size * 0.4) {
        r = 99; g = 102; b = 241;
      } else if (dist < size * 0.45) {
        r = 139; g = 92; b = 246;
      } else {
        r = 15; g = 23; b = 42;
      }
      
      rawData.push(r, g, b);
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([PNG_SIGNATURE, ihdrChunk, idatChunk, iendChunk]);
}
