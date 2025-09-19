import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initToastSystem } from '@/utils/toast'

// Initialize toast system early
initToastSystem();

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 