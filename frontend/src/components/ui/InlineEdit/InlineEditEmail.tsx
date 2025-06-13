import { useState, useRef, useEffect } from 'react'
import { Check, X, Edit3, Loader2, Mail } from 'lucide-react'

interface InlineEditEmailProps {
  value: string | undefined
  onSave: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  allowEmpty?: boolean
}

export function InlineEditEmail({
  value = '',
  onSave,
  placeholder = 'Click to add email',
  className = '',
  disabled = false,
  required = false,
  allowEmpty = true
}: InlineEditEmailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      if (required && !allowEmpty) {
        throw new Error('Email address is required')
      }
      return ''
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Please enter a valid email address')
    }

    return trimmedEmail
  }

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setError(null)
  }

  const handleSave = async () => {
    setError(null)

    try {
      const validatedEmail = validateEmail(editValue)
      
      if (validatedEmail === value) {
        setIsEditing(false)
        return
      }

      setIsSaving(true)
      await onSave(validatedEmail)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleBlur = () => {
    if (!isSaving && editValue !== value) {
      handleSave()
    } else if (!isSaving) {
      setIsEditing(false)
    }
  }

  const displayValue = value || placeholder
  const isEmpty = !value

  if (!isEditing) {
    return (
      <button
        onClick={handleEdit}
        disabled={disabled}
        className={`
          group relative inline-flex items-center gap-2 text-left
          ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer'}
          ${className}
          rounded px-2 py-1 transition-colors
        `}
        title={disabled ? undefined : 'Click to edit'}
      >
        <div className="flex items-center gap-2">
          {!isEmpty && <Mail className="w-3 h-3 text-gray-400" />}
          <span className={!isEmpty ? 'text-primary-600 hover:underline' : ''}>
            {displayValue}
          </span>
        </div>
        {!disabled && (
          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="email"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isSaving}
            placeholder="Enter email address"
            className={`
              w-full pl-8 pr-2 py-1 text-sm border border-primary-300 rounded
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
              ${className}
            `}
          />
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
            title="Save"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}