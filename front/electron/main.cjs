'use strict';

const path = require('node:path');
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');

if (
  process.platform === 'linux' &&
  (process.env.XDG_SESSION_TYPE === 'wayland' || process.env.WAYLAND_DISPLAY) &&
  !process.argv.includes('--ozone-platform=x11')
) {
  app.relaunch({ args: process.argv.slice(1).concat('--ozone-platform=x11') });
  app.exit(0);
  return;
}

const { extractInfo, downloadVideo } = require('./ytdlp.cjs');

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0F111A',
    autoHideMenuBar: true,
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
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('video:extract', async (_event, url) => {
  return extractInfo(url);
});

ipcMain.handle('dialog:chooseFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Куда сохранить видео',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('video:download', async (event, opts) => {
  const filePath = await downloadVideo(opts, (percent) => {
    if (!event.sender.isDestroyed()) {
      event.sender.send('video:progress', { id: opts.id, percent });
    }
  });
  return filePath;
});

ipcMain.handle('shell:openPath', async (_event, target) => {
  return shell.showItemInFolder(target);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
