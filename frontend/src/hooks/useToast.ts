import { useState, useCallback } from 'react'
import { Toast, ToastType } from '../components/ui/Toast'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((
    type: ToastType,
    title: string,
    options?: {
      description?: string
      duration?: number
      action?: {
        label: string
        onClick: () => void
      }
    }
  ) => {
    const id = `toast-${++toastId}`
    const duration = options?.duration ?? (type === 'error' ? 0 : 5000) // Error toasts stay until dismissed
    
    const toast: Toast = {
      id,
      type,
      title,
      description: options?.description,
      duration,
      action: options?.action,
    }

    setToasts((toasts) => [...toasts, toast])
    
    return id
  }, [])

  const success = useCallback((title: string, options?: Omit<Parameters<typeof addToast>[2], never>) => {
    return addToast('success', title, options)
  }, [addToast])

  const error = useCallback((title: string, options?: Omit<Parameters<typeof addToast>[2], never>) => {
    return addToast('error', title, options)
  }, [addToast])

  const warning = useCallback((title: string, options?: Omit<Parameters<typeof addToast>[2], never>) => {
    return addToast('warning', title, options)
  }, [addToast])

  const info = useCallback((title: string, options?: Omit<Parameters<typeof addToast>[2], never>) => {
    return addToast('info', title, options)
  }, [addToast])

  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [removeToast])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    removeToast,
  }
}