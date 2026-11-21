import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../app/context/ThemeContext';
import FanCursorController from './FanCursorController';

function parseBin(str) {
  if (!str) return 0;
  return parseInt(str, 2) || 0;
}

function toBin(num) {
  if (num === 0) return '0';
  if (num < 0) {
    return '-' + Math.abs(num).toString(2);
  }
  return num.toString(2);
}

function Lightbulb({ isOn, bulbRef }) {
  return (
    <div
      ref={bulbRef}
      className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
        isOn
          ? 'bg-amber-100/90 shadow-[0_0_16px_4px_rgba(250,204,21,0.55)]'
          : 'bg-surface-subtle'
      }`}
      aria-label={isOn ? 'Lightbulb on' : 'Lightbulb off'}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-7 w-7 transition-all duration-200 ${
          isOn ? 'text-amber-500' : 'text-ink-muted/45'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.6.5 1.1 1.2 1.3 2h5c.2-.8.7-1.5 1.3-2A6 6 0 0 0 12 3Z"
          fill={isOn ? '#fde047' : 'none'}
        />
      </svg>
    </div>
  );
}

export default function BinaryCalculator() {
  const { isFlashlight } = useTheme();
  const containerRef = useRef(null);
  const bulbRefs = useRef([]);

  const [activeSubtab, setActiveSubtab] = useState('keypad'); // 'keypad' | 'switches'
  const [operandA, setOperandA] = useState('');
  const [operator, setOperator] = useState(null);
  const [operandB, setOperandB] = useState('');
  const [resultBin, setResultBin] = useState(null);
  const [resultRemainder, setResultRemainder] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [history, setHistory] = useState([]);

  // 8-bit switches state
  const [switches, setSwitches] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [litGlowPositions, setLitGlowPositions] = useState([]);

  // Track viewport positions of lit lightbulbs so their glow stays visible above FlashlightOverlay (z-50)
  const updateLitGlowPositions = useCallback(() => {
    if (activeSubtab !== 'switches') {
      setLitGlowPositions([]);
      return;
    }

    const positions = [];
    switches.forEach((bitVal, idx) => {
      if (bitVal === 1) {
        const el = bulbRefs.current[idx];
        if (el) {
          const rect = el.getBoundingClientRect();
          positions.push({
            idx,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
      }
    });
    setLitGlowPositions(positions);
  }, [activeSubtab, switches]);

  useEffect(() => {
    updateLitGlowPositions();
    const raf = requestAnimationFrame(updateLitGlowPositions);
    window.addEventListener('resize', updateLitGlowPositions);
    window.addEventListener('scroll', updateLitGlowPositions, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateLitGlowPositions);
      window.removeEventListener('scroll', updateLitGlowPositions, true);
    };
  }, [updateLitGlowPositions]);

  const handleDigit = (digit) => {
    // If a result was just calculated and user enters a new digit, start fresh
    if (resultBin !== null) {
      setOperandA(digit);
      setOperator(null);
      setOperandB('');
      setResultBin(null);
      setResultRemainder(null);
      return;
    }

    if (!operator) {
      if (operandA.length >= 24) return;
      setOperandA((prev) => prev + digit);
    } else {
      if (operandB.length >= 24) return;
      setOperandB((prev) => prev + digit);
    }
  };

  const handleOp = (op) => {
    // Carry previous calculated result into the first number of the next operation
    if (resultBin !== null) {
      setOperandA(resultBin);
      setOperator(op);
      setOperandB('');
      setResultBin(null);
      setResultRemainder(null);
      return;
    }

    if (operandA) {
      setOperator(op);
    }
  };

  const handleBackspace = () => {
    if (resultBin !== null) {
      setResultBin(null);
      setResultRemainder(null);
      return;
    }

    if (operator && operandB) {
      setOperandB((prev) => prev.slice(0, -1));
    } else if (operator) {
      setOperator(null);
    } else {
      setOperandA((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setOperandA('');
    setOperator(null);
    setOperandB('');
    setResultBin(null);
    setResultRemainder(null);
  };

  const handleCalculate = () => {
    if (!operandA || !operator || !operandB) return;

    const decA = parseBin(operandA);
    const decB = parseBin(operandB);
    let decRes = 0;
    let remainder = null;

    switch (operator) {
      case '+':
        decRes = decA + decB;
        break;
      case '-':
        decRes = decA - decB;
        break;
      case '×':
        decRes = decA * decB;
        break;
      case '÷':
        if (decB === 0) {
          setValidationError('Cannot divide by zero.');
          setTimeout(() => setValidationError(null), 3000);
          return;
        }
        decRes = Math.floor(decA / decB);
        remainder = decA % decB;
        break;
      case 'AND':
        decRes = decA & decB;
        break;
      case 'OR':
        decRes = decA | decB;
        break;
      case 'XOR':
        decRes = decA ^ decB;
        break;
      case '<<':
        decRes = decA << decB;
        break;
      case '>>':
        decRes = decA >> decB;
        break;
      default:
        return;
    }

    const binRes = toBin(decRes);
    const remBin = remainder !== null && remainder > 0 ? toBin(remainder) : null;

    setResultBin(binRes);
    setResultRemainder(remBin);

    setHistory((prev) => [
      {
        id: Date.now(),
        expression: `${operandA} ${operator} ${operandB}`,
        result: `${binRes}${remBin ? ` R ${remBin}` : ''}`,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const toggleSwitch = (idx) => {
    setSwitches((prev) => {
      const copy = [...prev];
      copy[idx] = copy[idx] === 0 ? 1 : 0;
      return copy;
    });
  };

  const switchBinaryString = switches.join('');

  const commitSwitchesToKeypad = (target) => {
    const trimmed = switchBinaryString.replace(/^0+(?!$)/, '') || '0';
    setResultBin(null);
    setResultRemainder(null);
    if (target === 'A') {
      setOperandA(trimmed);
      setOperator(null);
      setOperandB('');
    } else {
      setOperandB(trimmed);
    }
    setActiveSubtab('keypad');
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-6 min-h-[540px] [&_button[data-fan-hover='true']]:ring-2 [&_button[data-fan-hover='true']]:ring-accent [&_button[data-fan-hover='true']]:ring-offset-1"
    >
      {/* Fan-controlled cursor overlay */}
      <FanCursorController containerRef={containerRef} />

      {/* Portal glow for lit lightbulbs so they remain glowing above FlashlightOverlay (z-50) */}
      {isFlashlight &&
        litGlowPositions.length > 0 &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[55]"
          >
            {litGlowPositions.map((pos) => (
              <div
                key={pos.idx}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '84px',
                  height: '84px',
                  background:
                    'radial-gradient(circle, rgba(254, 240, 138, 0.78) 0%, rgba(250, 204, 21, 0.36) 42%, rgba(250, 204, 21, 0) 74%)',
                }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-amber-500 drop-shadow-[0_0_6px_rgba(253,224,71,0.9)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.6.5 1.1 1.2 1.3 2h5c.2-.8.7-1.5 1.3-2A6 6 0 0 0 12 3Z"
                    fill="#fde047"
                  />
                </svg>
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Validation Alert */}
      {validationError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-900 shadow-sm"
        >
          <span className="text-base" aria-hidden="true">
            ⚠️
          </span>
          <p>{validationError}</p>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveSubtab('keypad')}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            activeSubtab === 'keypad'
              ? 'bg-accent text-white font-semibold'
              : 'bg-surface text-ink hover:bg-surface-subtle'
          }`}
        >
          Keypad
        </button>
        <button
          type="button"
          onClick={() => setActiveSubtab('switches')}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            activeSubtab === 'switches'
              ? 'bg-accent text-white font-semibold'
              : 'bg-surface text-ink hover:bg-surface-subtle'
          }`}
        >
          Switches
        </button>
      </div>

      {/* TAB 1: KEYPAD */}
      {activeSubtab === 'keypad' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Calculator Body */}
          <div className="flex flex-col rounded-2xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(31,28,23,0.04)] lg:col-span-2 space-y-5">
            {/* Display Screen */}
            <div className="flex flex-col justify-end rounded-2xl border border-border bg-canvas p-6 text-right space-y-2 min-h-[140px]">
              {/* Expression */}
              <div className="font-mono text-sm text-ink-secondary overflow-x-auto whitespace-nowrap">
                {operandA || '0'} {operator || ''} {operandB || ''}
              </div>

              {/* Main Display Output */}
              <div className="font-mono text-3xl md:text-4xl font-bold text-ink tracking-wider overflow-x-auto whitespace-nowrap">
                {resultBin !== null ? (
                  <span>
                    = {resultBin}
                    {resultRemainder && (
                      <span className="text-lg text-accent-indigo">
                        {' '}
                        R {resultRemainder}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>{operator ? operandB || '0' : operandA || '0'}</span>
                )}
              </div>
            </div>

            {/* Keypad Buttons */}
            <div className="grid grid-cols-4 gap-3">
              {/* Row 1 */}
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-border bg-canvas py-3 text-xs font-bold text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-accent"
              >
                CLR
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="rounded-lg border border-border bg-canvas py-3 text-xs font-bold text-ink hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-accent"
              >
                DEL
              </button>
              <button
                type="button"
                onClick={() => handleOp('<<')}
                className="rounded-lg border border-border bg-surface-subtle py-3 text-xs font-mono font-bold text-ink hover:border-border-strong"
              >
                &lt;&lt;
              </button>
              <button
                type="button"
                onClick={() => handleOp('>>')}
                className="rounded-lg border border-border bg-surface-subtle py-3 text-xs font-mono font-bold text-ink hover:border-border-strong"
              >
                &gt;&gt;
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => handleOp('AND')}
                className="rounded-lg border border-border bg-surface-subtle py-3 text-xs font-mono font-bold text-ink hover:border-border-strong"
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => handleOp('OR')}
                className="rounded-lg border border-border bg-surface-subtle py-3 text-xs font-mono font-bold text-ink hover:border-border-strong"
              >
                OR
              </button>
              <button
                type="button"
                onClick={() => handleOp('XOR')}
                className="rounded-lg border border-border bg-surface-subtle py-3 text-xs font-mono font-bold text-ink hover:border-border-strong"
              >
                XOR
              </button>
              <button
                type="button"
                onClick={() => handleOp('÷')}
                className="rounded-lg bg-accent/10 py-3 text-sm font-bold text-accent hover:bg-accent/20"
              >
                ÷
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => handleOp('×')}
                className="rounded-lg bg-accent/10 py-3 text-sm font-bold text-accent hover:bg-accent/20"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => handleOp('-')}
                className="rounded-lg bg-accent/10 py-3 text-sm font-bold text-accent hover:bg-accent/20"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleOp('+')}
                className="rounded-lg bg-accent/10 py-3 text-sm font-bold text-accent hover:bg-accent/20"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleCalculate}
                className="row-span-2 rounded-lg bg-accent py-3 text-base font-bold text-white hover:bg-accent-hover shadow-sm"
              >
                =
              </button>

              {/* 0 and 1 keys */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="col-span-1 rounded-xl border-2 border-border bg-canvas py-6 font-mono text-3xl font-extrabold text-ink hover:border-accent hover:bg-surface-subtle active:scale-95 transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit('1')}
                className="col-span-2 rounded-xl border-2 border-accent bg-accent-soft py-6 font-mono text-3xl font-extrabold text-accent hover:bg-accent hover:text-white active:scale-95 transition-all"
              >
                1
              </button>
            </div>
          </div>

          {/* Right Rail: History */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-sm font-bold text-ink">
                History
              </h3>
              <span className="text-[11px] text-ink-muted">Recent</span>
            </div>

            {history.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-center text-xs text-ink-muted p-4">
                No calculations yet.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-canvas p-3 space-y-1"
                  >
                    <div className="text-ink-secondary">{item.expression}</div>
                    <div className="font-bold text-accent">= {item.result}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SWITCHES */}
      {activeSubtab === 'switches' && (
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(31,28,23,0.04)] space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Switch Input
              </h3>
              <p className="text-xs text-ink-secondary">
                Toggle the switches below to enter a value.
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-ink-muted">Value:</span>
              <p className="text-base font-bold text-accent tracking-wider">
                {switchBinaryString}
              </p>
            </div>
          </div>

          {/* 8 Lightbulbs + Switches */}
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {switches.map((bitVal, idx) => {
              const isOn = bitVal === 1;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center rounded-xl border border-border bg-canvas p-4 text-center space-y-3"
                >
                  <Lightbulb
                    isOn={isOn}
                    bulbRef={(el) => {
                      bulbRefs.current[idx] = el;
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => toggleSwitch(idx)}
                    aria-pressed={isOn}
                    aria-label={`Switch ${8 - idx}, currently ${isOn ? 'on' : 'off'}`}
                    className={`h-16 w-10 rounded-lg border-2 p-1 transition-all ${
                      isOn
                        ? 'border-accent bg-accent flex flex-col justify-start'
                        : 'border-border-strong bg-surface-subtle flex flex-col justify-end'
                    }`}
                  >
                    <div
                      className={`h-6 w-full rounded-md shadow-sm transition-transform ${
                        isOn ? 'bg-white' : 'bg-ink-muted'
                      }`}
                    />
                  </button>

                  <span
                    className={`font-mono text-xs font-bold ${
                      isOn ? 'text-accent' : 'text-ink-muted'
                    }`}
                  >
                    {isOn ? '1' : '0'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Commit buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => commitSwitchesToKeypad('A')}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Use as First Number
            </button>
            <button
              type="button"
              onClick={() => commitSwitchesToKeypad('B')}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors"
            >
              Use as Second Number
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
