import { useState, useRef, useEffect } from 'react'
import { Check, X, Edit3, Loader2 } from 'lucide-react'

interface InlineEditNumberProps {
  value: number | undefined
  onSave: (value: number | undefined) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  min?: number
  max?: number
  step?: number
  formatDisplay?: (value: number) => string
  allowEmpty?: boolean
}

export function InlineEditNumber({
  value,
  onSave,
  placeholder = 'Click to edit',
  className = '',
  disabled = false,
  required = false,
  min,
  max,
  step = 1,
  formatDisplay,
  allowEmpty = true
}: InlineEditNumberProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value?.toString() || '')
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
    setEditValue(value?.toString() || '')
    setError(null)
  }

  const validateAndParseValue = (inputValue: string): number | undefined => {
    if (!inputValue.trim()) {
      if (!allowEmpty && required) {
        throw new Error('This field is required')
      }
      return undefined
    }

    const numValue = parseFloat(inputValue)
    
    if (isNaN(numValue)) {
      throw new Error('Please enter a valid number')
    }

    if (min !== undefined && numValue < min) {
      throw new Error(`Value must be at least ${min}`)
    }

    if (max !== undefined && numValue > max) {
      throw new Error(`Value must be at most ${max}`)
    }

    return numValue
  }

  const handleSave = async () => {
    setError(null)

    try {
      const numValue = validateAndParseValue(editValue)
      
      if (numValue === value) {
        setIsEditing(false)
        return
      }

      setIsSaving(true)
      await onSave(numValue)
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
    if (!isSaving && editValue !== (value?.toString() || '')) {
      handleSave()
    } else if (!isSaving) {
      setIsEditing(false)
    }
  }

  const getDisplayValue = () => {
    if (value === undefined || value === null) {
      return placeholder
    }
    
    if (formatDisplay) {
      return formatDisplay(value)
    }
    
    return value.toLocaleString()
  }

  const displayValue = getDisplayValue()
  const isEmpty = value === undefined || value === null

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

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={isSaving}
          className={`
            flex-1 px-2 py-1 text-sm border border-primary-300 rounded
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
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
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}