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

// Calculate 3D Euclidean distance between two points
function pointDistance(p1, p2) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  const dz = (p1.z || 0) - (p2.z || 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Geometric feature extractor for Indian Sign Language standard gestures
export function extractISLFeatures(landmarks) {
  if (!landmarks || landmarks.length < 21) return null

  const wrist = landmarks[0]

  // Finger tip to wrist distances
  const thumbTipDist = pointDistance(landmarks[4], wrist)
  const thumbBaseDist = pointDistance(landmarks[2], wrist)
  const indexTipDist = pointDistance(landmarks[8], wrist)
  const indexBaseDist = pointDistance(landmarks[5], wrist)
  const middleTipDist = pointDistance(landmarks[12], wrist)
  const middleBaseDist = pointDistance(landmarks[9], wrist)
  const ringTipDist = pointDistance(landmarks[16], wrist)
  const ringBaseDist = pointDistance(landmarks[13], wrist)
  const pinkyTipDist = pointDistance(landmarks[20], wrist)
  const pinkyBaseDist = pointDistance(landmarks[17], wrist)

  // Extension booleans (tip is significantly further from wrist than MCP joint)
  const isThumbExtended = thumbTipDist > thumbBaseDist * 1.15
  const isIndexExtended = indexTipDist > indexBaseDist * 1.3
  const isMiddleExtended = middleTipDist > middleBaseDist * 1.3
  const isRingExtended = ringTipDist > ringBaseDist * 1.3
  const isPinkyExtended = pinkyTipDist > pinkyBaseDist * 1.3

  // Thumbs up check: Thumb tip is higher (lower Y) than MCP and other 4 fingers are curled
  const isThumbUp = (landmarks[4].y < landmarks[3].y) && (landmarks[3].y < landmarks[2].y) &&
    !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended

  // Open Palm: All 5 fingers extended
  const isOpenPalm = isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended

  // Flat Palm (fingers extended together)
  const fingerSpread = pointDistance(landmarks[8], landmarks[12]) + pointDistance(landmarks[12], landmarks[16])
  const isFlatPalm = isOpenPalm && (fingerSpread < 0.25)

  // Pointing Index ('No' or 'Pain' or '1')
  const isPointingIndex = isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended

  // 'V' shape / Two fingers ('Doctor' pulse check or '2')
  const isTwoFingers = isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended

  // 'W' shape / Three fingers ('Water' or '3')
  const isThreeFingersW = isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended

  // Fist: All fingers curled
  const isFist = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended

  return {
    isThumbUp,
    isOpenPalm,
    isFlatPalm,
    isPointingIndex,
    isTwoFingers,
    isThreeFingersW,
    isFist,
    wristY: wrist.y,
    isHandRaised: wrist.y < 0.8
  }
}

// Geometric rule-based fallback detection for standard ISL words
export function detectGeometricISLSign(landmarks) {
  const feat = extractISLFeatures(landmarks)
  if (!feat) return null

  // 1. "Yes" in ISL: Thumbs up gesture or nodding fist
  if (feat.isThumbUp) {
    return { word: 'yes', confidence: 92, rule: 'Thumbs-up affirmative' }
  }

  // 2. "No" in ISL: Pointing index wagging
  if (feat.isPointingIndex) {
    return { word: 'no', confidence: 88, rule: 'Index point negation' }
  }

  // 3. "Water" in ISL: 'W' handshape (3 fingers extended)
  if (feat.isThreeFingersW) {
    return { word: 'water', confidence: 90, rule: 'Three fingers W-sign' }
  }

  // 4. "Doctor" in ISL: Two fingers (Index + Middle) feeling pulse
  if (feat.isTwoFingers) {
    return { word: 'doctor', confidence: 89, rule: 'Two fingers medical sign' }
  }

  // 5. "Hello" / "Goodbye" in ISL: Raised open palm waving
  if (feat.isOpenPalm && feat.isHandRaised) {
    return { word: 'hello', confidence: 91, rule: 'Open palm greeting' }
  }

  // 6. "Thank you": Flat palm extended
  if (feat.isFlatPalm && feat.isHandRaised) {
    return { word: 'thank you', confidence: 87, rule: 'Flat palm civility' }
  }

  // 7. "Help": Fist or raised thumbs up
  if (feat.isFist && feat.isHandRaised) {
    return { word: 'help', confidence: 85, rule: 'Raised fist assistance' }
  }

  return null
}

// Hybrid 1-NN + Rule-Based Classifier for High Accuracy
export function classifySign(currentLandmarks, templates, threshold = 16.0) {
  if (!currentLandmarks) return null
  
  const normalizedCurrent = normalizeLandmarks(currentLandmarks)
  let bestMatch = null
  let minDistance = Infinity
  
  if (templates && templates.length > 0) {
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
  }

  // Check template match
  if (minDistance < threshold && bestMatch) {
    const confidence = Math.max(0, Math.min(100, Math.round((1 - minDistance / threshold) * 100)))
    return { word: bestMatch, distance: minDistance, confidence, source: 'template' }
  }

  // Fallback to geometric ISL rules (covers Learning Hub core signs)
  const geometricMatch = detectGeometricISLSign(currentLandmarks)
  if (geometricMatch) {
    return {
      word: geometricMatch.word,
      distance: 5.0,
      confidence: geometricMatch.confidence,
      source: 'rule-based'
    }
  }
  
  return null
}

// Verify if current sign specifically matches the expected target word with live posture guidance
export function verifySpecificSign(currentLandmarks, targetWord, templates, threshold = 16.0) {
  if (!currentLandmarks || !targetWord) {
    return { isMatch: false, reason: 'No landmarks or target word', confidence: 0 }
  }

  const normalizedWord = targetWord.toLowerCase().trim()
  const normalizedCurrent = normalizeLandmarks(currentLandmarks)
  
  // 1. Check against user template if enrolled
  let templateMatch = false
  let minDistance = Infinity
  
  if (templates && templates.length > 0) {
    const template = templates.find(t => t.word.toLowerCase().trim() === normalizedWord)
    if (template && template.landmarksList && template.landmarksList.length > 0) {
      for (const savedFrame of template.landmarksList) {
        const distance = calculateDistance(normalizedCurrent, savedFrame)
        if (distance < minDistance) {
          minDistance = distance
        }
      }
      if (minDistance < threshold) {
        templateMatch = true
      }
    }
  }

  // 2. Check against geometric rule for the specific word
  const geo = detectGeometricISLSign(currentLandmarks)
  const ruleMatch = geo && geo.word === normalizedWord

  const isMatch = templateMatch || ruleMatch
  const baseConfidence = templateMatch 
    ? Math.max(0, Math.min(100, Math.round((1 - minDistance / threshold) * 100)))
    : (ruleMatch ? geo.confidence : 0)

  // Boost confidence if both agree
  const finalConfidence = (templateMatch && ruleMatch) ? Math.min(98, baseConfidence + 10) : baseConfidence

  let postureFeedback = 'Adjust hand posture to match the sign.'
  if (isMatch) {
    postureFeedback = `Correct sign for "${targetWord}"! Great posture.`
  } else if (geo) {
    postureFeedback = `Currently detecting "${geo.word}". Switch to "${targetWord}".`
  }

  return {
    isMatch,
    distance: minDistance,
    confidence: finalConfidence,
    targetWord,
    postureFeedback
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
