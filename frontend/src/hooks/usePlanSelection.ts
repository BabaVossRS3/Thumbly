import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export const usePlanSelection = () => {
  const navigate = useNavigate()
  const [showPlanSelection, setShowPlanSelection] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkUserPlan = async () => {
    try {
      setError(null)
      const response = await fetch('/api/user/verify', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || `Failed to verify user plan (${response.status})`
        setError(errorMessage)
        console.error('Error checking user plan:', errorMessage)
        return false
      }

      const data = await response.json()
      
      // Null safety checks
      if (!data || typeof data !== 'object') {
        setError('Invalid response format from server')
        console.error('Invalid response format:', data)
        return false
      }

      if (!data.user || typeof data.user !== 'object') {
        setError('User data not found in response')
        console.error('User data missing:', data)
        return false
      }

      // If user doesn't have a plan, show plan selection
      if (!data.user.hasPlan) {
        setShowPlanSelection(true)
        return true
      }
      return false
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred while checking your plan'
      setError(errorMessage)
      console.error('Error checking user plan:', error)
      toast.error(errorMessage)
      return false
    }
  }

  const selectPlan = async (planType: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // Validate planType
      if (!planType || typeof planType !== 'string' || planType.trim() === '') {
        setError('Invalid plan type selected')
        toast.error('Invalid plan type selected')
        setIsLoading(false)
        return
      }

      // Update user with selected plan
      const response = await fetch('/api/user/select-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ planType }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.message || `Failed to select plan (${response.status})`
        setError(errorMessage)
        toast.error(errorMessage)
        console.error('Error selecting plan:', errorMessage)
        return
      }

      const data = await response.json()
      
      // Null safety check
      if (!data || typeof data !== 'object') {
        setError('Invalid response format from server')
        toast.error('Invalid response from server')
        console.error('Invalid response format:', data)
        return
      }

      setShowPlanSelection(false)
      toast.success('Plan selected successfully!')
      // Redirect to home or dashboard
      navigate('/')
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred while selecting your plan'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error selecting plan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    showPlanSelection,
    setShowPlanSelection,
    checkUserPlan,
    selectPlan,
    isLoading,
    error,
    setError,
  }
}
