// Loads the MoveNet pose model with TensorFlow.js.
//
// Everything slow about the first dance happens here: downloading the TensorFlow code, downloading
// the model, setting up the WebGL backend, and the first frame (which compiles the GPU shaders). So
// it is all done ahead of time. preloadPoseDetector() starts it in the background once someone is
// signed in, and the dance screen then just picks up the finished detector. The model is also kept
// in the browser's IndexedDB, so on later visits it is not downloaded again.
//
// The TensorFlow code is imported lazily, so it stays out of the main bundle.

const MODEL_URL = 'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4';
const CACHE_URL = 'indexeddb://movenet-singlepose-lightning-4';

let detectorPromise = null;

// Runs one blank frame through the detector. The first inference is much slower than the rest
// because the GPU shaders are compiled on the spot; doing it now means the first real frame is fast.
async function warmUp(detector) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#808080';
  context.fillRect(0, 0, 256, 256);
  await detector.estimatePoses(canvas);
  detector.reset?.(); // forget the blank frame, so smoothing starts clean on the first real one
}

// Makes sure a copy of the model is in IndexedDB. The first time, this is the one download.
async function ensureModelCached(tf, tfconv) {
  const stored = await tf.io.listModels();
  if (stored[CACHE_URL]) return;
  const model = await tfconv.loadGraphModel(MODEL_URL, { fromTFHub: true });
  await model.save(CACHE_URL);
  model.dispose();
}

export function loadPoseDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const [tf, tfconv] = await Promise.all([
        import('@tensorflow/tfjs-core'),
        import('@tensorflow/tfjs-converter'),
      ]);
      await import('@tensorflow/tfjs-backend-webgl');
      const poseDetection = await import('@tensorflow-models/pose-detection');

      // setBackend resolves to false (it does not throw) when WebGL is unavailable.
      let ready = false;
      try {
        ready = await tf.setBackend('webgl');
      } catch {
        ready = false;
      }
      if (!ready) {
        await import('@tensorflow/tfjs-backend-cpu');
        await tf.setBackend('cpu');
      }
      await tf.ready();

      const config = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };
      let detector;
      try {
        // From the local copy (downloaded just once, above).
        await ensureModelCached(tf, tfconv);
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          ...config,
          modelUrl: CACHE_URL,
        });
      } catch {
        // IndexedDB blocked or full, or the cached copy is damaged: download straight from the source.
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, config);
      }

      await warmUp(detector);
      return detector;
    })().catch((error) => {
      detectorPromise = null; // allow a retry
      throw error;
    });
  }
  return detectorPromise;
}

// Starts loading in the background, when the browser is idle. Safe to call more than once. Errors are
// ignored here; if it failed, the dance screen tries again and shows the problem.
export function preloadPoseDetector() {
  if (typeof window === 'undefined') return;
  if (navigator.connection?.saveData) return; // the user asked for less data use
  const start = () => {
    loadPoseDetector().catch(() => {});
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 8000 });
  else setTimeout(start, 2000);
}
