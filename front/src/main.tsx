import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import VirtualPatient from './VirtualPatient' // You'll create this component
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/virtual-patient" element={<VirtualPatient />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)