import sharp from "sharp";
import fs from "fs";

// Convert 192x192 PNG to 32x32 ICO-compatible PNG data
async function createFavicon() {
  const pngBuffer = fs.readFileSync("public/icons/icon-192.png");

  // Create 32x32 PNG data for the ICO
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((size) =>
      sharp(pngBuffer).resize(size, size).png().toBuffer()
    )
  );

  // Build a multi-resolution ICO file
  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // ICO type
  header.writeUInt16LE(sizes.length, 4); // image count

  // Calculate directory entries + image data offsets
  const dirEntrySize = 16;
  const dataOffset = 6 + sizes.length * dirEntrySize;

  const chunks = [header];
  let currentOffset = dataOffset;

  const dirEntries = [];
  for (let i = 0; i < sizes.length; i++) {
    const buf = buffers[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0);  // width
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1);  // height
    entry.writeUInt8(0, 2);   // colors
    entry.writeUInt8(0, 3);   // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buf.length, 8);  // image size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += buf.length;
  }

  // Write directory entries
  for (const entry of dirEntries) {
    chunks.push(entry);
  }

  // Write image data
  for (const buf of buffers) {
    // For ICO, we need to prepend PNG with ICO-compatible BMP info
    // But modern Windows supports PNG inside ICO
    chunks.push(buf);
  }

  const icoBuffer = Buffer.concat(chunks);
  fs.writeFileSync("public/favicon.ico", icoBuffer);
  console.log(`✅ favicon.ico created (${icoBuffer.length} bytes, ${sizes.length} sizes)`);
}

createFavicon().catch(console.error);
