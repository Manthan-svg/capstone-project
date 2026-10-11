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
export function classifySign(currentLandmarks, templates, threshold = 15.0) {
  if (!currentLandmarks || !templates || templates.length === 0) return null
  
  const normalizedCurrent = normalizeLandmarks(currentLandmarks)
  
  let bestMatch = null
  let minDistance = Infinity
  
  for (const template of templates) {
    if (!template.landmarksList) continue
    for (const savedFrame of template.landmarksList) {
      const distance = calculateDistance(normalizedCurrent, savedFrame)
      if (distance < minDistance) {
        minDistance = distance
        bestMatch = template.word
      }
    }
  }
  
  if (minDistance < threshold) {
    const confidence = Math.max(0, Math.min(100, Math.round((1 - minDistance / threshold) * 100)))
    return { word: bestMatch, distance: minDistance, confidence }
  }
  return null
}

// Verify if current sign specifically matches the expected target word
export function verifySpecificSign(currentLandmarks, targetWord, templates, threshold = 15.0) {
  if (!currentLandmarks || !templates || templates.length === 0 || !targetWord) {
    return { isMatch: false, reason: 'No landmarks or templates' }
  }
  
  const template = templates.find(t => t.word.toLowerCase() === targetWord.toLowerCase())
  if (!template || !template.landmarksList || template.landmarksList.length === 0) {
    return { isMatch: false, reason: 'Sign not enrolled yet' }
  }
  
  const normalizedCurrent = normalizeLandmarks(currentLandmarks)
  let minDistance = Infinity
  
  for (const savedFrame of template.landmarksList) {
    const distance = calculateDistance(normalizedCurrent, savedFrame)
    if (distance < minDistance) {
      minDistance = distance
    }
  }
  
  const isMatch = minDistance < threshold
  const confidence = Math.max(0, Math.min(100, Math.round((1 - minDistance / threshold) * 100)))
  
  return {
    isMatch,
    distance: minDistance,
    confidence,
    targetWord
  }
}

// Assess quality of captured landmarks sequence during enrollment
export function calculateSignQuality(landmarksLog) {
  if (!landmarksLog || landmarksLog.length === 0) {
    return { isValid: false, score: 0, frameCount: 0, message: 'No hand detected during recording.' }
  }
  
  const frameCount = landmarksLog.length
  if (frameCount < 5) {
    return { isValid: false, score: 20, frameCount, message: 'Too few frames captured. Keep hands in camera view.' }
  }
  
  // High quality if at least 10 frames of hands were captured
  const score = Math.min(100, Math.round((frameCount / 25) * 100))
  return {
    isValid: true,
    score,
    frameCount,
    message: `Sign captured successfully (${frameCount} frames analyzed).`
  }
}

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm
]

// Draw hand landmarks skeleton onto an HTML5 canvas over camera
export function drawHandLandmarks(ctx, multiHandLandmarks, width, height, isFlipped = true) {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) return

  multiHandLandmarks.forEach((landmarks) => {
    // Skeleton connections
    ctx.strokeStyle = '#6366f1' // Indigo
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i]
      const p2 = landmarks[j]
      if (p1 && p2) {
        const x1 = isFlipped ? (1 - p1.x) * width : p1.x * width
        const y1 = p1.y * height
        const x2 = isFlipped ? (1 - p2.x) * width : p2.x * width
        const y2 = p2.y * height

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    })

    // Landmarks points
    landmarks.forEach((p, idx) => {
      const x = isFlipped ? (1 - p.x) * width : p.x * width
      const y = p.y * height

      ctx.beginPath()
      const isFingertip = [4, 8, 12, 16, 20].includes(idx)
      const radius = isFingertip ? 6 : 4
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = isFingertip ? '#10b981' : '#a855f7' // Emerald tips, Purple joints
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  })
}
