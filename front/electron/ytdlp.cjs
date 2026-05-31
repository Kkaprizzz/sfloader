'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { app } = require('electron');
const ffmpegStatic = require('ffmpeg-static');

function binDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, '..', 'resources', 'bin');
}

function ytDlpPath() {
  const bundled = path.join(binDir(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  return fs.existsSync(bundled) ? bundled : 'yt-dlp';
}

function ffmpegPath() {
  if (!ffmpegStatic) return 'ffmpeg';
  return app.isPackaged
    ? ffmpegStatic.replace('app.asar', 'app.asar.unpacked')
    : ffmpegStatic;
}

function sanitize(name) {
  return String(name || '')
    .replace(/[<>:"/\\|?*\n\r]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

function runYtDlp(args, { onStdout } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath(), args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (onStdout) onStdout(text);
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', (err) => {
      reject(new Error(`Не удалось запустить yt-dlp: ${err.message}`));
    });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `yt-dlp завершился с кодом ${code}`));
    });
  });
}

function parseInfo(info, fallbackUrl) {
  const sourceUrl = info.webpage_url || info.original_url || fallbackUrl;
  const seen = new Set();
  const formats = [];

  for (const f of info.formats || []) {
    if (!f.height || f.vcodec === 'none') continue;
    if (seen.has(f.height)) continue;
    seen.add(f.height);

    formats.push({
      quality_label: `${f.height}p`,
      height: f.height,
      format_id: `bestvideo[height=${f.height}]+bestaudio/best[height=${f.height}]/best`,
      source_url: sourceUrl,
      filesize: f.filesize || f.filesize_approx || null,
    });
  }

  formats.sort((a, b) => b.height - a.height);

  return {
    title: info.title || 'video',
    thumbnail: info.thumbnail || null,
    duration: info.duration || null,
    source: info.extractor_key || 'Unknown',
    formats,
  };
}

async function extractInfo(url) {
  if (!url || typeof url !== 'string') throw new Error('Пустая ссылка');
  const stdout = await runYtDlp(['-J', '--no-playlist', '--no-warnings', url]);
  let info;
  try {
    info = JSON.parse(stdout);
  } catch {
    throw new Error('Не удалось разобрать ответ yt-dlp');
  }
  return parseInfo(info, url);
}

async function downloadVideo({ url, formatId, filename, folder }, onProgress) {
  if (!url || !formatId || !folder) throw new Error('Недостаточно данных для загрузки');

  const safeName = sanitize(filename) || 'video';
  const outTemplate = path.join(folder, `${safeName}.%(ext)s`);

  const args = [
    '-f', formatId,
    '--no-playlist',
    '--merge-output-format', 'mp4',
    '--no-part',
    '--newline',
    '--no-warnings',
    '--ffmpeg-location', ffmpegPath(),
    '-o', outTemplate,
    url,
  ];

  await runYtDlp(args, {
    onStdout: (text) => {
      const m = text.match(/\[download\]\s+([\d.]+)%/);
      if (m && onProgress) onProgress(parseFloat(m[1]));
    },
  });

  return path.join(folder, `${safeName}.mp4`);
}

module.exports = { extractInfo, downloadVideo, ytDlpPath, ffmpegPath };
