'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

// JSON-файл в папке данных приложения. Запись атомарная: tmp + rename,
// чтобы падение посреди записи не оставило битый файл.
class JsonFile {
  constructor(name, fallback) {
    this.file = path.join(app.getPath('userData'), name);
    this.fallback = fallback;
    this.timer = null;
  }

  read() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      return structuredClone(this.fallback);
    }
  }

  writeNow(data) {
    clearTimeout(this.timer);
    this.timer = null;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.file);
  }

  writeSoon(getData, delay = 500) {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      try {
        this.writeNow(getData());
      } catch (err) {
        console.error(`Не удалось сохранить ${this.file}:`, err);
      }
    }, delay);
  }
}

module.exports = { JsonFile };
