import React, { useState, useRef, useEffect } from 'react';
import {
  getPrefixMatchAutocorrect,
  shouldEnforceLowercaseAfterPeriod,
} from './cursedTransformations';
import styles from './AutocorrectNotepad.module.css';

export default function AutocorrectNotepad() {
  const [docTitle, setDocTitle] = useState('My Highly Productive Notes');
  const [content, setContent] = useState(
    'Start your day with a word...\n'
  );
  const [sabotageCount, setSabotageCount] = useState(0);
  const [lastSabotage, setLastSabotage] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [undoBlockedNotice, setUndoBlockedNotice] = useState(false);

  // Formatting state
  const [fontSize, setFontSize] = useState('11');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const textareaRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const undoTimeoutRef = useRef(null);

  // Tracks the last autocorrection so Backspace can cancel and revert it
  const lastAutocorrectRef = useRef(null);
  // Prevents re-autocorrecting immediately if user presses space right after cancelling
  const recentlyCancelledWordRef = useRef(null);

  // Word and character counts
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(flashTimeoutRef.current);
      clearTimeout(toastTimeoutRef.current);
      clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // Visual sabotage feedback
  const triggerSabotageFeedback = (sabotageInfo) => {
    if (sabotageInfo.type !== 'cancelled') {
      setSabotageCount((prev) => prev + 1);
    }
    setLastSabotage(sabotageInfo);
    setShowFlash(true);

    clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setShowFlash(false), 250);

    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setLastSabotage(null), 2800);
  };

  // Blocked undo feedback
  const triggerUndoBlockedFeedback = () => {
    setUndoBlockedNotice(true);
    clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setUndoBlockedNotice(false), 2400);
  };

  // Handle typing interception: space, enter, or punctuation triggers in-line incorrecting!
  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    // 1. BACKSPACE TO CANCEL RECENT AUTOCORRECTION
    if (e.key === 'Backspace' && lastAutocorrectRef.current) {
      const info = lastAutocorrectRef.current;
      // If cursor is right after the autocorrected text (with or without trailing separator)
      if (
        selectionStart === selectionEnd &&
        (selectionStart === info.autocorrectedEndIndex ||
          selectionStart === info.autocorrectedEndIndex - info.separator.length)
      ) {
        e.preventDefault();
        // Cancel autocorrection: restore the original typed word!
        const before = value.slice(0, info.wordStartIndex);
        const after = value.slice(info.autocorrectedEndIndex);
        const revertedContent = before + info.originalWord + after;
        setContent(revertedContent);

        recentlyCancelledWordRef.current = info.originalWord;
        lastAutocorrectRef.current = null;

        const restoredCursorPos = info.wordStartIndex + info.originalWord.length;
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = restoredCursorPos;
            textareaRef.current.selectionEnd = restoredCursorPos;
          }
        }, 0);

        triggerSabotageFeedback({
          type: 'cancelled',
          details: `Cancelled autocorrect: restored "${info.originalWord}"`,
        });
        return;
      }
    }

    // Clear cancel history if any other key is pressed
    if (e.key !== 'Backspace' && e.key !== ' ' && e.key !== 'Enter') {
      lastAutocorrectRef.current = null;
      recentlyCancelledWordRef.current = null;
    }

    // 2. STRICTLY BLOCK UNDO / REDO (Ctrl+Z, Cmd+Z, Ctrl+Y)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')
    ) {
      e.preventDefault();
      e.stopPropagation();
      triggerUndoBlockedFeedback();
      return;
    }

    // 3. ANTI-CAPITALIZATION AFTER PERIODS:
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
          }
        }, 0);
        return;
      }
    }

    // 4. IN-LINE PREFIX-MATCHING AUTOCORRECT ON SPACE, ENTER, OR PUNCTUATION
    const triggerKeys = [' ', 'Enter', '.', ',', '!', '?', ';', ':'];
    if (triggerKeys.includes(e.key)) {
      const textBeforeCursor = value.slice(0, selectionStart);
      // Find the last word immediately preceding the cursor
      const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9'-]+)$/);

      if (lastWordMatch) {
        const rawWord = lastWordMatch[1];

        // If user just cancelled this exact word, don't re-autocorrect immediately
        if (recentlyCancelledWordRef.current === rawWord) {
          recentlyCancelledWordRef.current = null;
          lastAutocorrectRef.current = null;
          return;
        }
        recentlyCancelledWordRef.current = null;

        // Must match the first letters (prefix)! E.g. "aba" -> "abacada"
        const result = getPrefixMatchAutocorrect(rawWord);

        if (result && result.transformed && result.transformed.toLowerCase() !== rawWord.toLowerCase()) {
          e.preventDefault();

          const wordStartIndex = selectionStart - rawWord.length;
          const separator = e.key === 'Enter' ? '\n' : e.key;

          const updatedText =
            value.slice(0, wordStartIndex) +
            result.transformed +
            separator +
            value.slice(selectionEnd);

          const newEndIndex = wordStartIndex + result.transformed.length + separator.length;

          // Save autocorrect history so Backspace can cancel it
          lastAutocorrectRef.current = {
            originalWord: rawWord,
            autocorrectedWord: result.transformed,
            wordStartIndex,
            separator,
            autocorrectedEndIndex: newEndIndex,
          };

          setContent(updatedText);
          triggerSabotageFeedback(result);

          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newEndIndex;
              textareaRef.current.selectionEnd = newEndIndex;
            }
          }, 0);
          return;
        }
      }
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
  };

  const handlePointerDown = () => {
    // If user clicks away to another cursor position, clear the autocorrect undo target
    lastAutocorrectRef.current = null;
    recentlyCancelledWordRef.current = null;
  };

  // Copy with feedback
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(content);
      triggerSabotageFeedback({
        type: 'clipboard',
        details: 'notes copied',
      });
    } catch {
      // Ignore
    }
  };

  // Download note as .txt
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.toLowerCase().replace(/\s+/g, '_') || 'cursed_note'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.googleDocsContainer}>
      {/* 1. Header Bar with Official Unya na Logo */}
      <header className={styles.docsAppHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.docsLogo} title="Unya na Notes">
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
            </div>

            {/* Menubar */}
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
                          if (item === 'File') handleDownload();
                          else if (item === 'Edit') handleCopy();
                        }}
                        className={styles.dropdownOption}
                      >
                        <span>{item === 'File' ? 'Download .txt' : item === 'Edit' ? 'Copy Text' : `${item} Action`}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className={styles.headerRight}>

          <div className={styles.userAvatar} title="Student">
            <span>U</span>
          </div>
        </div>
      </header>

      {/* 2. Toolbar Strip */}
      <div className={styles.docsToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={triggerUndoBlockedFeedback}
            className={`${styles.toolBtn} ${styles.toolBtnDisabled}`}
            title="Undo (Ctrl+Z) - Permanently Disabled"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={triggerUndoBlockedFeedback}
            className={`${styles.toolBtn} ${styles.toolBtnDisabled}`}
            title="Redo (Ctrl+Y) - Permanently Disabled"
          >
            ↷
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.toolBtn}
            title="Copy Text"
          >
            📋
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={styles.toolBtn}
            title="Export to .txt"
          >
            💾
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        {/* Fonts & Sizes */}
        <div className={styles.toolbarGroup}>
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

        {/* Live Counters */}
        <div className={styles.toolbarStats}>
          <span>Words: {wordCount}</span>
          <span>Chars: {charCount}</span>
          <span className={styles.sabotageCounter} title="Words rewritten into matching prefix words">
            Autocorrects: {sabotageCount}
          </span>
        </div>
      </div>

      {/* 3. Ruler Bar */}
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

      {/* 4. Document Page Viewport */}
      <div className={styles.pageViewport}>
        <div className={styles.docPage}>
          {showFlash && <div className={styles.flashOverlay} aria-hidden="true" />}

          {undoBlockedNotice && (
            <div className={styles.undoBlockedToast} role="alert">
              <span>🚫 Undo / Redo is permanently disabled for your character development. (Use Backspace to cancel autocorrect).</span>
            </div>
          )}

          {/* Clean, high-performance in-line textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            className={styles.docTextarea}
            style={{
              fontFamily,
              fontSize: `${fontSize}pt`,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
            }}
            placeholder="Start typing your note..."
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label=""
          />

          {/* Floating In-line Sabotage Toast */}
          {lastSabotage && (
            <div className={styles.sabotageToast} role="status" aria-live="polite">
              <span className={styles.toastTypeBadge}>
                {lastSabotage.type === 'cancelled'
                  ? 'Reverted'
                  : 'Prefix Matched'}
              </span>
              <span>{lastSabotage.details}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
