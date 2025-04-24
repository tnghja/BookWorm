import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' 
import './index.css'
import App from './App.jsx'
import { AuthProvider } from '@/components/context/AuthContext';
import CartPersistenceManager from '@/components/CartPersistenceManager';
createRoot(document.getElementById('root')).render(
  <StrictMode>
   <AuthProvider>
   <CartPersistenceManager />
      <App />
    </AuthProvider>
  </StrictMode>,
)
