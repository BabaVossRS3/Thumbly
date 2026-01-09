import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pricingData } from '../data/pricing'
import type { IPricing } from '../types'
import { CheckIcon, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import SoftBackdrop from '../components/SoftBackdrop'
import api from '../configs/api'

interface PlanSelectionPageProps {
  onPlanSelected?: (planType: string) => void
  isLoading?: boolean
}

// Validate that URL is a valid Stripe checkout URL
const isValidCheckoutUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url)
    // Only allow https protocol
    if (parsedUrl.protocol !== 'https:') {
      return false
    }
    // Only allow exact Stripe checkout domains (not subdomains of attacker domains)
    // Valid: checkout.stripe.com, stripe.com
    // Invalid: stripe.com.attacker.com, attacker-stripe.com
    const hostname = parsedUrl.hostname
    const validStripeHosts = [
      'checkout.stripe.com',
      'stripe.com',
      'pay.stripe.com',
      'billing.stripe.com'
    ]
    
    // Check if hostname exactly matches one of the valid hosts
    if (!validStripeHosts.includes(hostname)) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export default function PlanSelectionPage({ onPlanSelected, isLoading = false }: PlanSelectionPageProps) {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = async (planName: string) => {
    setSelectedPlan(planName)
    setError(null)
    
    // If free plan, just proceed
    if (planName.toLowerCase() === 'free') {
      onPlanSelected?.('free')
      navigate('/')
      return
    }

    // For paid plans, redirect to Stripe checkout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await api.post('/api/subscription/checkout', 
        { planType: planName.toLowerCase() },
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      if (response.data?.url) {
        // Validate checkout URL before redirecting
        if (!isValidCheckoutUrl(response.data.url)) {
          setError('Invalid checkout URL received. Please try again.')
          setSelectedPlan(null)
          return
        }
        window.location.href = response.data.url
      } else {
        setError(response.data?.message || 'Failed to create checkout session. Please try again.')
        setSelectedPlan(null)
      }
    } catch (error: any) {
      // Always clear timeout in error path to prevent memory leak
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        setError('Payment request timed out. Please check your connection and try again.')
      } else if (error.response?.status === 401) {
        setError('Please log in to continue with your subscription.')
      } else if (error.response?.status === 400) {
        setError(error.response?.data?.message || 'Invalid plan selection. Please try again.')
      } else if (error.response?.status === 500) {
        setError('Payment service is temporarily unavailable. Please try again later.')
      } else {
        setError('Unable to process your request. Please check your connection and try again.')
      }
      console.error('Error creating checkout session:', error)
      setSelectedPlan(null)
    }
  }

  return (
    <>
      <SoftBackdrop />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-7xl">
        {error && (
          <motion.div
            className="mb-8 p-4 bg-red-950/50 border border-red-700 rounded-lg flex items-start gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-medium">Payment Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </motion.div>
        )}
        <div className="text-center mb-16">
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Choose Your Plan
          </motion.h1>
          <motion.p
            className="text-xl text-slate-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Select a plan to get started with Thumbly
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingData.map((plan: IPricing, index: number) => (
            <motion.div
              key={index}
              className={`relative rounded-xl border p-6 pb-8 transition-all cursor-pointer ${
                selectedPlan === plan.name
                  ? 'border-pink-500 bg-pink-950/30 ring-2 ring-pink-500'
                  : plan.mostPopular
                  ? 'border-pink-600 bg-pink-950'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              onClick={() => handleSelectPlan(plan.name)}
            >
              {plan.mostPopular && (
                <div className="absolute -top-3 left-4">
                  <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.price === 0 ? 'Free' : `€${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-400">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                disabled={isLoading || selectedPlan === plan.name}
                className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                  selectedPlan === plan.name
                    ? 'bg-pink-600 text-white cursor-wait'
                    : plan.mostPopular
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                } disabled:opacity-50`}
              >
                {selectedPlan === plan.name ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {plan.price === 0 ? 'Selecting...' : 'Redirecting...'}
                  </span>
                ) : plan.price === 0 ? (
                  'Get Started Free'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>You can change your plan anytime. No credit card required for the free plan.</p>
        </div>
        </div>
      </div>
    </>
  )
}
