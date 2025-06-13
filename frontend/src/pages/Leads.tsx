import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, UserPlus, Target, ArrowRight, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useDeleteLead, useConvertLead } from '../hooks/useApi'
import type { LeadModel, LeadFilters } from '../types'
import { LEAD_STATUSES, LEAD_SOURCES } from '../types'
import { LeadForm } from '../components/forms/LeadForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'

export function Leads() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<LeadFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedLead, setSelectedLead] = useState<LeadModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; lead?: LeadModel }>({ isOpen: false })
  const [convertDialog, setConvertDialog] = useState<{ isOpen: boolean; lead?: LeadModel }>({ isOpen: false })
  const [sorting, setSorting] = useState<{ field: string | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null,
  })
  
  const toast = useToastContext()
  
  // Combine search term with filters and sorting
  const queryFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
    ...(sorting.field && sorting.direction && { ordering: `${sorting.direction === 'desc' ? '-' : ''}${sorting.field}` }),
  }
  
  const { data, isLoading, error, refetch } = useLeads(queryFilters)
  const deleteLeadMutation = useDeleteLead({
    onSuccess: () => {
      toast.success('Lead deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete lead', {
        description: error.message,
      })
    },
  })

  const convertLeadMutation = useConvertLead({
    onSuccess: (result) => {
      toast.success('Lead converted successfully!', {
        description: `Created Organization, Contact, and ${result.opportunity_id ? 'Opportunity' : 'records'}`
      })
      setConvertDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to convert lead', {
        description: error.message,
      })
    },
  })

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_process': return 'bg-orange-100 text-orange-800'
      case 'converted': return 'bg-green-100 text-green-800'
      case 'recycled': return 'bg-gray-100 text-gray-800'
      case 'dead': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceColor = (source: string | undefined) => {
    switch (source) {
      case 'call': return 'bg-blue-100 text-blue-800'
      case 'email': return 'bg-green-100 text-green-800'
      case 'existing_customer': return 'bg-purple-100 text-purple-800'
      case 'partner': return 'bg-orange-100 text-orange-800'
      case 'public_relations': return 'bg-pink-100 text-pink-800'
      case 'web': return 'bg-indigo-100 text-indigo-800'
      case 'campaign': return 'bg-yellow-100 text-yellow-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateLead = () => {
    setFormMode('create')
    setSelectedLead(undefined)
    setIsFormOpen(true)
  }

  const handleEditLead = (lead: LeadModel) => {
    setFormMode('edit')
    setSelectedLead(lead)
    setIsFormOpen(true)
  }

  const handleDeleteLead = (lead: LeadModel) => {
    setDeleteDialog({ isOpen: true, lead })
  }

  const handleConvertLead = (lead: LeadModel) => {
    if (lead.converted || lead.status === 'converted_to_opportunity') {
      toast.error('Lead already converted', {
        description: 'This lead has already been converted to business records.'
      })
      return
    }
    setConvertDialog({ isOpen: true, lead })
  }

  const confirmDelete = () => {
    if (deleteDialog.lead) {
      deleteLeadMutation.mutate(deleteDialog.lead.id)
    }
  }

  const confirmConvert = () => {
    if (convertDialog.lead) {
      convertLeadMutation.mutate(convertDialog.lead.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  const columns: Column<LeadModel>[] = [
    {
      key: 'first_name',
      header: 'Name',
      sortable: true,
      render: (value, lead) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <UserPlus className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {lead.salutation && `${lead.salutation} `}
              {lead.first_name} {lead.last_name}
            </div>
            <div className="text-sm text-gray-500">{lead.title || 'No title'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (value, lead) => (
        <div className="flex items-center">
          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm text-gray-900">{lead.account_name || 'No company'}</div>
            {lead.website && (
              <div className="text-sm text-gray-500">{lead.website}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email_address',
      header: 'Contact Info',
      render: (value, lead) => (
        <div>
          <div className="text-sm text-gray-900">{lead.email_address || 'No email'}</div>
          <div className="text-sm text-gray-500">{lead.phone_number || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        const statusLabel = LEAD_STATUSES.find(s => s.value === value)?.label || value
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
            {statusLabel}
          </span>
        )
      },
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        const sourceLabel = LEAD_SOURCES.find(s => s.value === value)?.label || value
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(value)}`}>
            {sourceLabel}
          </span>
        )
      },
    },
    {
      key: 'industry',
      header: 'Industry',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>
        return <span className="text-sm text-gray-900">{value}</span>
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (value) => {
        if (!value) return '-'
        const date = new Date(value)
        return (
          <div>
            <div className="text-sm text-gray-900">{date.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, lead) => (
        <div className="flex items-center justify-end gap-2">
          {!lead.converted && lead.status !== 'converted_to_opportunity' && (
            <button 
              className="text-green-600 hover:text-green-900 p-1"
              title="Convert lead"
              onClick={(e) => {
                e.stopPropagation()
                handleConvertLead(lead)
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button 
            className="text-primary-600 hover:text-primary-900 p-1"
            title="Edit lead"
            onClick={(e) => {
              e.stopPropagation()
              handleEditLead(lead)
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete lead"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteLead(lead)
            }}
            disabled={deleteLeadMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const emptyState = (
    <div className="text-center py-12">
      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first lead.'}
      </p>
      <button className="btn-primary px-6 py-2" onClick={handleCreateLead}>
        <Plus className="w-4 h-4 mr-2" />
        Create Lead
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage potential customers and conversion opportunities
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handleCreateLead}>
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-lg font-semibold text-gray-900">{data?.count || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">New Leads</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(lead => lead.status === 'new').length || 0}
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
              <p className="text-sm font-medium text-gray-500">In Process</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(lead => lead.status === 'in_process').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Converted</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.results?.filter(lead => lead.status === 'converted_to_opportunity').length || 0}
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
                placeholder="Search leads..."
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
        onRowClick={(lead) => {
          navigate(`/leads/${lead.id}`)
        }}
      />

      {/* Lead Form Modal */}
      <LeadForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        lead={selectedLead}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete "${deleteDialog.lead?.first_name} ${deleteDialog.lead?.last_name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteLeadMutation.isPending}
      />

      {/* Convert Confirmation Dialog */}
      <ConfirmDialog
        isOpen={convertDialog.isOpen}
        onClose={() => setConvertDialog({ isOpen: false })}
        onConfirm={confirmConvert}
        title="Convert Lead"
        description={
          <div className="space-y-3">
            <p className="text-gray-700">
              Convert <strong>"{convertDialog.lead?.first_name} {convertDialog.lead?.last_name}"</strong> into business records:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                <span><strong>Organization:</strong> {convertDialog.lead?.account_name || 'New organization'}</span>
              </div>
              <div className="flex items-center">
                <UserPlus className="w-4 h-4 text-green-600 mr-2" />
                <span><strong>Contact:</strong> {convertDialog.lead?.first_name} {convertDialog.lead?.last_name}</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 text-purple-600 mr-2" />
                <span><strong>Opportunity:</strong> {convertDialog.lead?.opportunity_amount ? `$${convertDialog.lead.opportunity_amount}` : 'Potential deal'}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              The original lead will be marked as "converted" and preserved for history.
            </p>
          </div>
        }
        confirmText="Convert Lead"
        type="success"
        isLoading={convertLeadMutation.isPending}
      />
    </div>
  )
}