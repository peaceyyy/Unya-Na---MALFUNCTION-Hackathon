# unproductive-os

An intentionally unproductive dashboard OS.

## Project Structure

```
unproductive-os/
│
├── public/
│   └── assets/
│
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── layout/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── DashboardLayout.module.css
│   │   └── components/
│   │       ├── WidgetCard.jsx
│   │       └── WidgetCard.module.css
│   │
│   ├── features/
│   │   ├── captcha/
│   │   │   ├── Captcha.jsx
│   │   │   └── Captcha.module.css
│   │   │
│   │   ├── calendar/
│   │   │   ├── AztecCalendar.jsx
│   │   │   └── AztecCalendar.module.css
│   │   │
│   │   ├── quotes/
│   │   │   ├── DemotivationalQuote.jsx
│   │   │   └── DemotivationalQuote.module.css
│   │   │
│   │   ├── notepad/
│   │   │   ├── AutocorrectNotepad.jsx
│   │   │   └── AutocorrectNotepad.module.css
│   │   │
│   │   ├── tasks/
│   │   │   ├── MouseTaskList.jsx
│   │   │   ├── ReverseEisenhower.jsx
│   │   │   └── Tasks.module.css
│   │   │
│   │   ├── pomodoro/
│   │   │   ├── ReversePomodoro.jsx
│   │   │   └── ReversePomodoro.module.css
│   │   │
│   │   └── extras/
│   │       ├── YesterdayWeather.jsx
│   │       ├── BinaryCalculator.jsx
│   │       ├── DelayedAlarm.jsx
│   │       ├── AvoidantButton.jsx
│   │       ├── Doomscroll.jsx
│   │       ├── SpotifyWidget.jsx
│   │       └── Translator.jsx
│   │
│   ├── hooks/
│   ├── utils/
│   ├── assets/
│   └── main.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Development
```bash
bun dev
```

### Production Build
```bash
bun run build
```
