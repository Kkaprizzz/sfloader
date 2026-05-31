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
});
