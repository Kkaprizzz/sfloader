'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const { app, net, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const { EXE, updatesDir, readCurrent, binaryVersion, currentVersion } = require('./ytdlp.cjs');

const REPO = 'Kkaprizzz/sfloader';

async function fetchOk(url) {
  const res = await net.fetch(url, {
    headers: { 'User-Agent': 'SFLoader', Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
  return res;
}

// «2026.08.19» > «2026.03.17»; работает и для «2.0.1» > «2.0.0».
function isNewer(latest, current) {
  const a = String(latest).replace(/^v/, '').split(/[.-]/).map(Number);
  const b = String(current || '').replace(/^v/, '').split(/[.-]/).map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return String(latest) !== String(current);
    if (x !== y) return x > y;
  }
  return false;
}

function ytDlpAssetName() {
  const { platform, arch } = process;
  if (platform === 'win32') return arch === 'arm64' ? 'yt-dlp_arm64.exe' : arch === 'ia32' ? 'yt-dlp_x86.exe' : 'yt-dlp.exe';
  if (platform === 'darwin') return 'yt-dlp_macos';
  if (arch === 'arm64') return 'yt-dlp_linux_aarch64';
  if (arch === 'arm') return 'yt-dlp_linux_armv7l';
  return 'yt-dlp_linux';
}

// Тихое обновление yt-dlp: свежий релиз со стабильного канала качается
// в папку данных с проверкой SHA256. Встроенный бинарник остаётся запасным.
class YtDlpUpdater extends EventEmitter {
  constructor() {
    super();
    this.state = { state: 'idle', version: null, source: null, error: null };
    this.busy = null;
  }

  set(patch) {
    this.state = { ...this.state, ...patch };
    this.emit('changed', this.state);
  }

  async init() {
    const { version, source } = await currentVersion();
    this.set({ version, source });
  }

  check() {
    if (!this.busy) {
      this.busy = this.run().finally(() => { this.busy = null; });
    }
    return this.busy;
  }

  async run() {
    this.set({ state: 'checking', error: null });
    try {
      const release = await (await fetchOk('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest')).json();
      const latest = release.tag_name;
      const current = await currentVersion();
      if (current.version && !isNewer(latest, current.version)) {
        this.set({ state: 'ok', version: current.version, source: current.source });
        return this.state;
      }

      this.set({ state: 'updating' });
      const name = ytDlpAssetName();
      const asset = release.assets.find((a) => a.name === name);
      const sums = release.assets.find((a) => a.name === 'SHA2-256SUMS');
      if (!asset || !sums) throw new Error(`В релизе ${latest} нет ${name}`);

      const sumsText = await (await fetchOk(sums.browser_download_url)).text();
      const expected = sumsText
        .split('\n')
        .map((l) => l.trim().split(/\s+/))
        .find(([, file]) => file === name)?.[0];
      if (!expected) throw new Error(`Нет контрольной суммы для ${name}`);

      const data = Buffer.from(await (await fetchOk(asset.browser_download_url)).arrayBuffer());
      const actual = crypto.createHash('sha256').update(data).digest('hex');
      if (actual !== expected) throw new Error('Контрольная сумма yt-dlp не совпала');

      const dir = updatesDir();
      fs.mkdirSync(dir, { recursive: true });
      const fileName = `yt-dlp-${latest}${EXE}`;
      const target = path.join(dir, fileName);
      fs.writeFileSync(`${target}.tmp`, data, { mode: 0o755 });
      fs.renameSync(`${target}.tmp`, target);

      const version = await binaryVersion(target);
      if (!version) throw new Error('Новый yt-dlp не запускается');

      fs.writeFileSync(path.join(dir, 'current.json'), JSON.stringify({ version, file: fileName }));
      this.cleanup(fileName);
      this.set({ state: 'ok', version, source: 'updated' });
    } catch (err) {
      this.set({ state: 'error', error: err.message });
    }
    return this.state;
  }

  // Старые версии удаляем; занятые (Windows держит запущенный exe) — в следующий раз.
  cleanup(keep) {
    const dir = updatesDir();
    for (const name of fs.readdirSync(dir)) {
      if (name === keep || name === 'current.json' || !name.startsWith('yt-dlp-')) continue;
      try {
        fs.unlinkSync(path.join(dir, name));
      } catch {
        // занят — удалим при следующем обновлении
      }
    }
  }

  startupCleanup() {
    const cur = readCurrent();
    if (cur) {
      try {
        this.cleanup(path.basename(cur.file));
      } catch {
        // папки ещё нет
      }
    }
  }
}

// Обновление приложения с GitHub-релизов. AppImage и Windows-установщик
// обновляются сами через electron-updater; portable и прочие сборки только
// узнают о новой версии и открывают страницу релиза.
class AppUpdater extends EventEmitter {
  constructor({ beforeInstall }) {
    super();
    this.beforeInstall = beforeInstall;
    this.state = { state: 'idle', version: null, percent: 0, error: null, manual: false };

    this.supported =
      app.isPackaged &&
      ((process.platform === 'win32' && !process.env.PORTABLE_EXECUTABLE_DIR) ||
        (process.platform === 'linux' && !!process.env.APPIMAGE));

    if (this.supported) {
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.on('update-available', (info) => this.set({ state: 'available', version: info.version }));
      autoUpdater.on('update-not-available', () => this.set({ state: 'none' }));
      autoUpdater.on('download-progress', (p) => this.set({ state: 'downloading', percent: p.percent }));
      autoUpdater.on('update-downloaded', (info) => this.set({ state: 'ready', version: info.version }));
      autoUpdater.on('error', (err) => this.set({ state: 'error', error: err?.message || String(err) }));
    }
  }

  set(patch) {
    this.state = { ...this.state, ...patch };
    this.emit('changed', this.state);
  }

  async check() {
    if (!app.isPackaged) {
      this.set({ state: 'unsupported', error: 'В режиме разработки обновления не проверяются' });
      return this.state;
    }
    if (['downloading', 'ready'].includes(this.state.state)) return this.state;
    this.set({ state: 'checking', error: null });
    try {
      if (this.supported) {
        await autoUpdater.checkForUpdates();
      } else {
        const release = await (await fetchOk(`https://api.github.com/repos/${REPO}/releases/latest`)).json();
        const version = release.tag_name.replace(/^v/, '');
        if (isNewer(version, app.getVersion())) this.set({ state: 'available', version, manual: true });
        else this.set({ state: 'none' });
      }
    } catch (err) {
      this.set({ state: 'error', error: err?.message || String(err) });
    }
    return this.state;
  }

  async download() {
    if (this.state.manual) {
      shell.openExternal(`https://github.com/${REPO}/releases/latest`);
      return;
    }
    if (!this.supported || this.state.state !== 'available') return;
    this.set({ state: 'downloading', percent: 0 });
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      this.set({ state: 'error', error: err?.message || String(err) });
    }
  }

  async install() {
    if (this.state.state !== 'ready') return;
    await this.beforeInstall();
    autoUpdater.quitAndInstall(false, true);
  }
}

module.exports = { YtDlpUpdater, AppUpdater, isNewer };
