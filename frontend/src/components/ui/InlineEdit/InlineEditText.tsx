import { useState, useRef, useEffect } from 'react'
import { Check, X, Edit3, Loader2 } from 'lucide-react'

interface InlineEditTextProps {
  value: string | undefined
  onSave: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  maxLength?: number
  multiline?: boolean
}

export function InlineEditText({
  value = '',
  onSave,
  placeholder = 'Click to edit',
  className = '',
  disabled = false,
  required = false,
  maxLength,
  multiline = false
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

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
    if (required && !editValue.trim()) {
      setError('This field is required')
      return
    }

    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(editValue.trim())
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
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
        <span>{displayValue}</span>
        {!disabled && (
          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    )
  }

  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <InputComponent
          ref={inputRef as any}
          type={multiline ? undefined : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          maxLength={maxLength}
          className={`
            flex-1 px-2 py-1 text-sm border border-primary-300 rounded
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${multiline ? 'resize-none' : ''}
            ${className}
          `}
          rows={multiline ? 3 : undefined}
          disabled={isSaving}
        />
        
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
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 z-10">
          {error}
        </div>
      )}
    </div>
  )
}