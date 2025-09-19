import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initToastSystem } from '@/utils/toast'

// Initialize toast system early
initToastSystem();

// Force Vercel rebuild - version 1.1
console.log('🚀 Strings App v1.1 - Force rebuild');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
) 