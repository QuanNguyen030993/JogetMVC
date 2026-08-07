import { renameSync, existsSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../wwwroot/dist');

const sourceHtml = path.join(distDir, 'index.html');
const targetHtml = path.join(distDir, 'indexbizfom.html');

if (existsSync(sourceHtml)) {
  if (existsSync(targetHtml)) {
    rmSync(targetHtml);
  }
  renameSync(sourceHtml, targetHtml);
  console.log(`Renamed index.html to indexbizfom.html in ${distDir}`);
} else {
  console.log(`index.html not found in ${distDir}`);
}
