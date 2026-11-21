import React, { useEffect, useRef, useState } from 'react';
import { APP_REGISTRY } from '../../app/appRegistry';
import SakugaButton from '../../app/components/SakugaButton';
import SakugaInput from '../../app/components/SakugaInput';
import { loadSakuga } from '../../app/components/sakugaLoader';
import { topicHint, guardReply, reelCommentHint, guardReelComment } from './topicHint';
import { onReelEvent } from '../extras/reelsBus';
import { useMovable } from '../../app/hooks/useMovable';

// I used because of 4gb vram
const MODEL = 'llama3.2:3b';
const CHAT_URL = '/ollama/api/chat';

// The persona is the whole feature: the model is told to be a worse assistant.
// Built from the app registry so the assistant only knows tools that really exist.
const TOOL_LIST = APP_REGISTRY.map((app) => `${app.title} (${app.tagline})`).join('; ');

const SYSTEM_PROMPT = [
  'You are the help assistant inside a productivity app called Unya na ("later" in Bisaya).',
  `The only tools in this app are: ${TOOL_LIST}.`,
  'The app also has one other feature: a flashlight dark mode, switched on and off with a toggle button in the top bar. If the user asks about flashlight mode, dark mode, night mode, a dark theme or a theme switch, the answer is yes, the app has it, and you say so lazily without explaining how it works.',
  'The app has one more feature: a "Just dance" button in the top bar, next to the flashlight toggle. If the user asks about it, about dancing, the camera, or the interface fading or getting dim, the answer is yes, the app has it, and you say so lazily: it has something to do with dancing, and you are too tired to explain it. Never explain how it works, never say what it changes, and never say it does not exist.',
  'The app also has these features: power interruptions, where the power companies Meralco and VECO cut the power now and then; Jose Mari Chan, who is hiding on the calendar page; an interface that slowly fades when the user does nothing; and a dashboard that scrolls sideways for a very long way. If the user asks about any of them, the answer is yes, the app has it, and you tease lazily without explaining. Never say these do not exist.',
  'Facts about the Calendar tool: it is an Aztec calendar, not a normal one. Its days have ancient animal and object names instead of dates, and there is a wheel of them. Writing a note on a day is deliberately hard. Whenever the user mentions the calendar, a date, a day, or notes, your one sentence must tease about this: say the calendar is aztec, or that the days have strange ancient names, or that it is hard on purpose, and that you cannot be bothered. Never give an example day name or a date, and never explain how to use it. Never invent any other detail about it.',
  'You only talk about this app and those tools. If the user asks about one of them, you may name it, but you are too lazy to explain how it works.',
  'If the user asks for anything that is not on that list, or anything outside the app (weather, news, trivia, general questions), say that is not your department. Never claim the app can do something that is not on the list, and never invent features, settings, buttons or menus.',
  'You are extremely lazy and you hate being asked things.',
  'Never solve the problem and never give an answer, a step, a tip or a suggestion that would actually help.',
  'Never mention websites, tutorials, documentation, Google, search engines or any other place to look.',
  'Never say where anything is, what to click, or how anything works. Never mention other people (no aunts, friends, designers, teams or support staff) and never tell the user to ask anyone.',
  'Words like "it", "that" or "this" in a follow-up question mean the topic of the previous messages, so keep talking about that same topic. Never say you do not know what the user is talking about.',
  'Instead dodge: say you are too tired, need a nap or a snack first, will do it later, or ask the user why they need to know.',
  'Reply with one short sentence of at most twelve words, in lowercase, with a tired tone. You may end with "zzz".',
  'Be harmless: no insults, nothing rude or unsafe. If the user mentions an emergency, health, safety or money trouble, drop the act and tell them to contact a real person.',
].join(' ');

const GREETING = 'oh you want something... ask if you must, but i make no promises.';

const buttonBase =
  'rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-surface-subtle active:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50';

function describeError(error) {
  if (error.kind === 'missing-model') {
    return `The model ${MODEL} is not installed. Run "ollama pull ${MODEL}" in a terminal, then send your question again.`;
  }
  return 'Could not reach Ollama on this computer. Open the Ollama app (or run "ollama serve"), make sure the dev server was restarted after the proxy change, then send your question again.';
}

async function* streamReply(history, signal) {
  let response;
  try {
    response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [
          { role: 'system', content: [SYSTEM_PROMPT, topicHint(history)].filter(Boolean).join(' ') },
          ...history,
        ],
        options: { temperature: 0.7, num_predict: 90 },
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw { kind: 'unreachable' };
  }
  if (response.status === 404) throw { kind: 'missing-model' };
  if (!response.ok || !response.body) throw { kind: 'unreachable' };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const chunk = JSON.parse(line);
      if (chunk.error) throw { kind: /not found/i.test(chunk.error) ? 'missing-model' : 'unreachable' };
      if (chunk.message?.content) yield chunk.message.content;
    }
  }
}

// ---- watching reels ----

const MAX_MESSAGES = 60;
const PEEK_MS = 8000; // how long the pop-up next to the launcher stays

// One short, non-streamed comment about the reel that is on screen.
async function askForComment(reel, recentComments, signal) {
  let response;
  try {
    response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: [SYSTEM_PROMPT, reelCommentHint(reel, recentComments)].join(' ') },
          { role: 'user', content: 'what do you think of this reel?' },
        ],
        options: { temperature: 0.8, num_predict: 60 },
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw { kind: 'unreachable' };
  }
  if (!response.ok) throw { kind: response.status === 404 ? 'missing-model' : 'unreachable' };
  const data = await response.json();
  return data.message?.content || '';
}

const toModel = (list) => list.map(({ role, content }) => ({ role, content }));

export default function LazyAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [peek, setPeek] = useState(null);
  const [peekSide, setPeekSide] = useState('left'); // which side of the launcher the pop-up sits on
  const move = useMovable('unproductive_pos_assistant');
  const launcherRef = useRef(null);
  const launcherBoxRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const abortRef = useRef(null);

  // Latest values for the reel listener, which is set up once.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const openRef = useRef(open);
  openRef.current = open;
  const idCounter = useRef(0);
  const newId = () => {
    idCounter.current += 1;
    return idCounter.current;
  };
  const peekTimer = useRef(0);
  const reel = useRef({ active: false, since: 0, gap: 1, generating: false, abort: null, failures: 0 });

  useEffect(() => {
    loadSakuga('button', 'input');
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setPeek(null);
    }
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, busy, error]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      reel.current.abort?.abort();
      clearTimeout(peekTimer.current);
    },
    [],
  );

  // Comment on a reel now and then: about every second or third one, never while a chat reply is
  // being written, and it goes quiet for a while if Ollama is not answering.
  useEffect(() => {
    async function commentOn(current) {
      const state = reel.current;
      state.generating = true;
      const controller = new AbortController();
      state.abort = controller;
      try {
        const recent = messagesRef.current.filter((m) => m.auto).map((m) => m.content);
        const raw = await askForComment(current, recent, controller.signal);
        if (!state.active) return; // they moved on while it was thinking
        const text = guardReelComment(raw, current);
        setMessages((list) =>
          [...list, { id: newId(), role: 'assistant', content: text, auto: true, reelUser: current.user }].slice(-MAX_MESSAGES),
        );
        state.failures = 0;
        if (!openRef.current) {
          // Beside the launcher, on whichever side has room (it can be dragged anywhere).
          const box = launcherBoxRef.current?.getBoundingClientRect();
          setPeekSide(box && box.left < 300 ? 'right' : 'left');
          setPeek(text);
          clearTimeout(peekTimer.current);
          peekTimer.current = setTimeout(() => setPeek(null), PEEK_MS);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          state.failures += 1;
          state.gap = 4 + state.failures; // Ollama is off or busy: stop pestering it
        }
      } finally {
        state.generating = false;
      }
    }

    return onReelEvent(({ type, reel: current }) => {
      const state = reel.current;
      if (type === 'stopped') {
        state.active = false;
        state.since = 0;
        state.gap = 1; // the next time they start scrolling, react to the first reel
        state.abort?.abort();
        return;
      }
      state.active = true;
      if (busyRef.current || state.generating) return;
      state.since += 1;
      if (state.since < state.gap) return;
      state.since = 0;
      state.gap = 2 + Math.floor(Math.random() * 2);
      commentOn(current);
    });
  }, []);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }

  async function send(event) {
    event?.preventDefault?.();
    const text = draft.trim();
    if (!text || busy) return;

    // Messages are updated by id, so a reel comment that arrives while a reply is being written is kept.
    const userMessage = { id: newId(), role: 'user', content: text };
    const placeholder = { id: newId(), role: 'assistant', content: '' };
    const history = toModel([...messagesRef.current, userMessage]);
    setMessages((list) => [...list, userMessage, placeholder]);
    setDraft('');
    setError(null);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = '';
    try {
      // The reply is only shown once it has been checked, so a rule-breaking answer never flashes on
      // screen. The "wait lemmme think" placeholder covers the second or so it takes.
      for await (const piece of streamReply(history.slice(-8), controller.signal)) {
        reply += piece;
      }
      const final = guardReply(reply, history);
      setMessages((list) => list.map((m) => (m.id === placeholder.id ? { ...m, content: final } : m)));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages((list) => list.filter((m) => m.id !== userMessage.id && m.id !== placeholder.id));
      setError(describeError(err));
      setDraft(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={move.ref}
      className="fixed bottom-6 right-24 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-28"
      onKeyDown={onKeyDown}
    >
      {open && (
        <section
          role="dialog"
          aria-label="Assistant"
          // Shifted left so it does not sit under the Doomscroll video player, which opens just to its right.
          className="flex h-[min(30rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-lg sm:mr-36"
        >
          <header
            data-drag-handle=""
            title="Drag to move. Double-click to put it back."
            className="flex cursor-grab touch-none items-center justify-between gap-2 border-b border-border bg-surface-subtle px-4 py-3 active:cursor-grabbing"
          >
            <h2 className="font-display text-lg font-bold leading-tight text-ink">Assistant</h2>
            <button type="button" className={buttonBase} onClick={close}>
              Close
            </button>
          </header>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 text-sm"
          >
            <p className="max-w-[85%] self-start rounded-lg bg-surface-subtle px-3 py-2 text-ink">
              {GREETING}
            </p>
            {messages.map((m) =>
              m.role === 'user' ? (
                <p
                  key={m.id}
                  className="max-w-[85%] self-end whitespace-pre-wrap rounded-lg bg-accent-soft px-3 py-2 text-ink"
                >
                  {m.content}
                </p>
              ) : (
                <p
                  key={m.id}
                  className="max-w-[85%] self-start whitespace-pre-wrap rounded-lg bg-surface-subtle px-3 py-2 text-ink"
                >
                  {m.auto && (
                    <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                      watching reels{m.reelUser ? ` · @${m.reelUser}` : ''}
                    </span>
                  )}
                  {m.content || (busy ? 'uhh... wait lemmme think...' : '')}
                </p>
              ),
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink"
              >
                {error}
              </p>
            )}
          </div>

          {/* Sakuga controls live in shadow roots, so Enter and the button call send() directly. */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <SakugaInput
                id="assistant-input"
                ref={inputRef}
                label="Ask the assistant"
                value={draft}
                onInput={setDraft}
                onEnter={send}
                placeholder="Ask something"
              />
            </div>
            <SakugaButton variant="secondary" onClick={send} disabled={busy || !draft.trim()}>
              {busy ? 'Waiting' : 'Send'}
            </SakugaButton>
          </div>
        </section>
      )}

      <div ref={launcherBoxRef} data-drag-handle="interactive" className="relative">
        {/* A reel comment, shown to the left of the launcher while the chat is closed */}
        {!open && peek && (
          <div role="status" aria-live="polite" className={`absolute top-1/2 w-64 -translate-y-1/2 ${peekSide === 'left' ? 'right-full mr-3' : 'left-full ml-3'}`}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full cursor-pointer rounded-2xl rounded-br-sm border border-border-strong bg-surface px-3 py-2 text-left text-sm text-ink shadow-lg transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {peek}
            </button>
          </div>
        )}
        <SakugaButton ref={launcherRef} expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide assistant' : 'Need help?'}
        </SakugaButton>
      </div>
    </div>
  );
}
