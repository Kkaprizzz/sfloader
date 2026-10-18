'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const { JsonFile } = require('./store.cjs');
const { spawnDownload, parseLine, cleanError, killTree, sanitize } = require('./ytdlp.cjs');

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY = 5000;

// Ошибки, которые повтор не исправит: сразу показываем, без автоповтора.
// Сверяем и с переводами из ytdlp.cleanError, и с исходным английским текстом.
const PERMANENT = /недоступно|приватное|не поддерживается|возрастным|подписчиков|404|unavailable|private video|unsupported url|not available|has been removed|copyright|sign in to confirm your age|members-only|age-restricted/i;

// Статусы задачи: queued → active → (done | paused | error); done уходит в историю.
class DownloadManager extends EventEmitter {
  constructor({ settings, history }) {
    super();
    this.settings = settings;
    this.history = history;
    this.store = new JsonFile('queue.json', []);
    this.procs = new Map();
    this.retryTimers = new Map();

    // После перезапуска всё незавершённое восстанавливается на паузе.
    this.tasks = this.store.read().map((t) => ({
      ...t,
      status: t.status === 'error' ? 'error' : 'paused',
      speed: null,
      eta: null,
      retryAt: null,
    }));
  }

  snapshot() {
    // eslint-disable-next-line no-unused-vars
    return this.tasks.map(({ _stop, _spawnError, ...t }) => t);
  }

  changed({ persist = true } = {}) {
    if (persist) this.store.writeSoon(() => this.snapshot(), 1000);
    this.emit('changed');
  }

  hasPending() {
    return this.tasks.some((t) => t.status === 'active' || t.status === 'queued');
  }

  activeCount() {
    return this.tasks.filter((t) => t.status === 'active').length;
  }

  find(id) {
    return this.tasks.find((t) => t.id === id);
  }

  uniqueBaseName(folder, title, label, ext) {
    const base = sanitize(`${title}_${label}`) || 'video';
    const taken = (name) =>
      fs.existsSync(path.join(folder, `${name}.${ext}`)) ||
      this.tasks.some((t) => t.folder === folder && t.baseName === name);
    if (!taken(base)) return base;
    for (let i = 2; ; i += 1) {
      const candidate = `${base} (${i})`;
      if (!taken(candidate)) return candidate;
    }
  }

  add(item) {
    const duplicate = this.tasks.find((t) => t.url === item.url && t.formatId === item.formatId);
    if (duplicate) return { ok: false, duplicate: true };

    const folder = this.settings.get().folder;
    fs.mkdirSync(folder, { recursive: true });
    const ext = item.kind === 'audio' ? 'mp3' : 'mp4';

    const task = {
      id: crypto.randomUUID(),
      url: item.url,
      title: item.title,
      thumbnail: item.thumbnail || null,
      source: item.source || null,
      duration: item.duration || null,
      kind: item.kind,
      label: item.label,
      height: item.height || null,
      formatId: item.formatId,
      estimate: item.filesize || null,
      folder,
      baseName: this.uniqueBaseName(folder, item.title, item.label, ext),
      status: 'queued',
      stage: null,
      downloaded: 0,
      total: null,
      speed: null,
      eta: null,
      attempts: 0,
      error: null,
      retryAt: null,
      createdAt: Date.now(),
    };
    this.tasks.push(task);
    this.changed();
    this.schedule();
    return { ok: true, id: task.id };
  }

  schedule() {
    const limit = this.settings.get().concurrency;
    for (const task of this.tasks) {
      if (this.activeCount() >= limit) break;
      if (task.status === 'queued' && !(task.retryAt && task.retryAt > Date.now())) {
        this.start(task);
      }
    }
  }

  start(task) {
    task.status = 'active';
    task.error = null;
    task.retryAt = null;
    task.stage = null;
    task.downloaded = 0;
    task.total = null;
    task.speed = null;
    task.eta = null;
    task.doneBytes = 0;
    task.filePath = null;

    let proc;
    try {
      proc = spawnDownload(task);
    } catch (err) {
      this.fail(task, err.message);
      return;
    }
    this.procs.set(task.id, proc);
    this.changed();

    let buffer = '';
    let stderr = '';
    let lastEmit = 0;

    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        const ev = parseLine(line.trim());
        if (!ev) continue;
        if (ev.type === 'file') {
          task.filePath = ev.path;
          continue;
        }
        if (ev.status === 'finished') {
          // Часть скачана; дальше либо следующая часть, либо склейка/конвертация.
          task.doneBytes += ev.total || ev.downloaded;
          task.downloaded = 0;
          task.total = null;
          task.stage = 'post';
          task.speed = null;
          task.eta = null;
        } else {
          task.stage = ev.stage;
          task.downloaded = ev.downloaded;
          task.total = ev.total;
          task.speed = ev.speed;
          task.eta = ev.eta;
        }
        const now = Date.now();
        if (now - lastEmit > 250) {
          lastEmit = now;
          this.changed({ persist: false });
        }
      }
    });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      task._stop = task._stop || 'error';
      task._spawnError = `Не удалось запустить yt-dlp: ${err.message}`;
    });

    proc.on('close', (code) => {
      this.procs.delete(task.id);
      const reason = task._stop;
      delete task._stop;

      if (reason === 'cancel') {
        this.removePartials(task);
        this.tasks = this.tasks.filter((t) => t !== task);
      } else if (code === 0 && task.filePath) {
        // Пауза могла прийти, когда файл уже готов, — тогда это просто успех.
        this.finish(task);
      } else if (reason === 'pause') {
        task.status = 'paused';
        task.speed = null;
        task.eta = null;
      } else {
        const message = task._spawnError || cleanError(stderr) || `yt-dlp завершился с кодом ${code}`;
        delete task._spawnError;
        this.fail(task, message);
      }
      this.changed();
      this.emit('settled');
      this.schedule();
    });
  }

  finish(task) {
    let size = null;
    try {
      size = fs.statSync(task.filePath).size;
    } catch {
      // файл переместили сразу после загрузки — размер просто не покажем
    }
    this.tasks = this.tasks.filter((t) => t !== task);
    const entry = {
      id: task.id,
      url: task.url,
      title: task.title,
      thumbnail: task.thumbnail,
      source: task.source,
      duration: task.duration,
      kind: task.kind,
      label: task.label,
      height: task.height,
      formatId: task.formatId,
      filePath: task.filePath,
      size,
      finishedAt: Date.now(),
    };
    this.history.add(entry);
    this.emit('done', entry);
  }

  fail(task, message) {
    task.speed = null;
    task.eta = null;
    if (!PERMANENT.test(message) && task.attempts < MAX_AUTO_RETRIES) {
      task.attempts += 1;
      task.status = 'queued';
      task.error = message;
      task.retryAt = Date.now() + RETRY_DELAY;
      clearTimeout(this.retryTimers.get(task.id));
      this.retryTimers.set(task.id, setTimeout(() => {
        this.retryTimers.delete(task.id);
        this.schedule();
      }, RETRY_DELAY + 50));
      return;
    }
    task.status = 'error';
    task.error = message;
    task.retryAt = null;
    this.emit('failed', task);
  }

  pause(id) {
    const task = this.find(id);
    if (!task) return;
    if (task.status === 'active') {
      task._stop = 'pause';
      killTree(this.procs.get(id));
    } else if (task.status === 'queued') {
      task.status = 'paused';
      task.retryAt = null;
      this.changed();
    }
  }

  resume(id) {
    const task = this.find(id);
    if (!task || (task.status !== 'paused' && task.status !== 'error')) return;
    if (task.status === 'error') task.attempts = 0;
    task.status = 'queued';
    task.retryAt = null;
    this.changed();
    this.schedule();
  }

  cancel(id) {
    const task = this.find(id);
    if (!task) return;
    clearTimeout(this.retryTimers.get(id));
    this.retryTimers.delete(id);
    if (task.status === 'active') {
      task._stop = 'cancel';
      killTree(this.procs.get(id));
      return;
    }
    this.removePartials(task);
    this.tasks = this.tasks.filter((t) => t !== task);
    this.changed();
  }

  // Удаляет только недокачанное этой задачи: .part, .ytdl и промежуточные
  // .f<format>.<ext>. Готовый файл с таким именем не трогаем.
  removePartials(task) {
    let names;
    try {
      names = fs.readdirSync(task.folder);
    } catch {
      return;
    }
    const prefix = `${task.baseName}.`;
    for (const name of names) {
      if (!name.startsWith(prefix)) continue;
      const rest = name.slice(prefix.length);
      const partial =
        rest.endsWith('.part') ||
        rest.endsWith('.ytdl') ||
        rest.includes('.temp.') ||
        rest.startsWith('temp.') ||
        /^f[^.]+\.[^.]+$/.test(rest);
      if (!partial) continue;
      try {
        fs.unlinkSync(path.join(task.folder, name));
      } catch {
        // файл занят или уже удалён — не критично
      }
    }
  }

  // Перед выходом и установкой обновления: всё активное на паузу, ждём,
  // пока процессы завершатся, и сохраняем очередь.
  async pauseAll() {
    for (const t of this.tasks) {
      if (t.status === 'queued') t.status = 'paused';
    }
    const running = this.tasks.filter((t) => t.status === 'active');
    if (running.length) {
      const settled = new Promise((resolve) => {
        const check = () => {
          if (this.activeCount() === 0) {
            this.off('settled', check);
            resolve();
          }
        };
        this.on('settled', check);
      });
      for (const t of running) this.pause(t.id);
      await Promise.race([settled, new Promise((r) => setTimeout(r, 4000))]);
    }
    for (const t of this.tasks) {
      if (t.status === 'active') t.status = 'paused';
    }
    this.store.writeNow(this.snapshot());
  }
}

module.exports = { DownloadManager };
