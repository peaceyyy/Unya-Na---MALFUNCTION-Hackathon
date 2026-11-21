"""Local reels server for the Doomscroll corner.

The browser cannot talk to Instagram's private API, so this small server does it with
instagrapi, then hands the browser a list of reels and streams each video file to it.

It only listens on 127.0.0.1 (this computer). Run it with:

    python app.py

Settings come from environment variables or a reels-server/.env file (see .env.example):

    IG_USERNAME / IG_PASSWORD   the Instagram account to browse reels with
    IG_VERIFICATION_CODE        a current 2-factor code, if the account has 2FA
    REELS_MOCK_DIR              a folder of .mp4 files: plays those instead of Instagram,
                                with no login. Handy for trying the player out.
"""

import logging
import os
import random
import re
import sys
import threading
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

try:
    import httpx
    from fastapi import FastAPI, Query, Request
    from fastapi.concurrency import run_in_threadpool
    from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
except ImportError as missing:
    # Several Pythons on one machine is the usual cause: packages went into a different one.
    sys.exit(
        "\n".join(
            [
                "",
                f"Missing Python package: {missing.name}",
                f"You ran this with: {sys.executable}",
                "",
                "Easiest fix on Windows: run start.bat in this folder. It makes its own virtual",
                "environment, installs everything and starts the server.",
                "",
                "Or install into the Python above:",
                f'  "{sys.executable}" -m pip install -r requirements.txt',
                "",
            ]
        )
    )

HERE = Path(__file__).resolve().parent


def load_env_file(path: Path) -> None:
    """Tiny .env reader so there is no extra dependency. Real environment variables win."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file(HERE / ".env")

SESSION_FILE = Path(os.environ.get("IG_SESSION_FILE", HERE / "session.json"))
LOGIN_COOLDOWN_SECONDS = 90  # never hammer Instagram with login attempts
URL_MAX_AGE_SECONDS = 90 * 60  # Instagram's video links expire after a few hours
ALLOWED_VIDEO_HOSTS = ("cdninstagram.com", "fbcdn.net")  # the proxy is not an open relay
INSTAGRAM_READ_TIMEOUT = 15  # seconds to wait on one instagrapi request
FIRST_FETCH_AMOUNT = 10  # the first request is small, so the first reel appears quickly
FETCH_AMOUNT = 24  # after that, reels asked for from Instagram at a time (a few pages); the player gets 8 at a time
SERVED_MEMORY = 3000  # how many shown reel ids to remember, so they are not shown again
UPSTREAM_TIMEOUT = httpx.Timeout(connect=10, read=30, write=10, pool=10)  # for streaming videos


def log(message: str) -> None:
    """One short line, instead of the long tracebacks that network hiccups would otherwise print."""
    print(f"[reels] {message}", flush=True)


# instagrapi prints a full traceback for every network timeout. Those are reported in one line above
# (and shown in the player), so keep its logger quiet.
logging.getLogger("instagrapi").setLevel(logging.CRITICAL)


class _ShortBodyFilter(logging.Filter):
    """When Instagram's video server stalls part-way, we cut the response short on purpose (and have
    already logged one line about it). uvicorn then complains about the missing bytes with a long
    traceback; that particular complaint carries no extra information, so drop it."""

    def filter(self, record: logging.LogRecord) -> bool:
        exc = record.exc_info[1] if record.exc_info else None
        return not (isinstance(exc, RuntimeError) and "shorter than Content-Length" in str(exc))


logging.getLogger("uvicorn.error").addFilter(_ShortBodyFilter())

app = FastAPI(title="Doomscroll reels server")


def clean_text(value, limit=160):
    """One tidy line of text, or None."""
    return " ".join(str(value).split())[:limit] if value else None


def sound_title(media):
    """The name of the reel's sound ("Song by Artist", or the original audio's title), if any."""
    try:
        meta = media.clips_metadata or {}
        music = (meta.get("music_info") or {}).get("music_asset_info") or {}
        original = meta.get("original_sound_info") or {}
        title = music.get("title") or original.get("original_audio_title")
        artist = music.get("display_artist") or (original.get("ig_artist") or {}).get("username")
        return clean_text(f"{title} by {artist}" if title and artist else title, 100)
    except Exception:
        return None


class SourceError(Exception):
    """Something the player should show to the user. `code` tells it what kind of problem."""

    def __init__(self, code: str, message: str, status: int = 503):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


@app.exception_handler(SourceError)
async def source_error_handler(_request: Request, exc: SourceError):
    return JSONResponse(status_code=exc.status, content={"reason": exc.code, "message": exc.message})


# ---------------------------------------------------------------- mock source

class MockSource:
    """Plays the .mp4 files in a folder, so the player can be tried without Instagram."""

    name = "mock"

    def __init__(self, folder: Path):
        self.folder = folder

    def files(self):
        return sorted(self.folder.glob("*.mp4"))

    def status(self):
        return {"mode": self.name, "configured": True, "loggedIn": True, "videos": len(self.files())}

    def feed(self, count: int, hashtag: Optional[str]):
        files = self.files()
        if not files:
            raise SourceError("empty", f"No .mp4 files in {self.folder}")
        picks = [random.choice(files) for _ in range(count)]
        return [
            {
                "id": f"mock-{p.stem}-{i}-{int(time.time() * 1000) % 100000}",
                "code": p.stem,
                "user": "mock_reels",
                "caption": f"{p.stem} (mock video)",
                "alt": f"Colour bars and a moving test pattern ({p.stem})",
                "sound": f"Test tone by mock_reels",
                "duration": None,
            }
            for i, p in enumerate(picks)
        ]

    def local_file(self, reel_id: str) -> Optional[Path]:
        match = re.match(r"^mock-(.+)-\d+-\d+$", reel_id)
        if not match:
            return None
        path = (self.folder / f"{match.group(1)}.mp4").resolve()
        return path if path.is_file() and self.folder.resolve() in path.parents else None


# ----------------------------------------------------------- Instagram source

class InstagramSource:
    name = "instagram"

    def __init__(self):
        self.client = None
        self.lock = threading.Lock()
        self.last_login_attempt = 0.0
        self.last_error: Optional[SourceError] = None
        self.urls: dict[str, tuple[str, float]] = {}  # reel id -> (video url, when we got it)
        self.feed_lock = threading.Lock()
        self.queue: list[dict] = []  # reels fetched from Instagram but not shown yet
        self.served: dict[str, None] = {}  # ids already shown, oldest first (a capped, ordered set)

    @property
    def configured(self) -> bool:
        return bool(os.environ.get("IG_USERNAME") and os.environ.get("IG_PASSWORD"))

    def status(self):
        return {
            "mode": self.name,
            "configured": self.configured,
            "loggedIn": self.client is not None,
            "error": self.last_error.message if self.last_error else None,
        }

    def ensure_client(self):
        """Log in the first time a reel is asked for, and never more than once per cooldown."""
        with self.lock:
            if self.client is not None:
                return self.client
            if not self.configured:
                raise SourceError(
                    "no-credentials",
                    "Set IG_USERNAME and IG_PASSWORD in reels-server/.env, then restart the server.",
                )
            wait = LOGIN_COOLDOWN_SECONDS - (time.time() - self.last_login_attempt)
            if self.last_error and wait > 0:
                raise SourceError(
                    "login-cooldown",
                    f"Instagram login failed: {self.last_error.message} Waiting {int(wait)}s before trying again.",
                )
            self.last_login_attempt = time.time()
            try:
                try:
                    from instagrapi import Client
                except ImportError:
                    raise SourceError(
                        "missing-package",
                        f"instagrapi is not installed for {sys.executable}. Run start.bat in reels-server, "
                        "or pip install -r requirements.txt with that Python.",
                    )

                client = Client()
                client.delay_range = [1, 3]  # pause a little between requests, like a person
                client.read_timeout = INSTAGRAM_READ_TIMEOUT  # give up on a stalled request sooner (default 25 s)
                if SESSION_FILE.exists():
                    client.load_settings(SESSION_FILE)
                client.login(
                    os.environ["IG_USERNAME"],
                    os.environ["IG_PASSWORD"],
                    verification_code=os.environ.get("IG_VERIFICATION_CODE", ""),
                )
                client.dump_settings(SESSION_FILE)
            except SourceError as error:
                self.last_error = None  # not an Instagram problem, so no login cooldown
                raise error
            except Exception as error:  # instagrapi raises many different login errors
                self.last_error = SourceError("login-failed", f"{type(error).__name__}: {error}")
                raise self.last_error
            self.last_error = None
            self.client = client
            return client

    def to_item(self, media):
        """The bit of a Media object the player needs, or None if it has no video."""
        url = getattr(media, "video_url", None)
        if not url:
            return None
        reel_id = str(media.pk)
        self.urls[reel_id] = (str(url), time.time())
        return {
            "id": reel_id,
            "code": media.code,
            "user": getattr(media.user, "username", None),
            "caption": clean_text(media.caption_text, 140),
            # Instagram's own automatic description (alt text), when a post has one
            "alt": clean_text(getattr(media, "accessibility_caption", None)),
            "sound": sound_title(media),
            "duration": getattr(media, "video_duration", None),
        }

    def feed(self, count: int, hashtag: Optional[str]):
        """Hand out reels that have not been shown yet.

        Instagram's Reels feed is a recommendation list that starts from much the same place on every
        request, so asking again returns mostly the same reels. (instagrapi's `last_media_pk` is not a
        "continue after this one" cursor: it makes the call stop when it meets that reel.) So fetch a
        big batch, keep what is new in a queue, and never hand out the same id twice.
        """
        client = self.ensure_client()
        with self.feed_lock:
            # The very first call stays small (one page), so the first reel shows up quickly.
            amount = FIRST_FETCH_AMOUNT if not self.served and not self.queue else FETCH_AMOUNT
            if hashtag:
                sources = [(f"#{hashtag.lstrip('#')}", lambda: client.hashtag_medias_reels_v1(hashtag.lstrip("#"), amount=amount))]
            else:
                # The Reels tab's recommendations first, then reels from accounts you are connected to.
                sources = [
                    ("explore", lambda: client.explore_reels(amount=amount)),
                    ("connected", lambda: client.reels(amount=amount)),
                ]

            failure = None
            for name, fetch in sources:
                if len(self.queue) >= count:
                    break
                try:
                    medias = fetch()
                except Exception as error:
                    failure = error
                    log(f"feed: {name} did not answer ({type(error).__name__}: {str(error)[:160]})")
                    continue
                queued = {item["id"] for item in self.queue}
                fresh = 0
                for media in medias:
                    item = self.to_item(media)
                    if item and item["id"] not in self.served and item["id"] not in queued:
                        self.queue.append(item)
                        queued.add(item["id"])
                        fresh += 1
                log(f"feed: {name} gave {len(medias)} reels, {fresh} new, {len(self.queue)} waiting")

            if not self.queue and failure is not None:
                raise SourceError("feed-failed", f"Instagram would not give reels: {type(failure).__name__}: {failure}")

            items, self.queue = self.queue[:count], self.queue[count:]
            for item in items:
                self.served[item["id"]] = None
            while len(self.served) > SERVED_MEMORY:  # forget the oldest
                self.served.pop(next(iter(self.served)))
            return items

    def video_url(self, reel_id: str, refresh: bool = False) -> str:
        cached = self.urls.get(reel_id)
        if cached and not refresh and time.time() - cached[1] < URL_MAX_AGE_SECONDS:
            return cached[0]
        client = self.ensure_client()
        try:
            media = client.media_info(reel_id, use_cache=False)
        except Exception as error:
            raise SourceError("video-failed", f"Could not refresh the video link: {error}", status=502)
        if not getattr(media, "video_url", None):
            raise SourceError("video-failed", "That post has no video.", status=404)
        self.urls[reel_id] = (str(media.video_url), time.time())
        return str(media.video_url)


mock_dir = os.environ.get("REELS_MOCK_DIR")
source = MockSource(Path(mock_dir)) if mock_dir else InstagramSource()


# ------------------------------------------------------------------ endpoints

@app.get("/api/reels/status")
def status():
    return source.status()


@app.get("/api/reels/feed")
def feed(count: int = Query(8, ge=1, le=20), hashtag: Optional[str] = None):
    return {"items": source.feed(count, hashtag)}


@app.get("/api/reels/video/{reel_id}")
async def video(reel_id: str, request: Request):
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", reel_id):
        raise SourceError("bad-id", "Bad reel id.", status=400)

    if isinstance(source, MockSource):
        path = source.local_file(reel_id)
        if not path:
            raise SourceError("not-found", "No such video.", status=404)
        return FileResponse(path, media_type="video/mp4")  # supports Range requests

    range_header = request.headers.get("range")
    for attempt in range(2):  # a 403/410 means the link expired: refresh it once and retry
        url = await run_in_threadpool(source.video_url, reel_id, attempt == 1)
        host = urlparse(url).hostname or ""
        if not host.endswith(ALLOWED_VIDEO_HOSTS):
            raise SourceError("bad-host", "Refusing to fetch that address.", status=502)

        client = httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT, follow_redirects=True)
        try:
            upstream = await client.send(
                client.build_request("GET", url, headers={"Range": range_header} if range_header else {}),
                stream=True,
            )
        except httpx.HTTPError as error:  # Instagram's video servers did not answer
            await client.aclose()
            log(f"video {reel_id}: could not reach Instagram's video server ({type(error).__name__})")
            raise SourceError("video-timeout", "Instagram's video server is not answering.", status=504)
        if upstream.status_code in (403, 404, 410) and attempt == 0:
            await upstream.aclose()
            await client.aclose()
            continue

        headers = {
            name: upstream.headers[name]
            for name in ("content-type", "content-length", "content-range", "accept-ranges")
            if name in upstream.headers
        }
        headers.setdefault("accept-ranges", "bytes")

        async def body(upstream=upstream, client=client):
            try:
                async for chunk in upstream.aiter_raw():
                    yield chunk
            except httpx.HTTPError as error:
                # The connection to Instagram stalled part-way. Headers are already sent, so all that
                # is left is to stop; the player moves on to the next reel (or asks again).
                log(f"video {reel_id}: stream interrupted ({type(error).__name__}); the player will move on")
            finally:
                await upstream.aclose()
                await client.aclose()

        return StreamingResponse(
            body(),
            status_code=upstream.status_code,
            headers=headers,
            media_type=upstream.headers.get("content-type", "video/mp4"),
        )
    raise SourceError("video-failed", "Instagram would not serve that video.", status=502)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("REELS_PORT", "8765")))
