import { Turnstile } from '@marsidev/react-turnstile'
import { useEffect, useState } from 'react'

interface TurnstileWidgetProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  className?: string
  resetKey?: number
}

export function TurnstileWidget({
  siteKey,
  onVerify,
  onError,
  onExpire,
  className = '',
  resetKey = 0
}: TurnstileWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if Turnstile script is loaded
    const checkScript = () => {
      if (typeof window !== 'undefined' && window.turnstile) {
        setIsLoaded(true)
      } else {
        // If not loaded, wait a bit and check again
        setTimeout(checkScript, 100)
      }
    }

    checkScript()
  }, [])

  const handleVerify = (token: string) => {
    onVerify(token)
  }

  const handleError = () => {
    console.error('Turnstile verification failed')
    onError?.()
  }

  const handleExpire = () => {
    console.warn('Turnstile token expired')
    onExpire?.()
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center h-16 bg-gray-100 dark:bg-gray-800 rounded-md ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`turnstile-container ${className}`}>
      <Turnstile
        key={resetKey}
        siteKey={siteKey}
        onSuccess={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          theme: 'auto',
          size: 'normal',
          retry: 'auto'
        }}
      />
    </div>
  )
}
