'use strict';

const { app } = require('electron');
const { JsonFile } = require('./store.cjs');

function normalize(raw) {
  const concurrency = Math.round(Number(raw.concurrency));
  return {
    folder: typeof raw.folder === 'string' && raw.folder ? raw.folder : app.getPath('downloads'),
    concurrency: concurrency >= 1 && concurrency <= 5 ? concurrency : 2,
    notify: typeof raw.notify === 'boolean' ? raw.notify : true,
  };
}

class Settings {
  constructor() {
    this.store = new JsonFile('settings.json', {});
    this.data = normalize(this.store.read());
  }

  get() {
    return { ...this.data };
  }

  set(patch) {
    this.data = normalize({ ...this.data, ...patch });
    this.store.writeNow(this.data);
    return this.get();
  }
}

module.exports = { Settings };
