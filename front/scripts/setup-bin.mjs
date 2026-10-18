// Качает свежий yt-dlp под целевую платформу в resources/bin и сверяет SHA256.
// Использование: node scripts/setup-bin.mjs [platform] [arch]
// По умолчанию — платформа, на которой запущено (так и работает CI).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const platform = process.argv[2] || process.platform;
const arch = process.argv[3] || process.arch;

function assetName() {
  if (platform === 'win32') return arch === 'arm64' ? 'yt-dlp_arm64.exe' : 'yt-dlp.exe';
  if (platform === 'darwin') return 'yt-dlp_macos';
  return arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
}

const BASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/';
const binDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'resources', 'bin');
const target = path.join(binDir, platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res;
}

const name = assetName();
console.log(`yt-dlp: ${name} -> ${target}`);

const sums = await (await get(BASE + 'SHA2-256SUMS')).text();
const expected = sums.split('\n').map((l) => l.trim().split(/\s+/)).find(([, f]) => f === name)?.[0];
if (!expected) throw new Error(`Нет контрольной суммы для ${name}`);

const data = Buffer.from(await (await get(BASE + name)).arrayBuffer());
const actual = crypto.createHash('sha256').update(data).digest('hex');
if (actual !== expected) throw new Error(`SHA256 не совпал: ${actual} != ${expected}`);

// В папке должен остаться бинарник только целевой платформы.
fs.mkdirSync(binDir, { recursive: true });
for (const old of ['yt-dlp', 'yt-dlp.exe']) fs.rmSync(path.join(binDir, old), { force: true });
fs.writeFileSync(target, data, { mode: 0o755 });

if (platform === process.platform) {
  console.log('Версия:', execFileSync(target, ['--version']).toString().trim());
}
