import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext'
import { WebSocketProvider } from './context/WebSocketContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider maxVisible={3} defaultDuration={4000}>
        <WebSocketProvider url="ws://localhost:8000/ws">
          <App />
        </WebSocketProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
