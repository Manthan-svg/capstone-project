// Normalize landmarks to be relative to the wrist (landmark 0) and scaled stably
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return []
  
  const wrist = landmarks[0]
  const middleMCP = landmarks[9] // Middle finger metacarpophalangeal joint
  
  // Use distance between wrist and middle finger base as a stable scale factor
  // This is much better than bounding box which changes wildly as fingers move
  const dx = middleMCP.x - wrist.x
  const dy = middleMCP.y - wrist.y
  const dz = middleMCP.z - wrist.z
  const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1 // Avoid divide by zero
  
  return landmarks.map(lm => ({
    x: (lm.x - wrist.x) / scale,
    y: (lm.y - wrist.y) / scale,
    z: (lm.z - wrist.z) / scale
  }))
}

// Calculate Euclidean distance between two normalized landmark arrays
function calculateDistance(lm1, lm2) {
  if (lm1.length !== lm2.length) return Infinity
  
  let sum = 0
  for (let i = 0; i < lm1.length; i++) {
    const dx = lm1[i].x - lm2[i].x
    const dy = lm1[i].y - lm2[i].y
    const dz = lm1[i].z - lm2[i].z
    sum += dx * dx + dy * dy + dz * dz
  }
  return Math.sqrt(sum)
}

// Simple 1-NN Classifier
export function classifySign(currentLandmarks, templates, threshold = 1.5) {
  if (!currentLandmarks || templates.length === 0) return null
  
  const normalizedCurrent = normalizeLandmarks(currentLandmarks)
  
  let bestMatch = null
  let minDistance = Infinity
  
  for (const template of templates) {
    // template.landmarksList contains multiple frames captured during enrollment
    for (const savedFrame of template.landmarksList) {
      const distance = calculateDistance(normalizedCurrent, savedFrame)
      if (distance < minDistance) {
        minDistance = distance
        bestMatch = template.word
      }
    }
  }
  
  if (minDistance < threshold) {
    return { word: bestMatch, distance: minDistance }
  }
  return null
}
