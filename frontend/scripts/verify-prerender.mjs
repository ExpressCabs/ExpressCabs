import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');

const requiredFiles = [
  'index.html',
  path.join('airport-taxi-melbourne', 'index.html'),
  path.join('airport-transfer', 'melbourne', 'index.html'),
  path.join('contact', 'index.html'),
  path.join('services', 'index.html'),
  path.join('airport-transfer', 'melbourne', 'croydon', 'index.html'),
];

async function exists(relativePath) {
  try {
    await fs.access(path.join(distDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function verify() {
  const missing = [];

  for (const file of requiredFiles) {
    if (!(await exists(file))) {
      missing.push(file);
    }
  }

  if (missing.length) {
    throw new Error(`Missing prerender output: ${missing.join(', ')}`);
  }

  console.log(`[prerender] Verified ${requiredFiles.length} required route files.`);
}

verify().catch((error) => {
  console.error('[prerender] Verification failed:', error.message);
  process.exitCode = 1;
});
