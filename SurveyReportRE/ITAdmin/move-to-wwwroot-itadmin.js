import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.resolve(__dirname, '../wwwroot/ITAdmin/dist');
const wwwroot = path.resolve(__dirname, '../wwwroot');
const hostConfigPath = path.resolve(__dirname, '../host.json');

const normalizeHost = (value) => String(value || '').trim().replace(/\/+$/, '');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceDeployHost = () => {
  if (!existsSync(hostConfigPath) || !existsSync(tempDir)) return;

  const appsettings = JSON.parse(readFileSync(hostConfigPath, 'utf8'));
  const localHost = normalizeHost(appsettings?.UrlConfig?.Host);
  const deployHost = normalizeHost(
    process.env.HOST_DEPLOY
      || process.env.DEPLOY_HOST
      || process.env.VITE_HOST_DEPLOY
      || appsettings?.UrlConfig?.HostDeploy
      || appsettings?.UrlConfig?.DeployHost,
  );

  if (!deployHost) {
    console.log('HostDeploy is not configured; localhost replacement skipped.');
    return;
  }
  if (!localHost || !/localhost/i.test(localHost)) {
    console.log(`UrlConfig.Host does not contain localhost; replacement skipped (${localHost || 'empty Host'}).`);
    return;
  }

  const hostPattern = new RegExp(escapeRegExp(localHost), 'gi');
  const textExtensions = new Set(['.html', '.js', '.css', '.json', '.map', '.txt']);
  let changedFiles = 0;
  let replacementCount = 0;

  const replaceInPath = (targetPath) => {
    const stat = statSync(targetPath);
    if (stat.isDirectory()) {
      readdirSync(targetPath).forEach((name) => replaceInPath(path.join(targetPath, name)));
      return;
    }
    if (!textExtensions.has(path.extname(targetPath).toLowerCase())) return;

    const content = readFileSync(targetPath, 'utf8');
    let matches = 0;
    const nextContent = content.replace(hostPattern, () => {
      matches += 1;
      return deployHost;
    });
    if (!matches) return;

    writeFileSync(targetPath, nextContent, 'utf8');
    changedFiles += 1;
    replacementCount += matches;
  };

  replaceInPath(tempDir);
  console.log(`Replaced ${replacementCount} localhost host value(s) in ${changedFiles} file(s): ${localHost} -> ${deployHost}`);
};

replaceDeployHost();

// Xóa assets cũ trong wwwroot (nếu có)
const targetAssets = path.join(wwwroot, 'assets');
if (existsSync(targetAssets)) {
  rmSync(targetAssets, { recursive: true, force: true });
}

// Move thư mục assets từ build-temp sang wwwroot/assets
renameSync(path.join(tempDir, 'assets'), targetAssets);

// Copy index.html vào wwwroot (move luôn cũng được, dùng renameSync)
// copyFileSync(path.join(tempDir, 'index.html'), path.join(wwwroot, 'index.html'));

// Xóa folder tạm sau khi đã move xong
// rmSync(tempDir, { recursive: true, force: true });
