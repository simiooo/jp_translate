import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

function ToastComponent({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const baseStyles = "fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out z-50"
  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white"
  }

  return (
    <div className={`${baseStyles} ${typeStyles[type]} animate-fade-in`}>
      <div className="flex items-center gap-2">
        {type === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  )
}

export const Toast = {
  _container: null as HTMLDivElement | null,
  _root: null as any,

  _createContainer() {
    if (!this._container) {
      this._container = document.createElement('div')
      this._container.id = 'toast-container'
      document.body.appendChild(this._container)
      this._root = createRoot(this._container)
    }
  },

  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    this._createContainer()
    
    const onClose = () => {
      if (this._root) {
        this._root.render(null)
      }
    }

    this._root?.render(
      <ToastComponent
        message={message}
        type={type}
        duration={duration}
        onClose={onClose}
      />
    )
  },

  success(message: string, duration?: number) {
    this.show(message, 'success', duration)
  },

  error(message: string, duration?: number) {
    this.show(message, 'error', duration)
  },

  info(message: string, duration?: number) {
    this.show(message, 'info', duration)
  }
} 