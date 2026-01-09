import './App.css'
import { useState, useEffect } from 'react'
import SoftBackdrop from './components/SoftBackdrop'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import { API_ENDPOINTS } from './configs/api'

function App() {
  const [currentPage, setCurrentPage] = useState('users')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('adminToken')
      if (token) {
        try {
          const response = await fetch(API_ENDPOINTS.ADMIN_VERIFY, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminEmail')
            localStorage.removeItem('adminName')
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('Token verification failed:', error)
          localStorage.removeItem('adminToken')
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }

    verifyToken()

    const path = window.location.pathname.replace('/', '')
    if (path === 'analytics' || path === 'subscriptions' || path === 'users') {
      setCurrentPage(path)
    }
  }, [])

  const handlePageChange = (page: string) => {
    setCurrentPage(page)
    window.history.pushState({}, '', `/${page}`)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    window.history.pushState({}, '', '/users')
    setCurrentPage('users')
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken')
    try {
      if (token) {
        await fetch(API_ENDPOINTS.ADMIN_LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminEmail')
      localStorage.removeItem('adminName')
      setIsAuthenticated(false)
      window.history.pushState({}, '', '/login')
    }
  }

  if (isLoading) {
    return (
      <>
        <SoftBackdrop />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <SoftBackdrop />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  return (
    <>
      <SoftBackdrop />
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} onLogout={handleLogout} />
    </>
  )
}

export default App
