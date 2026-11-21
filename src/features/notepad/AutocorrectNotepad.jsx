import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  getAutocorrectSuggestion,
  shouldEnforceLowercaseAfterPeriod,
} from './cursedTransformations';
import styles from './AutocorrectNotepad.module.css';

const DENIAL_SNACKBAR_QUOTES = [
  '🚫 Suggestion rejected: Autocorrect suggestions on Unproductive OS are strictly view-only.',
  '❌ Nice try! Google Docs Autocorrect says: you cannot choose this suggestion.',
  '🔒 Action forbidden: Advice may be viewed, but never accepted.',
  '⚠️ Did you really click "Accept"? Not on Unproductive OS.',
  '😴 Unya na: Accepting suggestions takes more effort than this system allows.',
];

export default function AutocorrectNotepad() {
  const [docTitle, setDocTitle] = useState('My Highly Productive Notes');
  const [content, setContent] = useState(
    'I have a lot of work today and my deadline is important.\nOur team meeting about the project should start now.\nWe will finish the task and study everything carefully.\n'
  );
  const [activeWordInfo, setActiveWordInfo] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 120, left: 160 });
  const [isPopoverDodge, setIsPopoverDodge] = useState(false);
  const [isPopoverShaking, setIsPopoverShaking] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState(null);
  const [blockedCount, setBlockedCount] = useState(0);
  const [fontSize, setFontSize] = useState('11');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const audioCtxRef = useRef(null);
  const snackbarTimeoutRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimeout(snackbarTimeoutRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Web Audio denial boop
  const playDenialSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio fallback
    }
  }, []);

  // Trigger denial snackbar
  const triggerSnackbar = (customMsg) => {
    playDenialSound();
    setBlockedCount((prev) => prev + 1);
    setIsPopoverShaking(true);
    setTimeout(() => setIsPopoverShaking(false), 400);

    const msg = customMsg || DENIAL_SNACKBAR_QUOTES[Math.floor(Math.random() * DENIAL_SNACKBAR_QUOTES.length)];
    setSnackbarMsg(msg);

    clearTimeout(snackbarTimeoutRef.current);
    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarMsg(null);
    }, 3400);
  };

  // Measure word coordinates using hidden mirror DOM
  const measureWordPosition = useCallback((text, wordStartIdx, wordEndIdx) => {
    const mirror = mirrorRef.current;
    if (!mirror) return { top: 120, left: 160 };

    const beforeText = text.slice(0, wordStartIdx);
    const targetWord = text.slice(wordStartIdx, wordEndIdx);

    mirror.innerHTML = '';
    const beforeSpan = document.createElement('span');
    beforeSpan.textContent = beforeText;

    const targetSpan = document.createElement('span');
    targetSpan.textContent = targetWord;
    targetSpan.id = 'measured-target-word';

    mirror.appendChild(beforeSpan);
    mirror.appendChild(targetSpan);

    const spanEl = mirror.querySelector('#measured-target-word');
    if (spanEl) {
      const top = Math.max(80, spanEl.offsetTop + 32);
      const left = Math.min(Math.max(40, spanEl.offsetLeft), 520);
      return { top, left };
    }
    return { top: 120, left: 160 };
  }, []);

  // Detect word under cursor and calculate Google Docs autocorrect popover
  const inspectWordAtCursor = useCallback((text, cursorPos) => {
    if (!text || cursorPos === undefined || cursorPos === null) {
      setActiveWordInfo(null);
      return;
    }

    // Find word boundaries around cursorPos
    const textBefore = text.slice(0, cursorPos);
    const textAfter = text.slice(cursorPos);

    const matchBefore = textBefore.match(/([a-zA-Z0-9'-]+)$/);
    const matchAfter = textAfter.match(/^([a-zA-Z0-9'-]+)/);

    let start = cursorPos;
    let end = cursorPos;
    let rawWord = '';

    if (matchBefore) {
      start = cursorPos - matchBefore[1].length;
      rawWord += matchBefore[1];
    }
    if (matchAfter) {
      end = cursorPos + matchAfter[1].length;
      rawWord += matchAfter[1];
    }

    // If cursor was at end of word or space, fallback to previous word
    if (!rawWord || rawWord.length < 2) {
      const prevWordMatch = textBefore.match(/([a-zA-Z0-9'-]+)[^\w]*$/);
      if (prevWordMatch && prevWordMatch[1] && prevWordMatch[1].length >= 2) {
        start = textBefore.lastIndexOf(prevWordMatch[1]);
        end = start + prevWordMatch[1].length;
        rawWord = prevWordMatch[1];
      }
    }

    if (rawWord && rawWord.length >= 2) {
      const suggestionObj = getAutocorrectSuggestion(rawWord);
      if (suggestionObj) {
        const coords = measureWordPosition(text, start, end);
        setPopoverPos(coords);
        setActiveWordInfo({
          word: rawWord,
          suggestion: suggestionObj.suggestion,
          reason: suggestionObj.reason,
          start,
          end,
        });
        return;
      }
    }

    // Default fallback suggestion if nothing selected
    const coords = measureWordPosition(text, Math.max(0, text.length - 12), text.length);
    setPopoverPos(coords);
    setActiveWordInfo({
      word: 'procrastination',
      suggestion: 'rest is the supreme virtue',
      reason: 'Google Docs Procrastination Engine',
      start: 0,
      end: 0,
    });
  }, [measureWordPosition]);

  // Initial sync
  useEffect(() => {
    inspectWordAtCursor(content, 26);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle key typing
  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    // 1. BLOCK UNDO / REDO (Ctrl+Z, Cmd+Z, Ctrl+Y)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')
    ) {
      e.preventDefault();
      triggerSnackbar('🚫 Undo is permanently disabled in Google Docs (Cursed Edition).');
      return;
    }

    // 2. TAB PRESSED TO CHOOSE SUGGESTION -> STRICTLY FORBIDDEN!
    if (e.key === 'Tab') {
      e.preventDefault();
      triggerSnackbar('🚫 Tab key intercepted! Google Docs autocorrect suggestions are view-only. You cannot choose it!');
      return;
    }

    // 3. ANTI-CAPITALIZATION AFTER PERIODS:
    // "Never auto-capitalize the first letter of a word after a period. Actively enforce lowercase on first character."
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const textBefore = value.slice(0, selectionStart);
      if (shouldEnforceLowercaseAfterPeriod(textBefore)) {
        e.preventDefault();
        const forcedChar = e.key.toLowerCase();
        const newText =
          value.slice(0, selectionStart) + forcedChar + value.slice(selectionEnd);
        setContent(newText);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart + 1;
            textareaRef.current.selectionEnd = selectionStart + 1;
            inspectWordAtCursor(newText, selectionStart + 1);
          }
        }, 0);
        return;
      }
    }
  };

  const handleChange = (e) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(newText);
    inspectWordAtCursor(newText, cursorPos);
  };

  const handleKeyUp = () => {
    if (textareaRef.current) {
      inspectWordAtCursor(content, textareaRef.current.selectionStart);
    }
  };

  const handleClickTextarea = () => {
    if (textareaRef.current) {
      inspectWordAtCursor(content, textareaRef.current.selectionStart);
    }
  };

  // Hover evasion on Google Docs suggestion chip
  const handleMouseEnterSuggestion = () => {
    setIsPopoverDodge((prev) => !prev);
  };

  // Attempting to click the Google Docs suggestion
  const handleAttemptAcceptSuggestion = (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerSnackbar();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Generate tokens for backdrop with red squiggly underlines on words with suggestions
  const renderBackdropTokens = () => {
    const wordsAndDelims = content.split(/(\s+|[.,!?;:]+)/);
    return wordsAndDelims.map((token, idx) => {
      if (/^\s+$/.test(token) || /^[.,!?;:]+$/.test(token)) {
        return <span key={idx}>{token}</span>;
      }
      const suggestion = getAutocorrectSuggestion(token);
      if (suggestion) {
        return (
          <span
            key={idx}
            className={idx % 2 === 0 ? styles.squigglyRed : styles.squigglyBlue}
            title={`Suggestion available: "${suggestion.suggestion}" (Unselectable)`}
          >
            {token}
          </span>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  };

  return (
    <div className={styles.googleDocsContainer}>
      {/* 1. Google Docs Top Application Header */}
      <header className={styles.docsAppHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.docsLogo} title="Unya na Notes - Unproductive Edition">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1752F0] text-white shadow-xs">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 4v9a7 7 0 0 0 14 0V4" />
                <path d="M19 19h-6" strokeWidth="2" strokeDasharray="2 2" />
              </svg>
            </span>
          </div>

          <div className={styles.titleAndMenu}>
            <div className={styles.titleRow}>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className={styles.docTitleInput}
                aria-label="Document Title"
              />
              <span className={styles.starIcon} title="Starred">★</span>
              <span className={styles.cloudStatus} title="Synced to Drive">
                ☁ Saved to Unya Drive
              </span>
              <span className={styles.lockedBadge}>
                🔒 AUTOCORRECT: CANNOT CHOOSE
              </span>
            </div>

            {/* Google Docs Classic Menus */}
            <nav className={styles.menubar} aria-label="Menu bar">
              {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help'].map((item) => (
                <div key={item} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === item ? null : item)}
                    className={`${styles.menuItem} ${activeMenu === item ? styles.menuItemActive : ''}`}
                  >
                    {item}
                  </button>

                  {activeMenu === item && (
                    <div className={styles.dropdownMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenu(null);
                          triggerSnackbar(`Google Docs ${item} menu: "Everything is deferred to ugma."`);
                        }}
                        className={styles.dropdownOption}
                      >
                        <span>{item} Option 1</span>
                        <span className="text-gray-400 text-xs">Ctrl+{item[0]}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenu(null);
                          triggerSnackbar('Autocorrect setting: "Suggestions are permanently non-negotiable."');
                        }}
                        className={styles.dropdownOption}
                      >
                        <span>Spellcheck Preferences</span>
                        <span className="text-amber-500 font-bold text-xs">View-only</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.spellcheckIndicator} title="Spell check active with view-only suggestions">
            <span className={styles.checkIcon}>✓</span>
            <span className={styles.spellBadge}>99+ suggestions</span>
          </div>

          <div className={styles.userAvatar} title="Student Procrastinator">
            <span>U</span>
          </div>
        </div>
      </header>

      {/* 2. Google Docs Classic Toolbar Strip */}
      <div className={styles.docsToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => triggerSnackbar('Undo is disabled for character development.')}
            className={`${styles.toolBtn} ${styles.toolBtnDisabled}`}
            title="Undo (Ctrl+Z) - Disabled"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => triggerSnackbar('Redo is disabled.')}
            className={`${styles.toolBtn} ${styles.toolBtnDisabled}`}
            title="Redo (Ctrl+Y) - Disabled"
          >
            ↷
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={styles.toolBtn}
            title="Print (Ctrl+P)"
          >
            🖨️
          </button>
          <button
            type="button"
            onClick={() => triggerSnackbar('Spell check complete: 99 suggestions found, 0 can be chosen.')}
            className={styles.toolBtn}
            title="Spelling and grammar check (Ctrl+Alt+X)"
          >
            <span className="text-blue-600 font-bold">A✓</span>
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        {/* Styles & Fonts dropdowns */}
        <div className={styles.toolbarGroup}>
          <select
            className={styles.toolbarSelect}
            defaultValue="Normal text"
            aria-label="Style"
          >
            <option>Normal text</option>
            <option>Title</option>
            <option>Heading 1</option>
          </select>

          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className={styles.toolbarSelect}
            aria-label="Font family"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Courier New">Courier New</option>
          </select>

          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className={styles.toolbarSelectSmall}
            aria-label="Font size"
          >
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="18">18</option>
          </select>
        </div>

        <div className={styles.toolbarDivider} />

        {/* Formatting Buttons */}
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => setIsBold(!isBold)}
            className={`${styles.toolBtn} ${isBold ? styles.toolBtnActive : ''}`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => setIsItalic(!isItalic)}
            className={`${styles.toolBtn} ${isItalic ? styles.toolBtnActive : ''}`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => setIsUnderline(!isUnderline)}
            className={`${styles.toolBtn} ${isUnderline ? styles.toolBtnActive : ''}`}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        {/* Stats on Toolbar */}
        <div className={styles.toolbarStats}>
          <span>Words: {content.trim() ? content.trim().split(/\s+/).length : 0}</span>
          <span className={styles.blockedBadge}>
            Blocked Choices: {blockedCount}
          </span>
        </div>
      </div>

      {/* 3. Google Docs Ruler Bar */}
      <div className={styles.rulerContainer} aria-hidden="true">
        <div className={styles.rulerTrack}>
          <div className={styles.rulerMarkerLeft}>▼</div>
          <div className={styles.rulerTicks}>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <span key={num} className={styles.rulerNumber}>
                {num}
              </span>
            ))}
          </div>
          <div className={styles.rulerMarkerRight}>▼</div>
        </div>
      </div>

      {/* 4. Document Page Viewport (Light gray canvas holding the white page) */}
      <div className={styles.pageViewport}>
        <div className={styles.docPage}>
          {/* Dual-layer: Layer 1 (Backdrop rendering red/blue squiggly underlines) */}
          <div
            className={styles.backdrop}
            style={{
              fontFamily,
              fontSize: `${fontSize}pt`,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
            }}
            aria-hidden="true"
          >
            {renderBackdropTokens()}
          </div>

          {/* Layer 2: Main Transparent Textarea capturing all user keystrokes & clicks */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClick={handleClickTextarea}
            className={styles.docTextarea}
            style={{
              fontFamily,
              fontSize: `${fontSize}pt`,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
            }}
            placeholder="Type your notes here... Autocorrect suggestions will appear just like Google Docs, but you can NEVER choose them."
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Google Docs Document Content"
          />

          {/* Hidden Mirror DOM for exact pixel coordinates measurement */}
          <div
            ref={mirrorRef}
            className={styles.hiddenMirror}
            style={{
              fontFamily,
              fontSize: `${fontSize}pt`,
            }}
            aria-hidden="true"
          />

          {/* 5. THE ICONIC GOOGLE DOCS AUTOCORRECT POPOVER */}
          {activeWordInfo && (
            <div
              className={`${styles.googleDocsPopover} ${
                isPopoverShaking ? styles.popoverShake : ''
              }`}
              style={{
                top: `${popoverPos.top}px`,
                left: `${popoverPos.left}px`,
              }}
              role="dialog"
              aria-label="Google Docs Autocorrect Suggestion"
            >
              {/* Popover Top Row: Suggested text in Google Docs Blue + Unselectable Accept Button */}
              <div className={styles.popoverSuggestionRow}>
                <button
                  type="button"
                  onClick={handleAttemptAcceptSuggestion}
                  onMouseEnter={handleMouseEnterSuggestion}
                  className={`${styles.suggestionPillBtn} ${
                    isPopoverDodge ? styles.suggestionPillDodged : ''
                  }`}
                  title="Click to accept suggestion (Strictly Forbidden!)"
                >
                  <span className={styles.suggestedWordText}>
                    {activeWordInfo.suggestion}
                  </span>
                  <span className={styles.acceptCheckmarkIcon}>✓</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerSnackbar('Ignore option clicked: The suggestion refuses to be ignored.')}
                  className={styles.overflowMenuBtn}
                  title="More options"
                >
                  ⋮
                </button>
              </div>

              {/* Popover Divider */}
              <div className={styles.popoverDivider} />

              {/* Popover Bottom Row: Google Docs telemetry & View-Only notice */}
              <div className={styles.popoverFooter}>
                <span className={styles.popoverType}>
                  Autocorrect suggestion
                </span>
                <span className={styles.cannotChooseTag}>
                  🔒 Cannot choose
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Google Docs Bottom Floating Snackbar */}
      {snackbarMsg && (
        <div className={styles.docsSnackbar} role="alert">
          <span className={styles.snackbarIcon}>ℹ️</span>
          <span className={styles.snackbarText}>{snackbarMsg}</span>
          <button
            type="button"
            onClick={() => setSnackbarMsg(null)}
            className={styles.snackbarDismiss}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
