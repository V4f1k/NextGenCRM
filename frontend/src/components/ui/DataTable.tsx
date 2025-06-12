import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  accessor?: (item: T) => any
  sortable?: boolean
  width?: string
  className?: string
  render?: (value: any, item: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string
  emptyState?: React.ReactNode
  onRowClick?: (item: T) => void
  className?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  }
  sorting?: {
    field: string | null
    direction: 'asc' | 'desc' | null
    onSortChange: (field: string, direction: 'asc' | 'desc') => void
  }
  selection?: {
    selectedItems: T[]
    onSelectionChange: (selectedItems: T[]) => void
    getItemId: (item: T) => string
  }
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  error,
  emptyState,
  onRowClick,
  className = '',
  pagination,
  sorting,
  selection,
}: DataTableProps<T>) {
  const [internalSorting, setInternalSorting] = useState<{
    field: string | null
    direction: 'asc' | 'desc' | null
  }>({ field: null, direction: null })

  const currentSorting = sorting || internalSorting
  const setSorting = sorting?.onSortChange || ((field: string, direction: 'asc' | 'desc') => {
    setInternalSorting({ field, direction })
  })

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!currentSorting.field || !currentSorting.direction) return data

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === currentSorting.field)
      if (!column) return 0

      const aValue = column.accessor ? column.accessor(a) : (a as any)[column.key]
      const bValue = column.accessor ? column.accessor(b) : (b as any)[column.key]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return currentSorting.direction === 'asc' ? -1 : 1
      if (bValue == null) return currentSorting.direction === 'asc' ? 1 : -1

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return currentSorting.direction === 'asc' ? comparison : -comparison
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return currentSorting.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime()
        return currentSorting.direction === 'asc' ? comparison : -comparison
      }

      // String comparison for dates
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = new Date(aValue)
        const bDate = new Date(bValue)
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          const comparison = aDate.getTime() - bDate.getTime()
          return currentSorting.direction === 'asc' ? comparison : -comparison
        }
      }

      // Default string comparison
      const comparison = String(aValue).localeCompare(String(bValue))
      return currentSorting.direction === 'asc' ? comparison : -comparison
    })
  }, [data, columns, currentSorting])

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    const field = column.key as string
    let direction: 'asc' | 'desc' = 'asc'

    if (currentSorting.field === field) {
      direction = currentSorting.direction === 'asc' ? 'desc' : 'asc'
    }

    setSorting(field, direction)
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const field = column.key as string
    if (currentSorting.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }

    return currentSorting.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-gray-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600" />
    )
  }

  const handleSelectAll = () => {
    if (!selection) return

    const allSelected = selection.selectedItems.length === data.length
    if (allSelected) {
      selection.onSelectionChange([])
    } else {
      selection.onSelectionChange(data)
    }
  }

  const handleSelectItem = (item: T) => {
    if (!selection) return

    const itemId = selection.getItemId(item)
    const isSelected = selection.selectedItems.some(selected => 
      selection.getItemId(selected) === itemId
    )

    if (isSelected) {
      selection.onSelectionChange(
        selection.selectedItems.filter(selected => 
          selection.getItemId(selected) !== itemId
        )
      )
    } else {
      selection.onSelectionChange([...selection.selectedItems, item])
    }
  }

  const renderPagination = () => {
    if (!pagination) return null

    const { page, pageSize, total, onPageChange, onPageSizeChange } = pagination
    const totalPages = Math.ceil(total / pageSize)
    const startItem = (page - 1) * pageSize + 1
    const endItem = Math.min(page * pageSize, total)

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-500">
          <span>Showing {startItem} to {endItem} of {total} results</span>
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="ml-4 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNumber: number
              
              if (totalPages <= 7) {
                pageNumber = i + 1
              } else if (page <= 4) {
                pageNumber = i + 1
              } else if (page >= totalPages - 3) {
                pageNumber = totalPages - 6 + i
              } else {
                pageNumber = page - 3 + i
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === pageNumber
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Error loading data</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    )
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selection && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selection.selectedItems.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.width ? `w-${column.width}` : ''} ${column.className || ''}`}
                  onClick={() => handleSort(column)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {selection && (
                    <td className="px-6 py-4">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  )}
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="px-6 py-12 text-center">
                  {emptyState || <div className="text-gray-500">No data available</div>}
                </td>
              </tr>
            ) : (
              sortedData.map((item, rowIndex) => {
                const isSelected = selection?.selectedItems.some(selected => 
                  selection.getItemId(selected) === selection.getItemId(item)
                ) || false

                return (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selection && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(item)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column, colIndex) => {
                      const value = column.accessor 
                        ? column.accessor(item) 
                        : (item as any)[column.key]

                      return (
                        <td
                          key={colIndex}
                          className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                        >
                          {column.render ? column.render(value, item) : value}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  )
}