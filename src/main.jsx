/**
 * Application Entry Point
 * -----------------------
 * Mounts the root React component into the DOM.
 * The #root element is defined in index.html.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  
  <App />
)
