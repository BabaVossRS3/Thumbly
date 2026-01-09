import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import SoftBackdrop from '../components/SoftBackdrop'
import api from '@/configs/api'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [syncing, setSyncing] = useState(true)
  const [planType, setPlanType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const MAX_RETRIES = 3

  useEffect(() => {
    const syncSubscription = async () => {
      const sessionId = searchParams.get('session_id')
      if (!sessionId) {
        setError('No session ID found. Please contact support.')
        setSyncing(false)
        return
      }

      try {
        setSyncing(true)
        setError(null)
        const { data } = await api.post('/api/subscription/sync', { sessionId })
        setPlanType(data.planType)
        console.log('Subscription synced:', data)
        setSyncing(false)
      } catch (error: any) {
        console.error('Error syncing subscription:', error)
        const errorMessage = error?.response?.data?.message || 'Failed to sync subscription. Please try again.'
        setError(errorMessage)
        
        // Auto-retry logic with cleanup
        if (retryCount < MAX_RETRIES) {
          // Clear any existing retry timeout before setting a new one
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1)
            retryTimeoutRef.current = null
          }, 2000) // Retry after 2 seconds
        } else {
          setSyncing(false)
        }
      }
    }

    syncSubscription()
  }, [searchParams, retryCount])

  // Cleanup retry timeout on component unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!syncing) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [syncing, navigate])

  return (
    <>
      <SoftBackdrop />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error ? (
            <>
              <motion.div
                className="mb-6 flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <AlertCircle className="w-20 h-20 text-red-500" />
              </motion.div>

              <motion.h1
                className="text-4xl font-bold text-red-400 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Something Went Wrong
              </motion.h1>

              <motion.p
                className="text-lg text-gray-400 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {error}
              </motion.p>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {retryCount < MAX_RETRIES && (
                  <p className="text-sm text-gray-500">
                    Retrying... (Attempt {retryCount + 1} of {MAX_RETRIES})
                  </p>
                )}
                <button
                  onClick={() => setRetryCount(0)}
                  className="w-full py-3 px-6 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-6 bg-transparent border border-gray-500 text-gray-400 font-semibold rounded-lg hover:bg-gray-950/30 transition-colors"
                >
                  Go Home
                </button>
              </motion.div>
            </>
          ) : syncing ? (
            <>
              <motion.div
                className="mb-6 flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Loader2 className="w-20 h-20 text-pink-500 animate-spin" />
              </motion.div>
              <motion.h1
                className="text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Activating Your Plan...
              </motion.h1>
              <motion.p
                className="text-lg text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Please wait while we set up your subscription.
              </motion.p>
            </>
          ) : (
            <>
              <motion.div
                className="mb-6 flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-stone-300" />
              </motion.div>

              <motion.h1
                className="text-4xl font-bold text-stone-100 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Payment Successful!
              </motion.h1>

              <motion.p
                className="text-lg text-stone-400 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {planType 
                  ? `You're now on the ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan!` 
                  : 'Thank you for your subscription.'} Your plan is now active.
              </motion.p>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-stone-400">
                  Redirecting to home in 5 seconds...
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-6 bg-transparent border border-stone-300 text-stone-300 font-semibold rounded-lg hover:bg-stone-950/30 transition-colors"
                >
                  Go Home Now
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </>
  )
}
