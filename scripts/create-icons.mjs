import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function checksum(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(checksum(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
}

mkdirSync('public/icons', { recursive: true });
for (const size of [192, 512]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const horizontal = column * 192 / size;
      const vertical = row * 192 / size;
      let color = [20, 23, 23, 255];
      const stem = horizontal >= 83 && horizontal <= 108 && vertical >= 53 && vertical <= 138;
      const flag = horizontal >= 57 && horizontal < 85 && vertical >= 75 - (horizontal - 57) * 22 / 28 && vertical <= 94 - (horizontal - 57) * 12 / 26;
      if (stem || flag) color = [255, 255, 255, 255];
      if ((horizontal - 133) ** 2 + (vertical - 127) ** 2 <= 144) color = [240, 91, 43, 255];
      const offset = row * (size * 4 + 1) + 1 + column * 4;
      pixels.set(color, offset);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const image = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(`public/icons/icon-${size}.png`, image);
}
