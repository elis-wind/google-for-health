import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import VirtualPatient from './VirtualPatient' //
import StudentReport from './StudentReport' //
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/virtual-patient" element={<VirtualPatient />} />
        <Route path="/report" element={<StudentReport />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)