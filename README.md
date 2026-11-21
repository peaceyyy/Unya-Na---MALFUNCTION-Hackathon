# unproductive-os

An intentionally unproductive dashboard OS.

## Requirements

The first three rows are all the app itself needs. The rest switch on the assistant, the reels and the
dance screen, and the app still runs without them.

| What | Needed for | Notes |
| --- | --- | --- |
| [Bun](https://bun.sh) 1.x | installing and running the app | tested with 1.4 |
| [Node.js](https://nodejs.org) 20.19+ or 22.12+ | the Vite dev server | tested with 24 |
| A Chromium browser (Chrome or Edge) with WebGL | everything | the pose tracking uses the GPU |
| [Ollama](https://ollama.com) with the `llama3.2:3b` model | the lazy assistant | a local LLM, about 2 GB to download; fits in 4 GB of video memory |
| Python 3.10+ (3.11 tested) | the Instagram reels | only for Reels mode |
| A spare Instagram account | the Instagram reels | not your main account; see below |
| A webcam | Just dance | allow camera access when the browser asks |

An internet connection is also used for the weather card (Open-Meteo), the Subway Surfers clip (YouTube),
the one-time download of the pose model (a few MB), and Instagram.

## Install

```bash
bun install
```

That installs the app's packages. The Python side installs itself the first time you run it (see
"Instagram reels" below), and the model for the assistant is pulled once with Ollama (see "Local LLM").

## Run

```bash
bun dev
```

Open the address it prints (normally http://localhost:5173). On the login screen any email and password
work, then pass the captcha. That is all the app needs; the two optional pieces below run next to it in
their own terminals:

| Terminal | Command | What it adds |
| --- | --- | --- |
| 1 | `bun dev` | the app |
| 2 | `ollama serve` (or just open the Ollama app) | the assistant's brain |
| 3 | `reels-server\start.bat` (Windows) | Instagram reels in the video corner |

The assistant and the reels reach their servers through proxies built into the Vite dev server
(`vite.config.js`), so use `bun dev` (or `bun run preview`), not a plain static file host. If you change
`vite.config.js`, restart `bun dev`.

For a production build: `bun run build`, then `bun run preview` to try it.

## Local LLM (the lazy assistant)

The "Need help?" assistant runs on a model on your own computer through Ollama. Nothing you type is sent
to a cloud service. Without Ollama the rest of the app works and the assistant says it cannot reach it.

1. Install Ollama from https://ollama.com/download and start it (the app, or `ollama serve`). It listens
   on http://localhost:11434.
2. Download the model once:
   ```bash
   ollama pull llama3.2:3b
   ```
3. Check that it is there with `ollama list`, then open the app and press **Need help?**.

The model name is the `MODEL` constant at the top of `src/features/assistant/LazyAssistant.jsx`. A bigger
model answers better but needs more memory; this one was picked to fit in 4 GB of video memory.

## Instagram reels (optional)

The Subway / Reels switch in the video corner plays Instagram reels. A browser cannot read Instagram
directly, so a small Python server in `reels-server/` does it with
[instagrapi](https://github.com/subzeroid/instagrapi), and the app talks to that.

**Use a spare Instagram account.** instagrapi is unofficial and Instagram's terms do not allow it, so
Instagram can lock or restrict accounts that use it. Never use your main account.

1. Create the settings file. In `reels-server`, copy `.env.example` to `.env` and fill it in:
   ```
   IG_USERNAME=your_spare_account
   IG_PASSWORD=its_password
   IG_VERIFICATION_CODE=
   ```
   Put a current code from your authenticator app in `IG_VERIFICATION_CODE` only if the account has
   two-factor login, and only the first time. `.env` and the `session.json` the server saves after logging
   in are git-ignored and hold your login, so never commit or share them.
2. Run the Python server and leave it open:
   - **Windows:** `reels-server\start.bat` (in PowerShell from inside the folder: `.\start.bat`). It makes
     its own virtual environment, installs the packages the first time, and runs `app.py`.
   - **macOS / Linux:**
     ```bash
     cd reels-server
     python3 -m venv .venv
     .venv/bin/pip install -r requirements.txt
     .venv/bin/python app.py
     ```
   It listens on http://127.0.0.1:8765, on this computer only. Run it with the virtual environment's Python
   as above. A bare `python app.py` can pick a different Python that lacks the packages, which gives
   `No module named 'httpx'`.
3. With `bun dev` running too, press the lock button in the bottom-right corner and choose **Reels**.

To try the player with no Instagram account at all, put some `.mp4` files in `reels-server/mock_videos/`
and add `REELS_MOCK_DIR=./mock_videos` to `.env`. More detail, and what to do when Instagram stops
answering, is in `reels-server/README.md`.

## Troubleshooting

| You see | Fix |
| --- | --- |
| The assistant says it "could not reach Ollama" | Start Ollama, run `ollama pull llama3.2:3b`, restart `bun dev`. |
| Reels says "The reels server is not running" | Start `reels-server\start.bat`, then press **Try again**. |
| Reels says "Set IG_USERNAME and IG_PASSWORD" | Fill in `reels-server/.env`, restart the Python server, press **Try again**. |
| `No module named 'httpx'` | Run `start.bat` instead of `python app.py`. |
| The dance screen says the camera is blocked | Allow camera access for the site in your browser, then press **Try again**. |
| The dance screen says it could not load the pose model | Check your connection (the model downloads once), then press **Try again**. |

## Features

### Horizontal scrolling
The home dashboard is one long sideways track instead of a page. From left to right: the daily
demotivation quote and yesterday's weather, the row of apps, an "End of the line" card, and then
the Unnecessary Void, an absurdly long empty corridor (about 100,000 px) with milestones along the
way. The mouse wheel scrolls it sideways; a vertical wheel turn moves the track left or right, and
panels that scroll vertically on their own keep doing so. Opened apps use a normal vertical page.
Code: `src/app/layout/DashboardLayout.jsx`, `src/features/extras/UnnecessaryVoid.jsx`.

### Just dance
A button in the top bar. Pressing it opens the camera and a dance screen. Dancing with your upper
body (arms and shoulders, no legs needed) raises the interface opacity by 20% each time the app
detects a dance. Pressing the button does not change the opacity by itself.
- Pose tracking runs in the browser with TensorFlow.js (MoveNet). Nothing is uploaded.
- The model is loaded in the background as soon as you sign in (download, GPU setup and one warm-up
  frame), and a copy is kept in the browser's storage, so the dance screen opens quickly and later
  visits do not download it again. It is skipped if the browser has "data saver" on.
- It counts as a dance when the arms travel at least one shoulder-width per second and change
  direction at least three times within two seconds. Standing still, one big sweep, or slow
  drifting does not count.
- Once the opacity is at 30% or more a **Done** button appears. At 100% the screen closes by itself.
- The same screen opens automatically if the opacity ever fades to 0% (see below).
- Code: `src/features/dance/`. The step and the minimum are `DANCE_STEP` and `DANCE_STOP_AT` in
  `src/app/context/OpacityContext.jsx`.

### Daylight view and flashlight view
The light switch in the top bar flips between two looks.
- **Daylight view:** the normal interface.
- **Flashlight view:** the screen goes dark and you only see what is under a spotlight that follows
  your cursor.

The choice is remembered between visits, and the app starts in flashlight view until you switch it.
Code: `src/app/context/ThemeContext.jsx`, `src/app/components/LightSwitch.jsx`,
`src/app/components/FlashlightOverlay.jsx`.

### Meralco and VECO blackouts
While you are signed in, the power is cut every 3 minutes. The utility is Meralco or VECO, picked at
random each time.
1. A blackout starts every 3 minutes (the first one 3 minutes after you sign in).
2. The utility posts an advisory with a countdown 30 seconds before the cut.
3. The power goes out for 15 seconds. The app is forced into flashlight view and the light switch
   is locked, so you cannot go back to daylight until the power returns.
4. When the power returns, the view you had before the cut comes back, until the next one.

Reloading the page or logging out ends a blackout early. Code: `src/app/context/PowerContext.jsx`,
`src/features/power/PowerNotice.jsx`; the timings are constants at the top of the context file.

### Opacity fading from inactivity
The whole interface slowly loses opacity while you do nothing: 1% every second. Moving the mouse,
pressing a key, scrolling or touching the screen holds the fade off for that second. The slider in
the top bar shows the current opacity. At 0% the interface is invisible and the dance screen
appears; dancing is the only way back. The fade pauses while the dance screen is open.
Code: `src/app/context/OpacityContext.jsx`.

### Jose Mari Chan
He leans in from the bottom-right corner of the note panel on the Aztec Calendar page. Click him
and he tells you how many days are left until Christmas, written in Nahuatl, the Aztec language
(counted in twenties, as the Aztecs did), along with the Aztec day name Christmas falls on. The
Nahuatl numerals were written from memory, so they have not been checked by a speaker.
Code: `src/features/calendar/AztecCalendar.jsx`, image in `public/jose-mari-chan.png`.

### Doomscroll: Subway Surfers or Instagram reels
The lock button in the bottom-right corner opens a small vertical video player. A switch in its
top-left corner picks what to watch: **Subway** (the looping Subway Surfers clip) or **Reels**.
Reels mode plays Instagram reels and moves to the next one every 15 seconds, whatever the reel's
own length. Hover the player for previous, pause, next and mute. The choice is remembered.

Both the video corner and the assistant can be dragged anywhere on the screen: drag the "Lock In"
and "Need help?" buttons, the thin strip at the top of the video player, or the assistant's header.
They stay on screen, remember where you put them, and double-clicking the strip or header puts them
back in their corner. Code: `src/app/hooks/useMovable.js`.

While you scroll reels, the lazy assistant also comments on them: about every second or third reel
it reacts in its tired voice, as a pop-up next to the "Need help?" button, or in the chat if that is
open. It cannot see video (it is a small text model), so it reacts to what Instagram provides as
text: the account name, the caption, Instagram's automatic description when a post has one, and the
sound's name.

Reels come from a small Python server that you run yourself (`reels-server/`), because a browser
cannot read Instagram directly. It uses instagrapi with a spare Instagram account, which Instagram's
terms do not allow, so read `reels-server/README.md` before using it. Without the server running, the
Reels tab shows how to start it. Code: `src/features/extras/Doomscroll.jsx`,
`src/features/extras/ReelsPlayer.jsx`, `reels-server/app.py`.

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
│   │   ├── context/             (theme, opacity fade, power cuts)
│   │   └── hooks/               (useMovable: draggable widgets)
│   │
│   ├── features/
│   │   ├── assistant/           (the lazy assistant and its topic hints)
│   │   ├── dance/               (Just dance: pose detection and the dance screen)
│   │   ├── power/               (Meralco / VECO blackout notice)
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
├── reels-server/                (Python server for Instagram reels: app.py, start.bat, .env.example)
│
├── package.json
├── vite.config.js
└── README.md
```

