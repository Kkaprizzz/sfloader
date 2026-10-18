'use strict';

const path = require('node:path');
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
  Notification,
  nativeImage,
} = require('electron');

if (
  process.platform === 'linux' &&
  (process.env.XDG_SESSION_TYPE === 'wayland' || process.env.WAYLAND_DISPLAY) &&
  !process.argv.includes('--ozone-platform=x11')
) {
  // Внутри AppImage process.execPath указывает во временное монтирование,
  // которое исчезнет вместе с этим процессом, а app.relaunch с AppImage
  // не работает вовсе. Поэтому запускаем сам .AppImage отдельным процессом:
  // у него будет своё монтирование.
  const { spawn } = require('node:child_process');
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  spawn(process.env.APPIMAGE || process.execPath, process.argv.slice(1).concat('--ozone-platform=x11'), {
    detached: true,
    stdio: 'ignore',
    env,
  }).unref();
  app.exit(0);
  return;
}

// Второй запуск просто показывает уже открытое (или спрятанное в трей) окно.
if (!app.requestSingleInstanceLock()) {
  app.exit(0);
  return;
}

const { extractInfo } = require('./ytdlp.cjs');
const { Settings } = require('./settings.cjs');
const { History } = require('./history.cjs');
const { DownloadManager } = require('./queue.cjs');
const { YtDlpUpdater, AppUpdater } = require('./updaters.cjs');

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

app.setAppUserModelId('com.sfloader.app');

let mainWindow = null;
let tray = null;
let quitting = false;
let readyToQuit = false;

let settings;
let history;
let manager;
let ytdlpUpdater;
let appUpdater;

function iconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '..', 'build', 'icon.png');
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function showWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function quitApp() {
  quitting = true;
  app.quit();
}

function ensureTray() {
  if (tray) return;
  const size = process.platform === 'win32' ? 16 : 32;
  tray = new Tray(nativeImage.createFromPath(iconPath()).resize({ width: size, height: size }));
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Открыть', click: showWindow },
      { type: 'separator' },
      { label: 'Выйти', click: quitApp },
    ]),
  );
  tray.on('click', showWindow);
  updateTray();
}

function updateTray() {
  if (!tray) return;
  const active = manager.tasks.filter((t) => t.status === 'active' || t.status === 'queued').length;
  tray.setToolTip(active ? `SFLoader — загрузок: ${active}` : 'SFLoader');
}

function notify(title, body) {
  if (!settings.get().notify || !Notification.isSupported()) return;
  if (mainWindow && mainWindow.isVisible() && mainWindow.isFocused()) return;
  const n = new Notification({ title, body, icon: iconPath() });
  n.on('click', showWindow);
  n.show();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#161617',
    frame: false,
    autoHideMenuBar: true,
    icon: iconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('maximize', () => send('window:maximized', true));
  mainWindow.on('unmaximize', () => send('window:maximized', false));

  // Пока идут загрузки, крестик прячет окно в трей, а не закрывает приложение.
  mainWindow.on('close', (event) => {
    if (!quitting && manager.hasPending()) {
      event.preventDefault();
      mainWindow.hide();
      ensureTray();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function toQueueItem(src) {
  return {
    url: String(src.url),
    title: String(src.title || 'video'),
    thumbnail: src.thumbnail || null,
    source: src.source || null,
    duration: Number(src.duration) || null,
    kind: src.kind === 'audio' ? 'audio' : 'video',
    label: String(src.label),
    height: Number(src.height) || null,
    formatId: String(src.formatId),
    filesize: Number(src.filesize) || null,
  };
}

function registerIpc() {
  ipcMain.handle('video:extract', (_e, url) => extractInfo(url));

  ipcMain.handle('queue:list', () => manager.snapshot());
  ipcMain.handle('queue:add', (_e, item) => manager.add(toQueueItem(item)));
  ipcMain.handle('queue:pause', (_e, id) => manager.pause(id));
  ipcMain.handle('queue:resume', (_e, id) => manager.resume(id));
  ipcMain.handle('queue:cancel', (_e, id) => manager.cancel(id));

  ipcMain.handle('history:list', () => history.list());
  ipcMain.handle('history:remove', (_e, id) => history.remove(id));
  ipcMain.handle('history:clear', () => history.clear());
  ipcMain.handle('history:redownload', (_e, id) => {
    const entry = history.get(id);
    return entry ? manager.add(toQueueItem(entry)) : { ok: false };
  });
  // Открываем только файлы из истории, по id, а не произвольные пути.
  ipcMain.handle('history:openFile', async (_e, id) => {
    const entry = history.get(id);
    return entry?.filePath ? shell.openPath(entry.filePath) : 'Нет файла';
  });
  ipcMain.handle('history:showFile', (_e, id) => {
    const entry = history.get(id);
    if (entry?.filePath) shell.showItemInFolder(entry.filePath);
  });

  ipcMain.handle('settings:get', () => settings.get());
  ipcMain.handle('settings:set', (_e, patch) => {
    const next = settings.set(patch || {});
    manager.schedule();
    return next;
  });
  ipcMain.handle('settings:chooseFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Папка для загрузок',
      defaultPath: settings.get().folder,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return settings.get();
    return settings.set({ folder: result.filePaths[0] });
  });
  ipcMain.handle('settings:openFolder', () => shell.openPath(settings.get().folder));

  ipcMain.handle('ytdlp:status', () => ytdlpUpdater.state);
  ipcMain.handle('ytdlp:check', () => ytdlpUpdater.check());

  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:updateStatus', () => appUpdater.state);
  ipcMain.handle('app:updateCheck', () => appUpdater.check());
  ipcMain.handle('app:updateDownload', () => appUpdater.download());
  ipcMain.handle('app:updateInstall', () => appUpdater.install());

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:toggleMaximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => !!mainWindow?.isMaximized());
}

app.on('second-instance', showWindow);

app.whenReady().then(async () => {
  settings = new Settings();
  history = new History();
  manager = new DownloadManager({ settings, history });
  ytdlpUpdater = new YtDlpUpdater();
  appUpdater = new AppUpdater({
    beforeInstall: async () => {
      quitting = true;
      await manager.pauseAll();
      history.flush();
      readyToQuit = true;
    },
  });

  manager.on('changed', () => {
    send('queue:changed', manager.snapshot());
    updateTray();
  });
  manager.on('done', (entry) => notify('Скачано', entry.title));
  manager.on('failed', (task) => notify('Не удалось скачать', task.title));
  history.on('changed', () => send('history:changed'));
  ytdlpUpdater.on('changed', (state) => send('ytdlp:changed', state));
  appUpdater.on('changed', (state) => send('app:updateChanged', state));

  registerIpc();
  createWindow();

  ytdlpUpdater.startupCleanup();
  await ytdlpUpdater.init();
  setTimeout(() => {
    ytdlpUpdater.check();
    appUpdater.check();
  }, 3000);
});

// Перед выходом активные загрузки ставятся на паузу, очередь сохраняется.
app.on('before-quit', (event) => {
  quitting = true;
  if (readyToQuit || !manager) return;
  event.preventDefault();
  readyToQuit = true;
  manager
    .pauseAll()
    .catch((err) => console.error(err))
    .finally(() => {
      history.flush();
      app.quit();
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
