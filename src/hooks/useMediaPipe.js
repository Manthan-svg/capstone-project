import { useState, useEffect, useRef } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export function useMediaPipe() {
  const [isLoaded, setIsLoaded] = useState(false)
  const landmarkerRef = useRef(null)

  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        )
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        landmarkerRef.current = handLandmarker
        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to load MediaPipe:", error)
      }
    }
    initMediaPipe()

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close()
      }
    }
  }, [])

  return { landmarker: landmarkerRef.current, isLoaded }
}
