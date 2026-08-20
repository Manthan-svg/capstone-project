import { useRef, useEffect } from 'react'
import handSigning from '../assets/hand-signing.png'
import earListening from '../assets/ear-listening.png'

export function SignAvatar({ 
  videoUrl, 
  onVideoEnd, 
  fallbackType = 'hearing', 
  className = '', 
  idleMode = false 
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.play().catch(e => console.error(e))
    }
  }, [videoUrl])

  // In idle mode or if no video is playing, show the fallback
  if (!videoUrl || idleMode) {
    const fallbackImage = fallbackType === 'deaf' ? handSigning : earListening;
    
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-full h-full opacity-80 animate-float transition-transform duration-500 flex items-center justify-center">
          <img 
            src={fallbackImage} 
            alt="SignBridge AI Avatar" 
            className="w-full h-full object-contain drop-shadow-xl" 
          />
        </div>
      </div>
    )
  }

  // Play video
  return (
    <video 
      ref={videoRef}
      src={videoUrl} 
      className={`object-cover ${className}`}
      onEnded={onVideoEnd}
      autoPlay
      muted
      playsInline
      loop={idleMode} // If we ever get an idle clip, loop it
    />
  )
}
