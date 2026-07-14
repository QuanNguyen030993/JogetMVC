import { rmSync, renameSync, existsSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.resolve(__dirname, '../wwwroot/dist');
const wwwroot = path.resolve(__dirname, '../wwwroot');

// Xóa assets cũ trong wwwroot (nếu có)
const targetAssets = path.join(wwwroot, 'assets');
if (existsSync(targetAssets)) {
  rmSync(targetAssets, { recursive: true, force: true });
}

// Move thư mục assets từ build-temp sang wwwroot/assets
renameSync(path.join(tempDir, 'assets'), targetAssets);

// Copy index.html vào wwwroot (move luôn cũng được, dùng renameSync)
copyFileSync(path.join(tempDir, 'index.html'), path.join(wwwroot, 'index.html'));

// Xóa folder tạm sau khi đã move xong
// rmSync(tempDir, { recursive: true, force: true });
