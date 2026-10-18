'use strict';

const { spawn, execFile } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { app } = require('electron');
const ffmpegStatic = require('ffmpeg-static');

const EXE = process.platform === 'win32' ? '.exe' : '';

function bundledDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, '..', 'resources', 'bin');
}

// Обновлённые бинарники yt-dlp лежат в папке данных: yt-dlp-<версия>,
// а current.json указывает, какой из них сейчас основной.
function updatesDir() {
  return path.join(app.getPath('userData'), 'bin');
}

function readCurrent() {
  try {
    const cur = JSON.parse(fs.readFileSync(path.join(updatesDir(), 'current.json'), 'utf8'));
    const file = path.join(updatesDir(), cur.file);
    if (cur.version && fs.existsSync(file)) return { version: cur.version, file };
  } catch {
    // нет обновлённого бинарника — работаем на встроенном
  }
  return null;
}

function ytDlpPath() {
  const updated = readCurrent();
  if (updated) return updated.file;
  const bundled = path.join(bundledDir(), `yt-dlp${EXE}`);
  return fs.existsSync(bundled) ? bundled : 'yt-dlp';
}

function ffmpegPath() {
  if (!ffmpegStatic) return 'ffmpeg';
  return app.isPackaged
    ? ffmpegStatic.replace('app.asar', 'app.asar.unpacked')
    : ffmpegStatic;
}

// YouTube требует JS-рантайм для расшифровки подписей. В Electron уже есть
// Node: с ELECTRON_RUN_AS_NODE=1 исполняемый файл приложения работает как node.
function runtimeArgs() {
  return ['--js-runtimes', `node:${process.execPath}`, '--ffmpeg-location', ffmpegPath()];
}

// Без этого yt-dlp на Windows пишет в pipe в кодировке консоли (cp1251),
// и путь с кириллицей из --print приходит битым.
function runtimeEnv() {
  return { ...process.env, ELECTRON_RUN_AS_NODE: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };
}

function binaryVersion(file) {
  return new Promise((resolve) => {
    execFile(file, ['--version'], { windowsHide: true, timeout: 30000 }, (err, stdout) => {
      resolve(err ? null : stdout.trim());
    });
  });
}

async function currentVersion() {
  const updated = readCurrent();
  if (updated) return { version: updated.version, source: 'updated' };
  const file = ytDlpPath();
  return { version: await binaryVersion(file), source: file === 'yt-dlp' ? 'system' : 'bundled' };
}

function sanitize(name) {
  return String(name || '')
    .replace(/[<>:"/\\|?*\n\r\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

function runCapture(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath(), [...runtimeArgs(), ...args], {
      windowsHide: true,
      env: runtimeEnv(),
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('error', (err) => reject(new Error(`Не удалось запустить yt-dlp: ${err.message}`)));
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(cleanError(stderr) || `yt-dlp завершился с кодом ${code}`));
    });
  });
}

// Частые ошибки yt-dlp по-русски; остальные показываем как есть.
const KNOWN_ERRORS = [
  [/video is unavailable|video unavailable/i, 'Видео недоступно'],
  [/private video/i, 'Это приватное видео'],
  [/requested format is not available/i, 'Это качество больше недоступно'],
  [/unsupported url/i, 'Сайт не поддерживается'],
  [/sign in to confirm your age|age-restricted/i, 'Видео с возрастным ограничением'],
  [/members-only/i, 'Видео только для подписчиков канала'],
  [/HTTP Error 404/i, 'Страница не найдена (404)'],
  [/unable to download webpage|getaddrinfo|timed out|connection/i, 'Нет связи с сайтом'],
];

function cleanError(stderr) {
  const lines = String(stderr).split('\n').map((l) => l.trim()).filter(Boolean);
  const errors = lines.filter((l) => l.startsWith('ERROR:'));
  const line = errors.length ? errors[errors.length - 1] : lines[lines.length - 1] || '';
  const raw = line
    .replace(/^ERROR:\s*/, '')
    .replace(/^\[[^\]]+\]\s*[^:]+:\s*/, '')
    .replace(/\s*Use --list-formats.*$/i, '');
  const known = KNOWN_ERRORS.find(([re]) => re.test(raw));
  return known ? known[1] : raw;
}

function parseInfo(info, fallbackUrl) {
  const url = info.webpage_url || info.original_url || fallbackUrl;
  const all = info.formats || [];

  const audioSize = all
    .filter((f) => f.vcodec === 'none' && f.acodec && f.acodec !== 'none')
    .reduce((best, f) => Math.max(best, f.filesize || f.filesize_approx || 0), 0);

  // yt-dlp сортирует форматы от худшего к лучшему, поэтому для каждой высоты
  // берём последний — его же выберет bestvideo[height=N].
  const byHeight = new Map();
  for (const f of all) {
    if (!f.height || f.vcodec === 'none') continue;
    byHeight.set(f.height, f);
  }

  const formats = [...byHeight.values()]
    .sort((a, b) => b.height - a.height)
    .map((f) => {
      const size = f.filesize || f.filesize_approx || 0;
      const needsAudio = !f.acodec || f.acodec === 'none';
      return {
        kind: 'video',
        label: `${f.height}p`,
        height: f.height,
        formatId: `bestvideo[height=${f.height}]+bestaudio/best[height=${f.height}]/best`,
        filesize: size ? size + (needsAudio ? audioSize : 0) : null,
      };
    });

  formats.push({
    kind: 'audio',
    label: 'mp3',
    height: null,
    formatId: 'bestaudio/best',
    filesize: audioSize || null,
  });

  return {
    url,
    title: info.title || 'video',
    thumbnail: info.thumbnail || null,
    duration: info.duration || null,
    source: info.extractor_key || 'Unknown',
    formats,
  };
}

async function extractInfo(url) {
  if (!url || typeof url !== 'string') throw new Error('Пустая ссылка');
  const stdout = await runCapture(['-J', '--no-playlist', '--no-warnings', url.trim()]);
  let info;
  try {
    info = JSON.parse(stdout);
  } catch {
    throw new Error('Не удалось разобрать ответ yt-dlp');
  }
  return parseInfo(info, url);
}

const PROGRESS_TEMPLATE =
  'download:SFLP %(info.vcodec)s|%(info.acodec)s|%(progress.status)s|%(progress.downloaded_bytes)s|' +
  '%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s';

function downloadArgs(task) {
  const out = path.join(task.folder, `${task.baseName}.%(ext)s`);
  const common = [
    '--no-playlist',
    '--newline',
    '--no-warnings',
    '--encoding', 'utf-8',
    '--progress',
    '--progress-template', PROGRESS_TEMPLATE,
    '--print', 'after_move:SFLF %(filepath)s',
    '-o', out,
  ];
  const format = task.kind === 'audio'
    ? ['-f', task.formatId, '-x', '--audio-format', 'mp3', '--audio-quality', '0']
    : ['-f', task.formatId, '--merge-output-format', 'mp4'];
  return [...runtimeArgs(), ...format, ...common, task.url];
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Разбирает строку прогресса из PROGRESS_TEMPLATE или итоговый путь файла.
function parseLine(line) {
  if (line.startsWith('SFLF ')) return { type: 'file', path: line.slice(5).trim() };
  if (!line.startsWith('SFLP ')) return null;
  const [vcodec, acodec, status, done, total, estimate, speed, eta] = line.slice(5).split('|');
  let stage = 'single';
  if (vcodec === 'none') stage = 'audio';
  else if (acodec === 'none') stage = 'video';
  return {
    type: 'progress',
    stage,
    status,
    downloaded: num(done) || 0,
    total: num(total) || num(estimate),
    speed: num(speed),
    eta: num(eta),
  };
}

function spawnDownload(task) {
  return spawn(ytDlpPath(), downloadArgs(task), {
    windowsHide: true,
    env: runtimeEnv(),
    // На Linux своя группа процессов, чтобы пауза убивала и yt-dlp, и ffmpeg.
    detached: process.platform !== 'win32',
  });
}

function killTree(proc) {
  if (!proc || proc.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true });
  } else {
    try {
      process.kill(-proc.pid, 'SIGTERM');
    } catch {
      proc.kill('SIGTERM');
    }
  }
}

module.exports = {
  EXE,
  extractInfo,
  spawnDownload,
  parseLine,
  cleanError,
  killTree,
  sanitize,
  ytDlpPath,
  updatesDir,
  readCurrent,
  binaryVersion,
  currentVersion,
};
