// Тот же экран, что в index.html до старта React (стили там же), — держим его,
// пока App ждёт первые данные, чтобы не было скачка.
const Splash = () => (
  <div className="splash" role="status" aria-label="Загрузка">
    <div className="splash-brand"><span>sf</span>loader</div>
    <div className="splash-bar" />
  </div>
);

export default Splash;
