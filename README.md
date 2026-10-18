# SFLoader

Десктопное приложение для скачивания видео и музыки. Внутри yt-dlp и ffmpeg,
всё работает локально: ни сервера, ни аккаунтов.

- очередь загрузок с паузой, отменой и повтором, переживает перезапуск;
- история скачанного;
- mp3 одной кнопкой;
- yt-dlp обновляется сам при запуске, приложение — по кнопке с GitHub-релизов.

## Установка

Сборки лежат в [релизах](https://github.com/Kkaprizzz/sfloader/releases/latest).

- **Linux:** `SFLoader-X.Y.Z.AppImage` — `chmod +x` и запустить. Обновляется сам.
- **Windows:** `SFLoader-Setup-X.Y.Z.exe` — установщик, обновляется сам.
  `SFLoader-X.Y.Z-portable.exe` — без установки, о новой версии только сообщает.
  Сборки не подписаны, поэтому SmartScreen при первом запуске предупредит:
  «Подробнее» → «Выполнить в любом случае».

## Разработка

Нужен Node 20.19 или новее (`nvm use` подхватит `.nvmrc`).

```
cd front
npm install
npm run setup:bin   # один раз: свежий yt-dlp под твою ОС в resources/bin
npm start           # Vite + окно Electron
```

Если в терминале выставлен `ELECTRON_RUN_AS_NODE=1` (так делает встроенный
терминал VS Code), Electron запустится как голый Node — сними переменную:
`env -u ELECTRON_RUN_AS_NODE npm start`.

## Сборка

Локально, под текущую ОС:

```
cd front
npm run setup:bin
npm run dist:linux   # или dist:win на Windows
```

Результат — в `front/release`.

## Релиз

Версия берётся из `front/package.json`. Поднять её, закоммитить и запушить тег:

```
git tag v2.0.1
git push origin v2.0.1
```

GitHub Actions соберёт AppImage и Windows-сборки и сложит их в черновик релиза
вместе с `latest.yml` / `latest-linux.yml`, по которым работает автообновление.
Черновик проверить и опубликовать руками.

## Как устроено

```
front/
  electron/
    main.cjs       окно, трей, IPC
    queue.cjs      очередь: параллельность, пауза, повторы, сохранение
    history.cjs    история загрузок
    ytdlp.cjs      запуск yt-dlp, разбор прогресса
    updaters.cjs   обновление yt-dlp и приложения
    settings.cjs   настройки
  src/             интерфейс на React (см. DESIGN.md в корне)
  scripts/         setup-bin.mjs — скачивает yt-dlp с проверкой SHA256
```

Данные (настройки, очередь, история, обновлённый yt-dlp) лежат в папке данных
приложения: `~/.config/sfloader` на Linux, `%APPDATA%\sfloader` на Windows.

YouTube требует JS-рантайм: yt-dlp запускается с `--js-runtimes node:<exe>`
и `ELECTRON_RUN_AS_NODE=1`, то есть Node берётся из самого Electron.

Интерфейс не имеет прямого доступа к Node — только IPC из `electron/preload.cjs`.

## Если не запускается на Linux

На Wayland у Electron падает GPU-процесс. Приложение само перезапускается на X11,
но если что-то пошло не так, запусти вручную с `--ozone-platform=x11`.
