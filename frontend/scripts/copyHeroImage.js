/**
 * Run this once to copy the hero image into the public folder:
 *   node scripts/copyHeroImage.js
 */
const fs = require('fs')
const path = require('path')

const src = path.join(
  process.env.APPDATA || process.env.USERPROFILE,
  '.gemini', 'antigravity-ide', 'brain',
  'b3e36575-3e94-4cfa-b91b-5e6406aecf93',
  'hero_xray_mockup_1789067747427.jpg'
)

const dest = path.join(__dirname, '..', 'public', 'hero_mockup.jpg')

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  console.log('✅ Hero image copied to public/hero_mockup.jpg')
} else {
  console.error('❌ Source image not found at:', src)
  console.log('Tip: Re-generate the image or place any hero.jpg in frontend/public/ as hero_mockup.jpg')
}
