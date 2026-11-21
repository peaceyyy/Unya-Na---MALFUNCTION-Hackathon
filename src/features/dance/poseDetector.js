// Loads the MoveNet pose model with TensorFlow.js. Imported lazily so the
// (large) TensorFlow bundle only downloads when someone actually has to dance.

let detectorPromise = null;

export function loadPoseDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const tf = await import('@tensorflow/tfjs-core');
      await import('@tensorflow/tfjs-converter');
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

      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      });
    })().catch((error) => {
      detectorPromise = null; // allow a retry
      throw error;
    });
  }
  return detectorPromise;
}
