import React, { useEffect, useRef, useState } from 'react';
import { APP_REGISTRY } from '../../app/appRegistry';
import SakugaButton from '../../app/components/SakugaButton';
import SakugaInput from '../../app/components/SakugaInput';
import { loadSakuga } from '../../app/components/sakugaLoader';
import { topicHint, guardReply } from './topicHint';

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

export default function LazyAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    loadSakuga('button', 'input');
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, busy, error]);

  useEffect(() => () => abortRef.current?.abort(), []);

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

    const history = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
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
      setMessages([...history, { role: 'assistant', content: guardReply(reply, history) }]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(history);
      setError(describeError(err));
      setDraft(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-24 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-28" onKeyDown={onKeyDown}>
      {open && (
        <section
          role="dialog"
          aria-label="Assistant"
          className="flex h-[min(30rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-lg"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-subtle px-4 py-3">
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
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <p
                  key={i}
                  className="max-w-[85%] self-end whitespace-pre-wrap rounded-lg bg-accent-soft px-3 py-2 text-ink"
                >
                  {m.content}
                </p>
              ) : (
                <p
                  key={i}
                  className="max-w-[85%] self-start whitespace-pre-wrap rounded-lg bg-surface-subtle px-3 py-2 text-ink"
                >
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

      <SakugaButton ref={launcherRef} expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide assistant' : 'Need help?'}
      </SakugaButton>
    </div>
  );
}
