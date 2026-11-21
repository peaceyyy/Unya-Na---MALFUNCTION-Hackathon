// @tensorflow-models/pose-detection imports `Pose` from @mediapipe/pose for its
// BlazePose-on-MediaPipe runtime. That package has no ES exports, which breaks
// bundling, and the dance detector only uses MoveNet. vite.config.js points the
// import here instead.
export class Pose {
  constructor() {
    throw new Error('The MediaPipe runtime is not bundled. Use the MoveNet model.');
  }
}
