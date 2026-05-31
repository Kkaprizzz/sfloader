'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  extractInfo: (url) => ipcRenderer.invoke('video:extract', url),
  chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder'),
  download: (opts) => ipcRenderer.invoke('video:download', opts),
  openPath: (target) => ipcRenderer.invoke('shell:openPath', target),
  onProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('video:progress', listener);
    return () => ipcRenderer.removeListener('video:progress', listener);
  },
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback) => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('window:maximized', listener);
      return () => ipcRenderer.removeListener('window:maximized', listener);
    },
  },
});
