import { createRoot } from 'react-dom/client'
import App from './App.js'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <AuthProvider>
            <App />
            <Toaster
              position="top-center"
              theme="dark"
              toastOptions={{
                style: {
                  background: '#1f1f1f',
                  color: '#ffffff',
                  border: '1px solid #333333',
                },
                classNames: {
                  toast: 'bg-neutral-900 text-white border border-neutral-800',
                  success: 'bg-neutral-900 text-white border border-neutral-800',
                  error: 'bg-neutral-900 text-white border border-neutral-800',
                },
              }}
            />
        </AuthProvider>
    </BrowserRouter>,
)