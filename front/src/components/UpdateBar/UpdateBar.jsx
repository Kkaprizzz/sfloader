import Icon from '../Icon';
import './UpdateBar.css';

const UpdateBar = ({ update, onDismiss }) => {
  const api = window.api.app;
  let text;
  let action = null;

  switch (update.state) {
    case 'available':
      text = `Доступна версия ${update.version}`;
      action = { label: update.manual ? 'Открыть страницу' : 'Обновить', run: api.downloadUpdate };
      break;
    case 'downloading':
      text = `Скачиваю обновление · ${Math.floor(update.percent || 0)}%`;
      break;
    case 'ready':
      text = `Версия ${update.version} скачана`;
      action = { label: 'Перезапустить', run: api.installUpdate };
      break;
    default:
      text = `Не удалось обновить до ${update.version}`;
      action = { label: 'Повторить', run: api.checkUpdate };
  }

  return (
    <div className={`updatebar${update.state === 'error' ? ' is-error' : ''}`} role="status">
      <span>{text}</span>
      {action && <button className="updatebar-action" onClick={() => action.run()}>{action.label}</button>}
      <button className="updatebar-close" onClick={onDismiss} aria-label="Скрыть" title="Скрыть">
        <Icon name="close" size={14} />
      </button>
      {update.state === 'downloading' && (
        <span className="updatebar-fill" style={{ width: `${update.percent || 0}%` }} />
      )}
    </div>
  );
};

export default UpdateBar;
