const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || 'public/frames';
const quality = parseInt(process.argv[3] || '80', 10);

async function run() {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort();
  
  if (files.length === 0) {
    console.log('NO_PNG_FOUND');
    return;
  }

  let totalSize = 0;
  for (const png of files) {
    const pngPath = path.join(dir, png);
    const webpPath = path.join(dir, png.replace('.png', '.webp'));
    await sharp(pngPath).webp({ quality }).toFile(webpPath);
    totalSize += fs.statSync(webpPath).size;
    fs.unlinkSync(pngPath);
  }

  console.log('CONVERTED:' + files.length + ':' + totalSize);
}

run().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
