'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { JsonFile } = require('./store.cjs');

// История завершённых загрузок. Без лимита; удаление убирает только запись,
// файл на диске не трогается.
class History extends EventEmitter {
  // folder — текущая папка загрузок из настроек: там ищем файлы старых
  // записей, у которых путь сохранился битым.
  constructor({ folder = () => null } = {}) {
    super();
    this.folder = folder;
    this.store = new JsonFile('history.json', []);
    this.entries = this.store.read();
  }

  save() {
    this.store.writeSoon(() => this.entries, 200);
    this.emit('changed');
  }

  add(entry) {
    this.entries.unshift(entry);
    this.save();
  }

  remove(id) {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.save();
  }

  clear() {
    this.entries = [];
    this.save();
  }

  get(id) {
    return this.entries.find((e) => e.id === id) || null;
  }

  async list() {
    const dirs = new Map();
    let fixed = false;
    const list = await Promise.all(
      this.entries.map(async (e) => {
        if (e.filePath && (await exists(e.filePath))) return { ...e, missing: false };
        const found = await this.locate(e, dirs);
        if (!found) return { ...e, missing: true };
        e.filePath = found;
        fixed = true;
        return { ...e, missing: false };
      }),
    );
    // Без emit('changed'): иначе окно снова запросит список.
    if (fixed) this.store.writeSoon(() => this.entries, 200);
    return list;
  }

  // Ищет файл записи, если сохранённый путь не открывается. Раньше путь
  // брался из вывода yt-dlp, и на Windows кириллица в нём портилась
  // (кодировка консоли, разрыв буквы между чанками) — файл на месте, а в
  // истории «удалён».
  async locate(e, dirs) {
    if (!e.filePath) return null;
    const ext = path.extname(e.filePath) || (e.kind === 'audio' ? '.mp3' : '.mp4');
    if (e.folder && e.baseName) {
      const expected = path.join(e.folder, `${e.baseName}${ext}`);
      return (await exists(expected)) ? expected : null;
    }
    // Старые записи: сравниваем имена без не-ASCII символов — их-то и
    // испортило. Берём файл, только если подходит ровно один.
    const name = path.basename(e.filePath);
    if (/^[\x20-\x7e]*$/.test(name)) return null;
    const skeleton = asciiOnly(name);
    const candidates = new Set();
    for (const dir of new Set([path.dirname(e.filePath), this.folder()].filter(Boolean))) {
      if (!dirs.has(dir)) dirs.set(dir, fs.promises.readdir(dir).catch(() => []));
      for (const n of await dirs.get(dir)) {
        if (path.extname(n) === ext && n !== asciiOnly(n) && asciiOnly(n) === skeleton) {
          candidates.add(path.join(dir, n));
        }
      }
    }
    if (candidates.size !== 1) return null;
    const [found] = candidates;
    if (this.entries.some((other) => other !== e && other.filePath === found)) return null;
    return found;
  }

  flush() {
    this.store.writeNow(this.entries);
  }
}

const exists = (file) => fs.promises.access(file).then(() => true, () => false);

const asciiOnly = (name) => name.replace(/[^\x20-\x7e]/g, '');

module.exports = { History };
