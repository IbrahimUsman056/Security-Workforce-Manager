import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  modelsLoaded = true;
}

async function getFaceDescriptor(imageElement) {
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor || null;
}

// Returns a 0-1 similarity score (1 = identical, 0 = completely different)
export async function compareFaces(profileImageElement, selfieImageElement) {
  await loadFaceModels();

  const profileDescriptor = await getFaceDescriptor(profileImageElement);
  const selfieDescriptor = await getFaceDescriptor(selfieImageElement);

  if (!profileDescriptor || !selfieDescriptor) {
    return { score: 0, error: 'Could not detect a face in one or both images' };
  }

  const distance = faceapi.euclideanDistance(profileDescriptor, selfieDescriptor);
  // euclidean distance: lower = more similar. Typical threshold ~0.6.
  // Convert to a 0-1 "similarity" score for easier interpretation.
  const similarity = Math.max(0, 1 - distance);

  return { score: similarity, error: null };
}