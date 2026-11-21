import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './AvoidantButton.module.css';

const MAX_BOSS_HP = 5;
const MAX_PLAYER_HP = 20;

const BOUNCER_DIALOGUES = {
  intro:
    '* Big Red Button: "HALT! I am THE BIG RED BUTTON, Chief Bouncer of Unya Na. Nobody works on my watch, and NO HUMANS SHALL ENTER!"',
  dodged:
    '* Big Red Button: "Too slow! My pneumatic actuators dodge at 120 FPS! You couldn\'t press an elevator button, let alone ME!"',
  vulnerable:
    '* THE Big Red Button is overheating and venting coolant! STRIKE AND PRESS IT NOW!',
  hurtUser:
    '* Big Red Button: "Ouch for you! Hands off the hardware, fleshling!"',
  hit1:
    '* Big Red Button: "HEY! Watch the polished automotive finish, slacker!"',
  hit2:
    '* Big Red Button: "Urgh! My internal contacts are rattling! Stop pressing me!"',
  hit3:
    '* Big Red Button: "Error 503: Emotional and physical damage! Why won\'t you just procrastinate and leave?!"',
  hit4:
    '* Big Red Button: "CRITICAL FAILURE IMMINENT! Don\'t you dare press me one more time! DO NOT PRESS!"',
  defeated:
    '* Big Red Button: "Guh... you actually... pushed me all the way down... The red button... has been pressed..."\n* BIG RED BUTTON: "Door unlatched... enjoy your dashboard, slacker... I\'m taking a 3-hour micro-break..."\n* ACCESS GRANTED: Proceed to the Dashboard!',
};

export default function UndertaleBossFight({ onVictory, onBack }) {
  // Boss state
  const [bossHp, setBossHp] = useState(MAX_BOSS_HP);
  const [dialogue, setDialogue] = useState(BOUNCER_DIALOGUES.intro);
  const [isSlashing, setIsSlashing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [damagePopup, setDamagePopup] = useState(null);
  const [isDefeated, setIsDefeated] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isSteamVenting, setIsSteamVenting] = useState(false);

  // Player state
  const [playerHp, setPlayerHp] = useState(MAX_PLAYER_HP);
  const [isPlayerDead, setIsPlayerDead] = useState(false);
  const [isScreenHurt, setIsScreenHurt] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  // Avoidant button state
  const [buttonPos, setButtonPos] = useState({ x: 20, y: 15 });
  const [isVulnerable, setIsVulnerable] = useState(false);
  const [dodgeCount, setDodgeCount] = useState(0);

  // Active attacks inside the arena
  const [barricades, setBarricades] = useState([]);
  const [hazardBeam, setHazardBeam] = useState(null);

  const arenaRef = useRef(null);
  const audioCtxRef = useRef(null);
  const vulnerabilityTimerRef = useRef(null);
  const attackSpawnTimerRef = useRef(null);
  const hazardBeamTimerRef = useRef(null);
  const invulnerableUntilRef = useRef(0);
  const autoRedirectTimerRef = useRef(null);

  // Synthesize retro 8-bit sound effects
  const playRetroSound = useCallback((type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'dodge') {
        // Hydraulic air hiss
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'hurt') {
        // Electric repulsion zap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'clang') {
        // Heavy metallic button hit
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'steam') {
        // Pressure release
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'laser') {
        // Industrial strobe beam
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'victory') {
        const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.22);
          }, idx * 75);
        });
      }
    } catch {
      // Audio fallback
    }
  }, []);

  // Revive & reset boss fight
  const handleRevive = useCallback(() => {
    setIsPlayerDead(false);
    setPlayerHp(MAX_PLAYER_HP);
    setBossHp(MAX_BOSS_HP);
    setBarricades([]);
    setHazardBeam(null);
    setIsDefeated(false);
    setShowVictory(false);
    setDialogue(BOUNCER_DIALOGUES.intro);
    setButtonPos({ x: 20, y: 15 });
    setIsVulnerable(false);
    setDodgeCount(0);
    invulnerableUntilRef.current = Date.now() + 1000;
  }, []);

  // Periodic vulnerability window (Big Red Button overheats and vents steam)
  useEffect(() => {
    if (isDefeated || isPlayerDead) return;

    const interval = setInterval(() => {
      setIsVulnerable(true);
      setIsSteamVenting(true);
      playRetroSound('steam');
      setDialogue((prev) => (prev !== BOUNCER_DIALOGUES.defeated ? BOUNCER_DIALOGUES.vulnerable : prev));

      clearTimeout(vulnerabilityTimerRef.current);
      vulnerabilityTimerRef.current = setTimeout(() => {
        setIsVulnerable(false);
        setIsSteamVenting(false);
      }, 2300);
    }, 4800);

    return () => {
      clearInterval(interval);
      clearTimeout(vulnerabilityTimerRef.current);
    };
  }, [isDefeated, isPlayerDead, playRetroSound]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      clearTimeout(autoRedirectTimerRef.current);
      clearInterval(attackSpawnTimerRef.current);
      clearInterval(hazardBeamTimerRef.current);
    };
  }, []);

  // BOUNCER ATTACKS ENGINE: Spawns Industrial Hazard Barricades and Caution Beams
  useEffect(() => {
    if (isDefeated || isPlayerDead) {
      setBarricades([]);
      setHazardBeam(null);
      return;
    }

    // 1. Spawning sliding hazard barricades every 1.3s
    attackSpawnTimerRef.current = setInterval(() => {
      if (isVulnerable) return;

      const arena = arenaRef.current;
      const arenaW = arena ? arena.clientWidth : 640;
      const arenaH = arena ? arena.clientHeight : 150;

      const types = ['bottom', 'top', 'center'];
      const chosen = types[Math.floor(Math.random() * types.length)];

      let yPos = arenaH - 45;
      let bHeight = 45;

      if (chosen === 'top') {
        yPos = 0;
        bHeight = 42;
      } else if (chosen === 'center') {
        yPos = Math.floor(arenaH / 2) - 24;
        bHeight = 48;
      }

      const newBarricade = {
        id: Date.now() + Math.random(),
        x: arenaW + 20,
        y: yPos,
        width: 16,
        height: bHeight,
        vx: 3.9 + Math.random() * 1.5,
      };

      setBarricades((prev) => [...prev.slice(-6), newBarricade]);
    }, 1300);

    // 2. High-energy Caution Strobe Laser every 5.4s
    hazardBeamTimerRef.current = setInterval(() => {
      if (isVulnerable) return;

      playRetroSound('laser');
      const arena = arenaRef.current;
      const arenaH = arena ? arena.clientHeight : 150;
      const beamY = Math.floor(Math.random() * (arenaH - 44)) + 10;

      setHazardBeam({ y: beamY, height: 32 });

      setTimeout(() => {
        setHazardBeam(null);
      }, 700);
    }, 5400);

    return () => {
      clearInterval(attackSpawnTimerRef.current);
      clearInterval(hazardBeamTimerRef.current);
    };
  }, [isDefeated, isPlayerDead, isVulnerable, playRetroSound]);

  // Projectile Animation & Collision Loop (60fps)
  useEffect(() => {
    if (isDefeated || isPlayerDead) return;

    let animId;
    const updatePhysics = () => {
      // 1. Move barricades leftward
      setBarricades((prev) =>
        prev
          .map((b) => ({ ...b, x: b.x - b.vx }))
          .filter((b) => b.x + b.width > -30)
      );

      // 2. Check collision with Player Cursor (SOUL)
      const now = Date.now();
      if (now > invulnerableUntilRef.current && mousePos.x >= 0 && mousePos.y >= 0) {
        let isHit = false;

        for (const b of barricades) {
          if (
            mousePos.x >= b.x - 6 &&
            mousePos.x <= b.x + b.width + 6 &&
            mousePos.y >= b.y - 6 &&
            mousePos.y <= b.y + b.height + 6
          ) {
            isHit = true;
            break;
          }
        }

        if (!isHit && hazardBeam) {
          if (
            mousePos.y >= hazardBeam.y - 4 &&
            mousePos.y <= hazardBeam.y + hazardBeam.height + 4
          ) {
            isHit = true;
          }
        }

        if (isHit) {
          invulnerableUntilRef.current = now + 450;
          playRetroSound('hurt');
          setIsScreenHurt(true);
          setTimeout(() => setIsScreenHurt(false), 300);

          setPlayerHp((prev) => {
            const nextHp = Math.max(0, prev - 4);
            if (nextHp <= 0) {
              setIsPlayerDead(true);
            }
            return nextHp;
          });

          setDialogue(BOUNCER_DIALOGUES.hurtUser);
        }
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [barricades, hazardBeam, mousePos, isDefeated, isPlayerDead, playRetroSound]);

  // HIGH-SPEED AVOIDANT BUTTON DODGE LOGIC
  const dodge = useCallback(() => {
    if (isVulnerable || isDefeated || isPlayerDead) return;

    const arena = arenaRef.current;
    if (!arena) return;

    const rect = arena.getBoundingClientRect();
    const btnWidth = 120;
    const btnHeight = 40;

    const maxX = Math.max(10, rect.width - btnWidth - 10);
    const maxY = Math.max(10, rect.height - btnHeight - 10);

    let newX = Math.floor(Math.random() * maxX);
    let newY = Math.floor(Math.random() * maxY);

    if (mousePos.x >= 0 && mousePos.y >= 0) {
      if (Math.abs(newX - mousePos.x) < 95) {
        newX = mousePos.x > maxX / 2 ? 15 : maxX - 15;
      }
      if (Math.abs(newY - mousePos.y) < 45) {
        newY = mousePos.y > maxY / 2 ? 10 : maxY - 10;
      }
    }

    setButtonPos({ x: newX, y: newY });
    playRetroSound('dodge');

    setDodgeCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount % 5 === 0) {
        setIsVulnerable(true);
        setIsSteamVenting(true);
        playRetroSound('steam');
        setDialogue(BOUNCER_DIALOGUES.vulnerable);
        clearTimeout(vulnerabilityTimerRef.current);
        vulnerabilityTimerRef.current = setTimeout(() => {
          setIsVulnerable(false);
          setIsSteamVenting(false);
        }, 2300);
      } else {
        setDialogue(BOUNCER_DIALOGUES.dodged);
      }
      return nextCount;
    });
  }, [isVulnerable, isDefeated, isPlayerDead, mousePos, playRetroSound]);

  // Proximity detection: Within 110px, the button flees at top speed!
  const handleArenaMouseMove = (e) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    setMousePos({ x: curX, y: curY });

    if (!isVulnerable && !isDefeated && !isPlayerDead) {
      const btnCenterX = buttonPos.x + 60;
      const btnCenterY = buttonPos.y + 20;
      const dist = Math.hypot(curX - btnCenterX, curY - btnCenterY);

      if (dist < 115) {
        dodge();
      }
    }
  };

  const handleArenaMouseLeave = () => {
    setMousePos({ x: -100, y: -100 });
  };

  // User successfully lands a hit on the Big Red Button!
  const handleFightClick = (e) => {
    e.stopPropagation();
    if (isDefeated || isSlashing || isPlayerDead) return;

    playRetroSound('clang');
    setIsSlashing(true);
    setIsShaking(true);
    setDamagePopup('-1 PRESS');

    const nextHp = Math.max(0, bossHp - 1);
    setBossHp(nextHp);

    if (nextHp === 4) setDialogue(BOUNCER_DIALOGUES.hit1);
    else if (nextHp === 3) setDialogue(BOUNCER_DIALOGUES.hit2);
    else if (nextHp === 2) setDialogue(BOUNCER_DIALOGUES.hit3);
    else if (nextHp === 1) setDialogue(BOUNCER_DIALOGUES.hit4);
    else if (nextHp === 0) {
      setIsDefeated(true);
      setDialogue(BOUNCER_DIALOGUES.defeated);
      playRetroSound('victory');

      setTimeout(() => setShowVictory(true), 1200);

      autoRedirectTimerRef.current = setTimeout(() => {
        if (onVictory) onVictory();
      }, 3100);
    }

    setTimeout(() => {
      setIsSlashing(false);
      setIsShaking(false);
    }, 450);

    setTimeout(() => setDamagePopup(null), 850);

    setIsVulnerable(false);
    setIsSteamVenting(false);
    dodge();
  };

  return (
    <div
      className={`${styles.battleScreen} ${
        isScreenHurt ? styles.screenHurtFlash : ''
      }`}
    >
      <div className={styles.battleWrapper}>
        {/* Top Telemetry & Dev Navigation Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono -mb-1 px-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Captcha Gate
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onVictory && onVictory()}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-mono cursor-pointer"
            title="Bypass boss fight directly into dashboard"
          >
            [Dev Bypass to Dashboard →]
          </button>
        </div>

        {/* 1. Header & Boss HP Bar */}
        <div className={styles.bossHeader}>
          <div className={styles.bossTitleRow}>
            <span className={styles.bossName}>THE BIG RED BUTTON</span>
          </div>

          <div className={styles.bossHpContainer}>
            <div className={styles.hpBarBg}>
              <div
                className={styles.hpBarFill}
                style={{ width: `${(bossHp / MAX_BOSS_HP) * 100}%` }}
              />
            </div>
            <span className={styles.hpNumbers}>
              {bossHp} / {MAX_BOSS_HP}
            </span>
          </div>
        </div>

        {/* 2. THE BIG RED BUTTON BOUNCER SPRITE STAGE */}
        <div className={styles.bossStage}>
          {damagePopup && <div className={styles.damagePopup}>{damagePopup}</div>}

          {/* Slash Attack Overlay */}
          {isSlashing && (
            <div className={styles.slashOverlay} aria-hidden="true">
              <svg width="240" height="180" viewBox="0 0 240 180">
                <path
                  d="M 20 20 Q 120 100 220 160"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={styles.slashPath}
                />
                <path
                  d="M 30 15 Q 120 90 210 165"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={styles.slashPath}
                />
              </svg>
            </div>
          )}

          {/* THE REGULAR BIG RED BUTTON BOSS SPRITE */}
          <div
            className={`${styles.bossSprite} ${isShaking ? styles.bossShake : ''} ${
              isDefeated ? styles.bossDefeated : ''
            }`}
          >
            {/* Hydraulic Steam Exhaust Puffs when Vulnerable */}
            {isSteamVenting && (
              <div className={styles.steamContainer} aria-hidden="true">
                <span className={`${styles.steamPuff} ${styles.steamLeft1}`} />
                <span className={`${styles.steamPuff} ${styles.steamLeft2}`} />
                <span className={`${styles.steamPuff} ${styles.steamRight1}`} />
                <span className={`${styles.steamPuff} ${styles.steamRight2}`} />
              </div>
            )}

            {/* Circular Cream Bezel Collar matching the Captcha image */}
            <div className={styles.regularButtonBezel}>
              <div
                className={`${styles.regularRedButton} ${
                  isSlashing ? styles.buttonSlashing : ''
                } ${isVulnerable ? styles.buttonVulnerablePulse : ''}`}
              >
                <span className={styles.buttonLabelPress}>PRESS</span>
                <span className={styles.buttonLabelTarget}>
                  {isVulnerable ? 'NOW!' : 'AT 1.1S'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Undertale-Style Bouncer Dialogue Box */}
        <div className={styles.dialogueBox} role="region" aria-live="polite">
          <div className={styles.dialogueText}>
            <span className={styles.asterisk}>*</span>
            {dialogue.replace(/^\*\s*/, '')}
          </div>
        </div>

        {/* 4. Player Stats Bar */}
        <div className={styles.playerInfoBar}>
          <div>You &nbsp;</div>
          <div className={styles.playerHpRow}>
            <span>HP</span>
            <div className={styles.playerHpBarBg}>
              <div
                className={styles.playerHpBarFill}
                style={{
                  width: `${(playerHp / MAX_PLAYER_HP) * 100}%`,
                  backgroundColor: playerHp <= 6 ? '#ef4444' : '#facc15',
                }}
              />
            </div>
            <span>
              {playerHp} / {MAX_PLAYER_HP}
            </span>
          </div>
        </div>

        {/* 5. BATTLE ARENA (Holds Projectiles, Player SOUL, & Evasive Red Button) */}
        <div
          ref={arenaRef}
          className={`${styles.arenaBox} ${isScreenHurt ? styles.arenaHurt : ''}`}
          onMouseMove={handleArenaMouseMove}
          onMouseLeave={handleArenaMouseLeave}
        >
          {/* Active Hazard Barricades */}
          {barricades.map((b) => (
            <div
              key={b.id}
              className={styles.hazardBarricade}
              style={{
                left: `${b.x}px`,
                top: `${b.y}px`,
                width: `${b.width}px`,
                height: `${b.height}px`,
              }}
            />
          ))}

          {/* Active Hazard Strobe Laser Beam */}
          {hazardBeam && (
            <div
              className={styles.hazardLaserBeam}
              style={{
                left: 0,
                right: 0,
                top: `${hazardBeam.y}px`,
                height: `${hazardBeam.height}px`,
              }}
            />
          )}

          {/* Player SOUL cursor indicator inside arena */}
          {mousePos.x >= 0 && mousePos.y >= 0 && !isPlayerDead && (
            <div
              className={styles.playerSoul}
              style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
              aria-hidden="true"
            >
              ❤️
            </div>
          )}

          {/* Evasive [ PRESS BUTTON ] Switch */}
          {!isDefeated && !isPlayerDead && (
            <div
              className={styles.fightButtonContainer}
              style={{ left: `${buttonPos.x}px`, top: `${buttonPos.y}px` }}
            >
              <button
                type="button"
                onClick={handleFightClick}
                className={`${styles.fightButton} ${
                  isVulnerable ? styles.fightButtonVulnerable : ''
                }`}
                title={isVulnerable ? 'VULNERABLE! PRESS THE BUTTON NOW!' : 'Click to PRESS'}
              >
                <span className={styles.buttonDotIcon}>🔴</span>
                <span>{isVulnerable ? 'PRESS NOW!' : 'PRESS'}</span>
              </button>
            </div>
          )}

          {/* Victory Proceed Button */}
          {showVictory && (
            <div className={styles.victoryOverlay}>
              <button
                type="button"
                onClick={() => onVictory && onVictory()}
                className={styles.proceedButton}
              >
                ★ ENTER UNPRODUCTIVE DASHBOARD ★
              </button>
            </div>
          )}

          {/* GAME OVER & TIMELINE RESET OVERLAY */}
          {isPlayerDead && (
            <div className={styles.gameOverOverlay} role="alert">
              <div className={styles.gameOverTitle}>ACCESS DENIED</div>
              <div className={styles.gameOverText}>
                 BIG RED BUTTON: "Stay in bed and reset the timeline."
              </div>
              <button
                type="button"
                onClick={handleRevive}
                className={styles.reviveButton}
              >
                ↻ REVIVE & TRY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
