import Icon from '../Icon';
import { formatBytes, formatDate, join } from '../../lib/format';
import './rows.css';

const HistoryRow = ({ entry, api, onRedownload }) => (
  <li className={`row${entry.missing ? ' is-missing' : ''}`}>
    {entry.thumbnail ? <img className="row-thumb" src={entry.thumbnail} alt="" loading="lazy" /> : <div className="row-thumb" />}

    <div className="row-main">
      <p className="row-title" title={entry.title}>{entry.title}</p>
      <p className="row-meta">
        {join(entry.label, !entry.missing && formatBytes(entry.size), formatDate(entry.finishedAt))}
        {entry.missing && ' · файл удалён'}
      </p>
    </div>

    <div className="row-side">
      <button
        className="icon-btn"
        onClick={() => api.openFile(entry.id)}
        disabled={entry.missing}
        aria-label="Открыть файл"
        title="Открыть файл"
      >
        <Icon name="play" />
      </button>
      <button
        className="icon-btn"
        onClick={() => api.showFile(entry.id)}
        disabled={entry.missing}
        aria-label="Показать в папке"
        title="Показать в папке"
      >
        <Icon name="folder" />
      </button>
      <button className="icon-btn" onClick={() => onRedownload(entry.id)} aria-label="Скачать снова" title="Скачать снова">
        <Icon name="download" />
      </button>
      <button className="icon-btn is-danger" onClick={() => api.remove(entry.id)} aria-label="Удалить запись" title="Удалить запись">
        <Icon name="trash" />
      </button>
    </div>
  </li>
);

const HistoryList = ({ entries, onRedownload }) => {
  const api = window.api.history;
  if (!entries.length) {
    return <p className="list-empty">Здесь появятся скачанные ролики</p>;
  }
  return (
    <ul className="rows">
      {entries.map((entry) => (
        <HistoryRow key={entry.id} entry={entry} api={api} onRedownload={onRedownload} />
      ))}
    </ul>
  );
};

export default HistoryList;
