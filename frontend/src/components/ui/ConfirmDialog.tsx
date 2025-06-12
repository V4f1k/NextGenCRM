import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from './Modal'

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
  isLoading?: boolean
}

const typeStyles = {
  danger: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    confirmButton: 'btn-danger',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    confirmButton: 'btn-warning',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    confirmButton: 'btn-primary',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    confirmButton: 'btn-primary',
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const { icon: Icon, iconColor, confirmButton } = typeStyles[type]

  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOutsideClick={!isLoading}
      showCloseButton={false}
    >
      <ModalBody>
        <div className="flex items-start">
          <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-${type === 'danger' ? 'red' : type === 'warning' ? 'yellow' : type === 'success' ? 'green' : 'blue'}-100 sm:mx-0 sm:h-10 sm:w-10`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              {title}
            </h3>
            {description && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {description}
                </p>
              </div>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          className="btn-outline px-4 py-2"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`${confirmButton} px-4 py-2 disabled:opacity-50`}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Please wait...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  )
}