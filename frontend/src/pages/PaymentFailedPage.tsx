import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import SoftBackdrop from '../components/SoftBackdrop'

export default function PaymentFailedPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/pricing')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

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
          <motion.div
            className="mb-6 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <XCircle className="w-20 h-20 text-red-500" />
          </motion.div>

          <motion.h1
            className="text-4xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Payment Failed
          </motion.h1>

          <motion.p
            className="text-lg text-gray-400 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Unfortunately, your payment could not be processed. Please check your payment details and try again.
          </motion.p>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-500">
              Redirecting to pricing in 5 seconds...
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/pricing')}
                className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
