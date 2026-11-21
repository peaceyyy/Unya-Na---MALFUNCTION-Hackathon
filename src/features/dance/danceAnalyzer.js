// Decides whether someone is dancing (upper body only) from MoveNet keypoints.
//
// MoveNet gives 17 COCO keypoints per frame. Only the upper body is used:
// nose 0, shoulders 5/6, elbows 7/8, wrists 9/10. Hips and legs are ignored.
//
// All distances are measured in shoulder-widths, so the result does not depend
// on how far the person stands from the camera. Wrists and elbows are measured
// relative to the shoulder midpoint, so walking sideways or leaning does not
// count as arm movement; only the arms moving around the body does.
//
// "Dancing" means, over the last `windowMs`:
//   1. the arms travel at least `minArmSpeed` shoulder-widths per second, and
//   2. they change direction at least `minReversals` times (a real dance is
//      back-and-forth, so one big sweep or a held pose does not pass).

const L_SHOULDER = 5;
const R_SHOULDER = 6;
const L_ELBOW = 7;
const R_ELBOW = 8;
const L_WRIST = 9;
const R_WRIST = 10;

export const DEFAULTS = {
  windowMs: 2000, // how much recent motion is judged
  minCoverageMs: 1200, // need at least this much valid history before judging
  minShoulderPx: 24, // shoulders closer together than this means too far away
  shoulderScore: 0.3, // minimum keypoint confidence for the shoulders
  armScore: 0.25, // minimum keypoint confidence for wrists and elbows
  minArmSpeed: 1.0, // shoulder-widths per second, averaged over the visible arms
  reversalAmplitude: 0.25, // a direction change must span this many shoulder-widths
  minReversals: 3, // direction changes across the arms in the window
  minIntervalMs: 1500, // minimum time between two detections
  maxStep: 3, // ignore frame-to-frame jumps bigger than this (tracking glitches)
};

// Counts turning points in a signal, ignoring wiggles smaller than `amp`.
export function zigzag(values, amp) {
  if (values.length < 2) return 0;
  let count = 0;
  let dir = 0;
  let ext = values[0];
  for (let i = 1; i < values.length; i += 1) {
    const v = values[i];
    if (dir === 0) {
      if (v - ext >= amp) {
        dir = 1;
        ext = v;
      } else if (ext - v >= amp) {
        dir = -1;
        ext = v;
      }
    } else if (dir === 1) {
      if (v > ext) ext = v;
      else if (ext - v >= amp) {
        dir = -1;
        ext = v;
        count += 1;
      }
    } else if (v < ext) ext = v;
    else if (v - ext >= amp) {
      dir = 1;
      ext = v;
      count += 1;
    }
  }
  return count;
}

function pathLength(points, maxStep) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (d <= maxStep) total += d;
  }
  return total;
}

export function createDanceAnalyzer(options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  let samples = []; // { t, l, r }: arm points in shoulder-widths, relative to the shoulder midpoint
  let lastDanceAt = -Infinity;

  function reset() {
    samples = [];
  }

  // keypoints: array of { x, y, score } in pixels. now: milliseconds.
  function push(keypoints, now) {
    const result = { status: 'no-body', energy: 0, reversals: 0, danced: false };
    if (!keypoints || keypoints.length < 11) {
      samples = [];
      return result;
    }

    const ls = keypoints[L_SHOULDER];
    const rs = keypoints[R_SHOULDER];
    if (!ls || !rs || ls.score < cfg.shoulderScore || rs.score < cfg.shoulderScore) {
      samples = [];
      return result;
    }
    const width = Math.hypot(ls.x - rs.x, ls.y - rs.y);
    if (width < cfg.minShoulderPx) {
      samples = [];
      result.status = 'too-far';
      return result;
    }

    const mid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const rel = (kp) => ({ x: (kp.x - mid.x) / width, y: (kp.y - mid.y) / width });
    const seen = (kp) => kp && kp.score >= cfg.armScore;

    // Use the elbow as a stand-in when a wrist is lost.
    const lKp = seen(keypoints[L_WRIST]) ? keypoints[L_WRIST] : seen(keypoints[L_ELBOW]) ? keypoints[L_ELBOW] : null;
    const rKp = seen(keypoints[R_WRIST]) ? keypoints[R_WRIST] : seen(keypoints[R_ELBOW]) ? keypoints[R_ELBOW] : null;
    if (!lKp && !rKp) {
      samples = [];
      result.status = 'no-arms';
      return result;
    }

    samples.push({ t: now, l: lKp ? rel(lKp) : null, r: rKp ? rel(rKp) : null });
    while (samples.length && now - samples[0].t > cfg.windowMs) samples.shift();

    const span = samples[samples.length - 1].t - samples[0].t;
    if (span < cfg.minCoverageMs) {
      result.status = 'idle';
      return result;
    }

    let speedSum = 0;
    let arms = 0;
    let reversals = 0;
    ['l', 'r'].forEach((side) => {
      const pts = samples.map((s) => s[side]).filter(Boolean);
      if (pts.length < 4) return;
      arms += 1;
      speedSum += pathLength(pts, cfg.maxStep) / (span / 1000);
      reversals += zigzag(pts.map((p) => p.x), cfg.reversalAmplitude);
      reversals += zigzag(pts.map((p) => p.y), cfg.reversalAmplitude);
    });
    if (!arms) {
      result.status = 'idle';
      return result;
    }

    const speed = speedSum / arms;
    result.energy = Math.min(1, speed / (cfg.minArmSpeed * 2.5));
    result.reversals = reversals;
    const dancing = speed >= cfg.minArmSpeed && reversals >= cfg.minReversals;
    result.status = dancing ? 'dancing' : speed >= cfg.minArmSpeed * 0.4 ? 'moving' : 'idle';

    if (dancing && now - lastDanceAt >= cfg.minIntervalMs) {
      lastDanceAt = now;
      samples = []; // the next detection has to be earned with fresh movement
      result.danced = true;
    }
    return result;
  }

  return { push, reset };
}
