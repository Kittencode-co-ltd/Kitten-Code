/**
 * generate-portfolio-manifest.js
 * 
 * Scans each Port-* folder inside assets/img/portfolio/ and writes a files.json
 * manifest listing all image files. Run this whenever you add/remove images:
 *   node generate-portfolio-manifest.js
 */

const fs = require('fs');
const path = require('path');

const PORTFOLIO_DIR = path.join(__dirname, 'assets', 'img', 'portfolio');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

// Get all Port-* subdirectories
const folders = fs.readdirSync(PORTFOLIO_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.startsWith('Port-'))
  .map(d => d.name);

folders.forEach(folder => {
  const folderPath = path.join(PORTFOLIO_DIR, folder);
  const files = fs.readdirSync(folderPath)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const manifestPath = path.join(folderPath, 'files.json');
  fs.writeFileSync(manifestPath, JSON.stringify(files, null, 2), 'utf8');
  console.log(`✅ ${folder}/files.json → ${files.length} images`);
});

console.log('\nDone! All portfolio manifests updated.');
