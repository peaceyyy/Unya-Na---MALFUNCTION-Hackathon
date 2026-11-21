# unproductive-os

An intentionally unproductive dashboard OS.

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
While you are signed in, the power is cut at random. The utility is Meralco or VECO, picked at
random each time.
1. The power stays on for a random 1 to 2 minutes.
2. The utility posts an advisory with a countdown 30 seconds before the cut.
3. The power goes out for 15 seconds. The app is forced into flashlight view and the light switch
   is locked, so you cannot go back to daylight until the power returns.
4. When the power returns, the view you had before the cut comes back and the cycle starts again.

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
