export function formatBytes(bytes) {
  if (!bytes) return null;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} ГБ`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(bytes >= 100 * 1024 ** 2 ? 0 : 1)} МБ`;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

export function formatSpeed(bps) {
  if (!bps) return null;
  return `${formatBytes(bps)}/с`;
}

export function formatClock(sec) {
  if (sec == null || !Number.isFinite(sec)) return null;
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(r).padStart(2, '0')}`;
}

export function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (days === 0) return `сегодня ${time}`;
  if (days === 1) return `вчера ${time}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' });
}

export const join = (...parts) => parts.filter(Boolean).join(' · ');
