import Icon from '../Icon';
import { formatBytes, formatSpeed, formatClock, join } from '../../lib/format';
import './rows.css';

const STAGE = {
  video: 'Видео',
  audio: 'Аудио',
  single: 'Загрузка',
  post: 'Обработка',
};

function progressOf(task) {
  if (task.status !== 'active' || task.stage === 'post' || !task.total) return null;
  return Math.min(100, (task.downloaded / task.total) * 100);
}

function sizeOf(task) {
  const total = (task.doneBytes || 0) + (task.total || 0);
  if (task.status === 'active' && task.total) {
    return `${formatBytes((task.doneBytes || 0) + task.downloaded) || '0 КБ'} / ${formatBytes(total)}`;
  }
  return formatBytes(task.estimate);
}

function Status({ task }) {
  if (task.status === 'active') {
    return <span className="is-accent">{STAGE[task.stage] || 'Подготовка'}</span>;
  }
  if (task.status === 'queued') {
    return task.retryAt
      ? <span>Повтор, попытка {task.attempts} из 2</span>
      : <span>В очереди</span>;
  }
  if (task.status === 'paused') return <span>Пауза</span>;
  return <span className="is-danger" title={task.error}>Ошибка: {task.error}</span>;
}

const QueueRow = ({ task, api }) => {
  const percent = progressOf(task);
  const active = task.status === 'active';
  const canResume = task.status === 'paused' || task.status === 'error';
  const lastPercent = task.total ? (task.downloaded / task.total) * 100 : 0;
  const details = task.status === 'error'
    ? ''
    : join(
      sizeOf(task),
      active && formatSpeed(task.speed),
      active && task.eta != null && `осталось ${formatClock(task.eta)}`,
    );

  return (
    <li className={`row${task.status === 'paused' ? ' is-paused' : ''}`}>
      {task.thumbnail ? <img className="row-thumb" src={task.thumbnail} alt="" loading="lazy" /> : <div className="row-thumb" />}

      <div className="row-main">
        <p className="row-title" title={task.title}>{task.title}</p>
        <p className="row-meta">
          {task.label} · <Status task={task} />
          {details && ` · ${details}`}
        </p>
      </div>

      <div className="row-side">
        {percent != null && <span className="row-percent">{Math.floor(percent)}%</span>}

        {active || task.status === 'queued' ? (
          <button className="icon-btn" onClick={() => api.pause(task.id)} aria-label="Пауза" title="Пауза">
            <Icon name="pause" />
          </button>
        ) : null}
        {canResume && (
          <button
            className="icon-btn"
            onClick={() => api.resume(task.id)}
            aria-label={task.status === 'error' ? 'Повторить' : 'Продолжить'}
            title={task.status === 'error' ? 'Повторить' : 'Продолжить'}
          >
            <Icon name={task.status === 'error' ? 'retry' : 'play'} />
          </button>
        )}
        <button className="icon-btn is-danger" onClick={() => api.cancel(task.id)} aria-label="Отменить" title="Отменить">
          <Icon name="close" />
        </button>
      </div>

      {(percent != null || task.status === 'paused') && (
        <span className="row-bar" style={{ width: `${percent ?? lastPercent}%` }} />
      )}
    </li>
  );
};

const QueueList = ({ tasks }) => {
  const api = window.api.queue;
  if (!tasks.length) {
    return <p className="list-empty">Очередь пуста. Вставь ссылку и нажми Enter</p>;
  }
  return (
    <ul className="rows">
      {tasks.map((task) => <QueueRow key={task.id} task={task} api={api} />)}
    </ul>
  );
};

export default QueueList;
