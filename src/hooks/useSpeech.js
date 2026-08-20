import { useState, useEffect, useCallback, useRef } from 'react'

export function useSpeech(onResult) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const shouldListenRef = useRef(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        
        recognition.onresult = (event) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript
          }
          if (onResult) {
            onResult(transcript.trim())
          }
        }
        
        recognition.onerror = (event) => {
          console.error("Speech recognition error", event.error)
          if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please check your browser permissions.')
            shouldListenRef.current = false
            setIsListening(false)
          } else if (event.error === 'network') {
            alert('Speech recognition network error. If you are using Brave or a privacy-focused browser, it may be blocking the Web Speech API. Please try using Google Chrome or Microsoft Edge.')
            shouldListenRef.current = false
            setIsListening(false)
          }
          // For 'no-speech', we ignore the error because onend will fire and restart it.
          // Don't set isListening to false here if we intend to keep listening.
        }
        
        recognition.onend = () => {
          if (shouldListenRef.current) {
            setTimeout(() => {
              try {
                recognition.start()
                setIsListening(true)
              } catch (e) {
                console.error("Failed to restart recognition", e)
                // If it's already started, just ensure UI is in sync
                if (e.name === 'InvalidStateError') {
                  setIsListening(true)
                } else {
                  setIsListening(false)
                  shouldListenRef.current = false
                }
              }
            }, 100) // Small delay prevents the 'already started' crash in Chrome
          } else {
            setIsListening(false)
          }
        }
        
        recognitionRef.current = recognition
      } else {
        console.warn("Speech Recognition API not supported in this browser.")
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        try { recognitionRef.current.stop() } catch (e) {}
      }
    }
  }, [onResult])
  
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldListenRef.current = true
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }, [isListening])
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      shouldListenRef.current = false
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])
  
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    } else {
      console.warn("Speech Synthesis API not supported in this browser.")
    }
  }, [])
  
  return { isListening, startListening, stopListening, speak }
}
