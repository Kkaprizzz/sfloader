'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

function subscribe(channel) {
  return (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('api', {
  extractInfo: invoke('video:extract'),

  queue: {
    list: invoke('queue:list'),
    add: invoke('queue:add'),
    pause: invoke('queue:pause'),
    resume: invoke('queue:resume'),
    cancel: invoke('queue:cancel'),
    onChanged: subscribe('queue:changed'),
  },

  history: {
    list: invoke('history:list'),
    remove: invoke('history:remove'),
    clear: invoke('history:clear'),
    redownload: invoke('history:redownload'),
    openFile: invoke('history:openFile'),
    showFile: invoke('history:showFile'),
    onChanged: subscribe('history:changed'),
  },

  settings: {
    get: invoke('settings:get'),
    set: invoke('settings:set'),
    chooseFolder: invoke('settings:chooseFolder'),
    openFolder: invoke('settings:openFolder'),
  },

  ytdlp: {
    status: invoke('ytdlp:status'),
    check: invoke('ytdlp:check'),
    onChanged: subscribe('ytdlp:changed'),
  },

  app: {
    version: invoke('app:version'),
    updateStatus: invoke('app:updateStatus'),
    checkUpdate: invoke('app:updateCheck'),
    downloadUpdate: invoke('app:updateDownload'),
    installUpdate: invoke('app:updateInstall'),
    onUpdateChanged: subscribe('app:updateChanged'),
  },

  windowControls: {
    minimize: invoke('window:minimize'),
    toggleMaximize: invoke('window:toggleMaximize'),
    close: invoke('window:close'),
    isMaximized: invoke('window:isMaximized'),
    onMaximizeChange: subscribe('window:maximized'),
  },
});
