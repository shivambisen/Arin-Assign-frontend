import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode >
    <div style={{ width: '100%', minHeight: '100vh', height: '100%' }}>
      <App  />
    </div>
  </StrictMode>,
)
