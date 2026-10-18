'use strict';

const fs = require('node:fs');
const { EventEmitter } = require('node:events');
const { JsonFile } = require('./store.cjs');

// История завершённых загрузок. Без лимита; удаление убирает только запись,
// файл на диске не трогается.
class History extends EventEmitter {
  constructor() {
    super();
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
    return Promise.all(
      this.entries.map(async (e) => {
        let missing = !e.filePath;
        if (!missing) {
          try {
            await fs.promises.access(e.filePath);
          } catch {
            missing = true;
          }
        }
        return { ...e, missing };
      }),
    );
  }

  flush() {
    this.store.writeNow(this.entries);
  }
}

module.exports = { History };
