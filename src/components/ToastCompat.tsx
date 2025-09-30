import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info'

export const Toast = {
  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    const options = {
      duration,
    }

    switch (type) {
      case 'success':
        toast.success(message, options)
        break
      case 'error':
        toast.error(message, options)
        break
      case 'info':
      default:
        toast.info(message, options)
        break
    }
  },

  success(message: string, duration?: number) {
    toast.success(message, { duration })
  },

  error(message: string, duration?: number) {
    toast.error(message, { duration })
  },

  info(message: string, duration?: number) {
    toast.info(message, { duration })
  }
}