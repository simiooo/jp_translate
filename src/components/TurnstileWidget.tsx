import { Turnstile } from '@marsidev/react-turnstile'

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
