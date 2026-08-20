import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Force clear any lingering dark mode state
document.documentElement.removeAttribute('data-theme')
document.documentElement.classList.remove('dark')
localStorage.removeItem('theme')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
