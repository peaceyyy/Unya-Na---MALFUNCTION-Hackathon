# Reels server

A small local Python server for the Doomscroll corner's **Reels** mode. A browser cannot talk
to Instagram's private API, so this server does it with [instagrapi](https://github.com/subzeroid/instagrapi),
gives the page a list of reels, and streams each video to it. It only listens on `127.0.0.1`, so
nothing outside this computer can reach it.

In the app: press **Lock In** (the lock button, bottom right), then choose **Reels** instead of
**Subway**. Each reel plays for 15 seconds and then the next one starts. Shorter reels loop until
the 15 seconds are up; longer ones are cut off. Hover the player for previous, pause, next and mute.

## Set up

You need Python 3.10 or newer (3.11 is what this was tested with).

1. Copy `.env.example` to `.env` and fill in `IG_USERNAME` and `IG_PASSWORD`.
2. Start the server:
   - **Windows:** run `reels-server\start.bat`. It makes its own virtual environment in `.venv`,
     installs the packages the first time, and starts the server. Nothing else to do. (In
     PowerShell, from inside the `reels-server` folder, type `.\start.bat`; PowerShell does not run
     commands from the current folder without the `.\`.)
   - **macOS / Linux:**
     ```bash
     cd reels-server
     python3 -m venv .venv
     .venv/bin/pip install -r requirements.txt
     .venv/bin/python app.py
     ```
3. In another terminal, from the project root, start the app with `bun dev`.

Run the server with the virtual environment's own Python (as above), not a bare `python`. If you
have more than one Python installed, a bare `python` may be a different one from the one the
packages went into, and you get errors like `No module named 'httpx'`. If you do see that, the
message names the Python you ran; `start.bat` avoids the problem.

The Vite dev server forwards `/reels-api` to the reels server on port 8765, so there is nothing to
configure in the app. If the server is not running, the Reels tab says so and shows the command.

## Try it without Instagram

Put a few `.mp4` files in `reels-server/mock_videos/` and start the server with
`REELS_MOCK_DIR=./mock_videos` (set it in `.env`). The player then plays those files and never
contacts Instagram, which is handy for checking the player without risking an account.

## Read this before using a real account

- **instagrapi is unofficial.** It uses Instagram's private app API, which Instagram's terms do not
  allow, and Instagram can force a password reset or lock an account that uses it. **Use a spare
  account, not your main one.**
- **Two-factor login:** put a current code in `IG_VERIFICATION_CODE` the first time. After a
  successful login the session is saved in `session.json` and reused, so the code is not needed again.
- **Keep your credentials private.** `.env` and `session.json` are in `.gitignore`. `session.json`
  is a logged-in session, so treat it like a password and never commit or share it.
- **It is gentle on purpose.** The server logs in only when a reel is first asked for, never more
  than once every 90 seconds after a failed login, and pauses a second or two between Instagram
  requests. At one reel per 15 seconds the app asks for a new batch only about every couple of minutes.
- **Video links expire** a few hours after Instagram hands them out. The server refreshes an expired
  link automatically, which is why the videos go through it instead of straight to the browser.

## If Instagram stops answering

You may see lines like `[reels] video 123: stream interrupted (ReadTimeout)` or `[reels] feed:
Instagram did not answer`. They mean your connection to Instagram stalled for a moment (a VPN, a busy
network, or Instagram itself), not that something is broken. The player simply moves on to the next
reel after its 15 seconds, and asks for more reels again later. If it keeps happening, try without a
VPN. If the Reels tab says "Reels would not play", press **Try again**.

## Endpoints

| Route | What it does |
| --- | --- |
| `GET /api/reels/status` | Which mode it is in and whether it is logged in |
| `GET /api/reels/feed?count=8` | A batch of reels (`?hashtag=name` browses a hashtag instead) |
| `GET /api/reels/video/{id}` | Streams one video, with Range support so seeking and looping work |

Errors come back as `{"reason": "...", "message": "..."}`; the player shows the message.
