import React, { useCallback, useEffect, useRef, useState } from 'react';
import SakugaButton from '../../app/components/SakugaButton';
import { loadSakuga } from '../../app/components/sakugaLoader';
import { createDanceAnalyzer } from './danceAnalyzer';
import { loadPoseDetector } from './poseDetector';

// Upper-body skeleton only: shoulders, arms, nose.
const BONES = [
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [0, 5],
  [0, 6],
];
const JOINTS = [0, 5, 6, 7, 8, 9, 10];
const MIN_FRAME_MS = 33; // about 30 detections per second at most

const STATUS_TEXT = {
  loading: 'Loading the pose model…',
  camera: 'Waiting for your camera…',
  'no-body': 'Step back until your shoulders and arms are in the frame.',
  'too-far': 'A bit closer, I can barely see you.',
  'no-arms': 'I can see your shoulders. Raise your arms into the frame.',
  idle: 'Dance! Move your arms and shoulders.',
  moving: 'Keep going, bigger and more rhythmic.',
  dancing: 'That is dancing.',
};

function drawSkeleton(canvas, keypoints) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!keypoints) return;
  const ok = (i) => keypoints[i] && keypoints[i].score >= 0.25;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2563eb';
  BONES.forEach(([a, b]) => {
    if (!ok(a) || !ok(b)) return;
    ctx.beginPath();
    ctx.moveTo(keypoints[a].x, keypoints[a].y);
    ctx.lineTo(keypoints[b].x, keypoints[b].y);
    ctx.stroke();
  });
  ctx.fillStyle = '#ffffff';
  JOINTS.forEach((i) => {
    if (!ok(i)) return;
    ctx.beginPath();
    ctx.arc(keypoints[i].x, keypoints[i].y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

// Shown when the interface has faded to nothing. Opens the camera, watches for
// upper-body dancing, and calls onDance() each time a dance is detected.
export default function DanceGate({ opacity, stopAt, step, onDance, onDone }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const onDanceRef = useRef(onDance);
  onDanceRef.current = onDance;

  const [phase, setPhase] = useState('camera'); // camera | loading | running | blocked | error
  const [status, setStatus] = useState('camera');
  const [energy, setEnergy] = useState(0);
  const [dances, setDances] = useState(0);
  const [flash, setFlash] = useState(false);
  const [attempt, setAttempt] = useState(1); // bumped by "Try again" to restart the camera
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    loadSakuga('button');
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream = null;
    let raf = 0;
    let flashTimer = 0;
    const analyzer = createDanceAnalyzer();

    async function start() {
      setPhase('camera');
      setStatus('camera');
      setErrorText('');

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (error) {
        if (cancelled) return;
        setPhase('blocked');
        setErrorText(
          error && error.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser, then try again.'
            : 'No camera found. Plug one in, then try again.',
        );
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      setPhase('loading');
      setStatus('loading');
      let detector;
      try {
        detector = await loadPoseDetector();
      } catch (error) {
        if (cancelled) return;
        setPhase('error');
        setErrorText('Could not load the pose model. Check your connection, then try again.');
        return;
      }
      if (cancelled) return;

      setPhase('running');
      setStatus('no-body');
      let last = 0;
      let busy = false;

      const loop = async (now) => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop);
        if (busy || now - last < MIN_FRAME_MS || video.readyState < 2) return;
        busy = true;
        last = now;
        try {
          const canvas = canvasRef.current;
          if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const poses = await detector.estimatePoses(video);
          if (cancelled) return;
          const keypoints = poses[0] ? poses[0].keypoints : null;
          if (canvas) drawSkeleton(canvas, keypoints);

          const result = analyzer.push(keypoints, performance.now());
          setStatus(result.status);
          setEnergy(result.energy);
          if (result.danced) {
            setDances((n) => n + 1);
            setFlash(true);
            clearTimeout(flashTimer);
            flashTimer = setTimeout(() => setFlash(false), 900);
            onDanceRef.current?.();
          }
        } catch {
          // A single bad frame is not worth stopping for.
        } finally {
          busy = false;
        }
      };
      raf = requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(flashTimer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const failed = phase === 'blocked' || phase === 'error';
  const canStop = opacity >= stopAt;
  const message = failed ? errorText : STATUS_TEXT[status] || '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dance to bring the interface back"
      className="absolute inset-0 top-14 z-20 flex items-center justify-center bg-canvas/85 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <div className="space-y-1 text-center">
          <h2 className="font-display text-xl font-bold text-ink">
            Unya na… everything faded away.
          </h2>
          <p className="text-sm text-ink-secondary">
            Dance with your upper body to bring it back. Arms, shoulders, anything. Each dance
            wins back {step}%. You can keep going all the way to 100%.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-subtle">
          <div className="aspect-[4/3] w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
          </div>
          {phase === 'running' && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20" aria-hidden="true">
              <div
                className="h-full bg-accent transition-[width] duration-150"
                style={{ width: `${Math.round(energy * 100)}%` }}
              />
            </div>
          )}
          {flash && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-accent/20">
              <span className="rounded-lg bg-accent px-3 py-1.5 font-display text-lg font-bold text-white">
                +{step}%
              </span>
            </div>
          )}
        </div>

        <p
          role="status"
          className={`min-h-10 text-center text-sm ${failed ? 'text-red-600' : 'text-ink-secondary'}`}
        >
          {message}
        </p>

        {failed && (
          <div className="flex justify-center">
            <SakugaButton variant="secondary" onClick={retry}>
              Try again
            </SakugaButton>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-xs font-medium text-ink-muted">
            <span>
              {canStop
                ? 'You can stop now, or keep dancing to 100%.'
                : `Get to ${stopAt}% to be allowed to stop.`}
            </span>
            <span className="tnum shrink-0">
              {opacity}% · {dances} {dances === 1 ? 'dance' : 'dances'}
            </span>
          </div>
          <div
            className="relative h-2 overflow-hidden rounded-full bg-surface-subtle"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={opacity}
            aria-label="Interface restored"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${opacity}%` }}
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-ink/40"
              style={{ left: `${stopAt}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {canStop && (
          <div className="flex justify-center">
            <SakugaButton variant="secondary" onClick={onDone}>
              Done
            </SakugaButton>
          </div>
        )}
      </div>
    </div>
  );
}
