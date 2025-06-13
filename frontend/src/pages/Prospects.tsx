import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, CheckCircle, ArrowRight, Building2, Mail, MessageSquare, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProspects, useDeleteProspect, useValidateProspect, useAdvanceProspectSequence, useMarkProspectResponded, useConvertProspectToLead } from '../hooks/useApi'
import type { ProspectModel, ProspectFilters } from '../types'
import { PROSPECT_STATUSES, PROSPECT_SEQUENCE_POSITIONS } from '../types'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'

export function Prospects() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filters, setFilters] = useState<ProspectFilters>({})
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; prospect?: ProspectModel }>({ isOpen: false })
  const [validateDialog, setValidateDialog] = useState<{ isOpen: boolean; prospect?: ProspectModel }>({ isOpen: false })
  const [convertDialog, setConvertDialog] = useState<{ isOpen: boolean; prospect?: ProspectModel }>({ isOpen: false })
  const [sorting, setSorting] = useState<{ field: string | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null,
  })
  
  const toast = useToastContext()
  
  // Combine search term with filters, sorting, and pagination
  const queryFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
    ...(sorting.field && sorting.direction && { ordering: `${sorting.direction === 'desc' ? '-' : ''}${sorting.field}` }),
    page: currentPage,
    page_size: pageSize,
  }
  
  const { data, isLoading, error, refetch } = useProspects(queryFilters)
  
  
  const deleteProspectMutation = useDeleteProspect({
    onSuccess: () => {
      toast.success('Prospect deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete prospect', {
        description: error.message,
      })
    },
  })

  const validateProspectMutation = useValidateProspect({
    onSuccess: () => {
      toast.success('Prospect validated successfully')
      setValidateDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to validate prospect', {
        description: error.message,
      })
    },
  })

  const advanceSequenceMutation = useAdvanceProspectSequence({
    onSuccess: () => {
      toast.success('Email sequence advanced successfully')
    },
    onError: (error) => {
      toast.error('Failed to advance sequence', {
        description: error.message,
      })
    },
  })

  const markRespondedMutation = useMarkProspectResponded({
    onSuccess: () => {
      toast.success('Prospect marked as responded')
    },
    onError: (error) => {
      toast.error('Failed to mark as responded', {
        description: error.message,
      })
    },
  })

  const convertToLeadMutation = useConvertProspectToLead({
    onSuccess: (result) => {
      toast.success('Prospect converted to lead successfully!', {
        description: `Created lead ${result.lead_id}`
      })
      setConvertDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to convert prospect', {
        description: error.message,
      })
    },
  })

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'validated': return 'bg-green-100 text-green-800'
      case 'email_generated': return 'bg-purple-100 text-purple-800'
      case 'sent': return 'bg-indigo-100 text-indigo-800'
      case 'follow_up_1': return 'bg-yellow-100 text-yellow-800'
      case 'follow_up_2': return 'bg-orange-100 text-orange-800'
      case 'follow_up_3': return 'bg-red-100 text-red-800'
      case 'responded': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-emerald-100 text-emerald-800'
      case 'dead': return 'bg-gray-100 text-gray-800'
      case 'disqualified': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSequenceColor = (position: number | undefined) => {
    switch (position) {
      case 0: return 'bg-blue-100 text-blue-800'
      case 1: return 'bg-yellow-100 text-yellow-800'
      case 2: return 'bg-orange-100 text-orange-800'
      case 3: return 'bg-red-100 text-red-800'
      case 4: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleDeleteProspect = (prospect: ProspectModel) => {
    setDeleteDialog({ isOpen: true, prospect })
  }

  const handleValidateProspect = (prospect: ProspectModel) => {
    setValidateDialog({ isOpen: true, prospect })
  }

  const handleConvertProspect = (prospect: ProspectModel) => {
    setConvertDialog({ isOpen: true, prospect })
  }

  const confirmDelete = () => {
    if (deleteDialog.prospect) {
      deleteProspectMutation.mutate(deleteDialog.prospect.id)
    }
  }

  const confirmValidate = () => {
    if (validateDialog.prospect) {
      validateProspectMutation.mutate({
        id: validateDialog.prospect.id,
        notes: 'Manually validated'
      })
    }
  }

  const confirmConvert = () => {
    if (convertDialog.prospect) {
      convertToLeadMutation.mutate(convertDialog.prospect.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  const columns: Column<ProspectModel>[] = [
    {
      key: 'company_name',
      header: 'Company',
      sortable: true,
      render: (value, prospect) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{prospect.company_name}</div>
            <div className="text-sm text-gray-500">{prospect.industry || 'No industry'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact_name',
      header: 'Contact',
      sortable: true,
      render: (value, prospect) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {prospect.full_contact_name || prospect.contact_name || 'No contact'}
          </div>
          <div className="text-sm text-gray-500">{prospect.contact_title || 'No title'}</div>
        </div>
      ),
    },
    {
      key: 'email_address',
      header: 'Contact Info',
      render: (value, prospect) => (
        <div>
          <div className="text-sm text-gray-900">{prospect.email_address || 'No email'}</div>
          <div className="text-sm text-gray-500">{prospect.phone_number || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'niche',
      header: 'Targeting',
      render: (value, prospect) => (
        <div>
          <div className="text-sm text-gray-900">{prospect.niche}</div>
          <div className="text-sm text-gray-500">{prospect.location}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        const statusLabel = PROSPECT_STATUSES.find(s => s.value === value)?.label || value
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
            {statusLabel}
          </span>
        )
      },
    },
    {
      key: 'sequence_position',
      header: 'Sequence',
      sortable: true,
      render: (value) => {
        if (value === undefined || value === null) return <span className="text-gray-400 text-sm">-</span>
        const positionLabel = PROSPECT_SEQUENCE_POSITIONS.find(p => p.value === value)?.label || `Position ${value}`
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSequenceColor(value)}`}>
            {positionLabel}
          </span>
        )
      },
    },
    {
      key: 'validated',
      header: 'Validated',
      render: (value) => (
        <div className="flex items-center">
          {value ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
          )}
        </div>
      ),
    },
    {
      key: 'next_followup_date',
      header: 'Next Follow-up',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>
        const date = new Date(value)
        const isOverdue = date < new Date()
        return (
          <div className={isOverdue ? 'text-red-600' : 'text-gray-900'}>
            <div className="text-sm">{date.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, prospect) => (
        <div className="flex items-center justify-end gap-2">
          {!prospect.validated && (
            <button 
              className="text-green-600 hover:text-green-900 p-1"
              title="Validate prospect"
              onClick={(e) => {
                e.stopPropagation()
                handleValidateProspect(prospect)
              }}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          
          {prospect.validated && prospect.status && !['responded', 'converted', 'dead', 'disqualified'].includes(prospect.status) && (
            <button 
              className="text-blue-600 hover:text-blue-900 p-1"
              title="Advance sequence"
              onClick={(e) => {
                e.stopPropagation()
                advanceSequenceMutation.mutate(prospect.id)
              }}
              disabled={advanceSequenceMutation.isPending}
            >
              <Mail className="w-4 h-4" />
            </button>
          )}
          
          {prospect.status && !['responded', 'converted', 'dead', 'disqualified'].includes(prospect.status) && (
            <button 
              className="text-purple-600 hover:text-purple-900 p-1"
              title="Mark as responded"
              onClick={(e) => {
                e.stopPropagation()
                markRespondedMutation.mutate(prospect.id)
              }}
              disabled={markRespondedMutation.isPending}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          
          {(prospect.status === 'responded' || prospect.validated) && !prospect.converted_to_lead && (
            <button 
              className="text-orange-600 hover:text-orange-900 p-1"
              title="Convert to lead"
              onClick={(e) => {
                e.stopPropagation()
                handleConvertProspect(prospect)
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete prospect"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteProspect(prospect)
            }}
            disabled={deleteProspectMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const emptyState = (
    <div className="text-center py-12">
      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? 'Try adjusting your search criteria.' : 'Import your prospect data to get started with cold email automation.'}
      </p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage cold email automation and lead generation pipeline
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Import Prospects
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{data?.count || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Validated</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(prospect => prospect.validated).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Sequence</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(prospect => ['sent', 'follow_up_1', 'follow_up_2', 'follow_up_3'].includes(prospect.status || '')).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Responded</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(prospect => prospect.status === 'responded').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Converted</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(prospect => prospect.status === 'converted').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search prospects..."
                className="input pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline px-4 py-2">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        error={error?.message}
        emptyState={emptyState}
        sorting={{
          field: sorting.field,
          direction: sorting.direction,
          onSortChange: handleSortChange,
        }}
        onRowClick={(prospect) => {
          navigate(`/prospects/${prospect.id}`)
        }}
      />

      {/* Pagination */}
      {data && data.count > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.count)} of {data.count} results
            </span>
            <select
              className="input py-1 px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1) // Reset to first page when changing page size
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              className="btn-outline px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || !data.previous}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {(() => {
                const totalPages = Math.ceil(data.count / pageSize)
                const pages = []
                const maxButtons = 5
                
                let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                let endPage = Math.min(totalPages, startPage + maxButtons - 1)
                
                if (endPage - startPage < maxButtons - 1) {
                  startPage = Math.max(1, endPage - maxButtons + 1)
                }
                
                // Add first page if not visible
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      className="btn-outline px-3 py-1 text-sm"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                  )
                  if (startPage > 2) {
                    pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>)
                  }
                }
                
                // Add page buttons
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`px-3 py-1 text-sm ${
                        i === currentPage 
                          ? 'bg-blue-600 text-white border border-blue-600' 
                          : 'btn-outline'
                      }`}
                      onClick={() => setCurrentPage(i)}
                    >
                      {i}
                    </button>
                  )
                }
                
                // Add last page if not visible
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>)
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      className="btn-outline px-3 py-1 text-sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  )
                }
                
                return pages
              })()}
            </div>
            
            <button
              className="btn-outline px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === Math.ceil(data.count / pageSize) || !data.next}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Prospect"
        description={`Are you sure you want to delete "${deleteDialog.prospect?.company_name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteProspectMutation.isPending}
      />

      {/* Validate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={validateDialog.isOpen}
        onClose={() => setValidateDialog({ isOpen: false })}
        onConfirm={confirmValidate}
        title="Validate Prospect"
        description={`Mark "${validateDialog.prospect?.company_name}" as validated and ready for email automation?`}
        confirmText="Validate"
        type="success"
        isLoading={validateProspectMutation.isPending}
      />

      {/* Convert Confirmation Dialog */}
      <ConfirmDialog
        isOpen={convertDialog.isOpen}
        onClose={() => setConvertDialog({ isOpen: false })}
        onConfirm={confirmConvert}
        title="Convert to Lead"
        description={
          <div className="space-y-3">
            <p className="text-gray-700">
              Convert <strong>"{convertDialog.prospect?.company_name}"</strong> to a qualified lead?
            </p>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                <span><strong>Company:</strong> {convertDialog.prospect?.company_name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-green-600 mr-2" />
                <span><strong>Contact:</strong> {convertDialog.prospect?.full_contact_name || 'No contact'}</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 text-purple-600 mr-2" />
                <span><strong>Status:</strong> {convertDialog.prospect?.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              This will create a new lead record and mark the prospect as converted.
            </p>
          </div>
        }
        confirmText="Convert to Lead"
        type="success"
        isLoading={convertToLeadMutation.isPending}
      />
    </div>
  )
}