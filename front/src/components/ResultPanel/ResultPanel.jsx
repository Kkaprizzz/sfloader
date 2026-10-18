import Icon from '../Icon';
import { formatBytes, formatClock, join } from '../../lib/format';
import './ResultPanel.css';

const ResultPanel = ({ data, hint, onAdd, onClose }) => (
  <section className="result" aria-label="Найденное видео">
    <header className="result-media">
      {data.thumbnail
        ? <img className="result-thumb" src={data.thumbnail} alt="" />
        : <div className="result-thumb" />}
      <div className="result-text">
        <h2 title={data.title}>{data.title}</h2>
        <p>{join(data.source, formatClock(data.duration))}</p>
      </div>
      <button className="icon-btn" onClick={onClose} aria-label="Закрыть" title="Закрыть">
        <Icon name="close" />
      </button>
    </header>

    <ul className="result-formats">
      {data.formats.map((format) => (
        <li key={format.formatId + format.kind} className="result-format">
          <span className="result-label">{format.label}</span>
          <span className="result-size">{formatBytes(format.filesize) || '—'}</span>
          <button className="result-add" onClick={(e) => onAdd(format, e.ctrlKey || e.metaKey)}>
            <Icon name="plus" />
            В очередь
          </button>
        </li>
      ))}
    </ul>

    <p className={`result-hint${hint ? ' is-flash' : ''}`} aria-live="polite">
      {hint || 'Ctrl+клик — добавить и оставить панель открытой'}
    </p>
  </section>
);

export default ResultPanel;
