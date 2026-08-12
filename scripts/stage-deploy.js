// wrangler pages deploy uploads everything in the given directory as-is (it
// does not respect .gitignore for Pages projects), so server.js, package.json,
// wrangler.toml, scripts/ and content/ would otherwise be served as public
// static files. This stages a .deploy/ directory containing only what's meant
// to be public, which is what gets deployed instead of the repo root.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, '.deploy');

const EXCLUDE = new Set([
  'server.js', 'package.json', 'package-lock.json', 'wrangler.toml',
  '.gitignore', '.assetsignore', '.env', '.env.example', 'README.md',
  '_serve.ps1', '.git', '.github', 'node_modules', 'scripts', 'content',
  '.deploy', '.wrangler'
]);

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (srcDir === root && EXCLUDE.has(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
copyDir(root, dest);
console.log(`Staged public deploy directory at ${dest}`);
