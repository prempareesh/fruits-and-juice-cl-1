const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateCleanIcons() {
  const sourcePath = '/Users/preampareesh/.gemini/antigravity/brain/88a464e4-015e-4577-b96a-ebf2105e444c/media__1779109338537.png';
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source image not found at: ${sourcePath}`);
    process.exit(1);
  }

  console.log(`🔄 Processing pristine source: ${sourcePath}...`);

  try {
    // Clean up legacy/unwanted dashed files from assets to prevent AAPT caching them
    const legacyFiles = [
      'adaptive-icon.png',
      'splash-icon.png',
      'logo.jpg',
      'logo.jpeg'
    ];
    legacyFiles.forEach(file => {
      const p = path.join(__dirname, 'assets', file);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`🗑️ Deleted legacy asset: ${file}`);
      }
    });

    // 1. Read source logo
    const sourceImage = sharp(sourcePath);

    // 2. Prepare transparent logo base buffer (with trimmed solid background edges & ensured sRGB)
    const transparentLogoBuffer = await sourceImage
      .trim()
      .ensureAlpha()
      .toBuffer();

    // 3. Create pristine logo.png (Standard 1024x1024 flat app logo, clean sRGB, no metadata)
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      {
        input: await sharp(transparentLogoBuffer)
          .resize(800, 800, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png({ colors: 256, quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, 'assets', 'logo.png'));
    console.log('✅ Generated assets/logo.png');

    // 4. Create pristine icon.png (Solid white background, 1024x1024)
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      {
        input: await sharp(transparentLogoBuffer)
          .resize(800, 800, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png({ colors: 256, quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, 'assets', 'icon.png'));
    console.log('✅ Generated assets/icon.png');

    // 5. Create pristine adaptiveicon.png (Transparent background, properly padded, 1024x1024)
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
    .composite([
      {
        input: await sharp(transparentLogoBuffer)
          .resize(600, 600, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png({ colors: 256, quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, 'assets', 'adaptiveicon.png'));
    console.log('✅ Generated assets/adaptiveicon.png');

    // 6. Create pristine splash.png (Transparent background, properly scaled, 1024x1024)
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
    .composite([
      {
        input: await sharp(transparentLogoBuffer)
          .resize(512, 512, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png({ colors: 256, quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, 'assets', 'splash.png'));
    console.log('✅ Generated assets/splash.png');

    // 7. Create pristine favicon.png (48x48 web asset)
    await sharp(transparentLogoBuffer)
      .resize(48, 48, { fit: 'inside' })
      .png({ colors: 256, quality: 100, compressionLevel: 9 })
      .toFile(path.join(__dirname, 'assets', 'favicon.png'));
    console.log('✅ Generated assets/favicon.png');

    console.log('🎉 All Android-safe, lowercase, pristine icons compiled successfully!');
  } catch (error) {
    console.error('❌ Icon generation failed:', error);
  }
}

generateCleanIcons();
