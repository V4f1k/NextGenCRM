import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, DollarSign, TrendingUp, Calendar, Building2, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOpportunities, useDeleteOpportunity, useAccounts, useContacts } from '../hooks/useApi'
import type { OpportunityModel, OpportunityFilters } from '../types'
import { OPPORTUNITY_STAGES } from '../types'
import { OpportunityForm } from '../components/forms/OpportunityForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'

export function Opportunities() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<OpportunityFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; opportunity?: OpportunityModel }>({ isOpen: false })
  const [sorting, setSorting] = useState<{ field: string | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null,
  })
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table')
  
  const toast = useToastContext()
  
  // Combine search term with filters and sorting
  const queryFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
    ...(sorting.field && sorting.direction && { ordering: `${sorting.direction === 'desc' ? '-' : ''}${sorting.field}` }),
  }
  
  const { data, isLoading, error, refetch } = useOpportunities(queryFilters)
  const { data: accountsData } = useAccounts()
  const { data: contactsData } = useContacts()
  const deleteOpportunityMutation = useDeleteOpportunity({
    onSuccess: () => {
      toast.success('Opportunity deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete opportunity', {
        description: error.message,
      })
    },
  })

  const getAccountName = (accountId: string | null) => {
    if (!accountId || !accountsData?.results) return 'No Account'
    const account = accountsData.results.find(acc => acc.id === accountId)
    return account?.name || 'Unknown Account'
  }

  const getContactName = (contactId: string | null) => {
    if (!contactId || !contactsData?.results) return 'No Contact'
    const contact = contactsData.results.find(cont => cont.id === contactId)
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
  }

  const getStageColor = (stage: string | undefined) => {
    switch (stage) {
      case 'prospecting': return 'bg-gray-100 text-gray-800'
      case 'qualification': return 'bg-blue-100 text-blue-800'
      case 'needs_analysis': return 'bg-indigo-100 text-indigo-800'
      case 'value_proposition': return 'bg-purple-100 text-purple-800'
      case 'id_decision_makers': return 'bg-pink-100 text-pink-800'
      case 'perception_analysis': return 'bg-yellow-100 text-yellow-800'
      case 'proposal_price_quote': return 'bg-orange-100 text-orange-800'
      case 'negotiation_review': return 'bg-red-100 text-red-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateOpportunity = () => {
    setFormMode('create')
    setSelectedOpportunity(undefined)
    setIsFormOpen(true)
  }

  const handleEditOpportunity = (opportunity: OpportunityModel) => {
    setFormMode('edit')
    setSelectedOpportunity(opportunity)
    setIsFormOpen(true)
  }

  const handleDeleteOpportunity = (opportunity: OpportunityModel) => {
    setDeleteDialog({ isOpen: true, opportunity })
  }

  const confirmDelete = () => {
    if (deleteDialog.opportunity) {
      deleteOpportunityMutation.mutate(deleteDialog.opportunity.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  // Calculate pipeline metrics
  const opportunities = data?.results || []
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0)
  const weightedValue = opportunities.reduce((sum, opp) => sum + ((opp.amount || 0) * (opp.probability || 0) / 100), 0)
  const avgDealSize = opportunities.length > 0 ? totalValue / opportunities.length : 0

  // Group opportunities by stage for pipeline view
  const opportunitiesByStage = OPPORTUNITY_STAGES.reduce((acc, stage) => {
    acc[stage.value] = opportunities.filter(opp => opp.stage === stage.value)
    return acc
  }, {} as Record<string, OpportunityModel[]>)

  const columns: Column<OpportunityModel>[] = [
    {
      key: 'name',
      header: 'Opportunity',
      sortable: true,
      render: (value, opportunity) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{opportunity.name}</div>
            <div className="text-sm text-gray-500">{opportunity.type || 'No type'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'account_name',
      header: 'Account',
      render: (_, opportunity) => (
        <div className="flex items-center">
          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{getAccountName(opportunity.account_id)}</span>
        </div>
      ),
    },
    {
      key: 'contact_name',
      header: 'Contact',
      render: (_, opportunity) => (
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{getContactName(opportunity.contact_id)}</span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        const stageLabel = OPPORTUNITY_STAGES.find(s => s.value === value)?.label || value
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(value)}`}>
            {stageLabel}
          </span>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (value, opportunity) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{formatCurrency(value)}</div>
          <div className="text-xs text-gray-500">{opportunity.probability}% probability</div>
        </div>
      ),
    },
    {
      key: 'close_date',
      header: 'Close Date',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>
        const date = new Date(value)
        const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString()
        return (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
              {date.toLocaleDateString()}
            </span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, opportunity) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="text-primary-600 hover:text-primary-900 p-1"
            title="Edit opportunity"
            onClick={(e) => {
              e.stopPropagation()
              handleEditOpportunity(opportunity)
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete opportunity"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteOpportunity(opportunity)
            }}
            disabled={deleteOpportunityMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const emptyState = (
    <div className="text-center py-12">
      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first opportunity.'}
      </p>
      <button className="btn-primary px-6 py-2" onClick={handleCreateOpportunity}>
        <Plus className="w-4 h-4 mr-2" />
        Create Opportunity
      </button>
    </div>
  )

  const renderPipelineView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {OPPORTUNITY_STAGES.slice(0, -2).map((stage) => {
        const stageOpportunities = opportunitiesByStage[stage.value] || []
        const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0)
        
        return (
          <div key={stage.value} className="card">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{stage.label}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(stage.value)}`}>
                  {stageOpportunities.length}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(stageValue)}</p>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {stageOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleEditOpportunity(opportunity)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{opportunity.name}</h4>
                    <span className="text-xs text-gray-500">{opportunity.probability}%</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{getAccountName(opportunity.account_id)}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">{formatCurrency(opportunity.amount)}</span>
                    {opportunity.close_date && (
                      <span className="text-xs text-gray-500">
                        {new Date(opportunity.close_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {stageOpportunities.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No opportunities
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your sales pipeline and track deals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'pipeline' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pipeline
            </button>
          </div>
          <button className="btn-primary px-4 py-2" onClick={handleCreateOpportunity}>
            <Plus className="w-4 h-4 mr-2" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Pipeline</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Weighted Pipeline</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(weightedValue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Deal Size</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(avgDealSize)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
              <p className="text-lg font-semibold text-gray-900">{opportunities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {viewMode === 'table' && (
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
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
      )}

      {/* Content */}
      {viewMode === 'pipeline' ? (
        renderPipelineView()
      ) : (
        <DataTable
          data={opportunities}
          columns={columns}
          loading={isLoading}
          error={error?.message}
          emptyState={emptyState}
          sorting={{
            field: sorting.field,
            direction: sorting.direction,
            onSortChange: handleSortChange,
          }}
          onRowClick={(opportunity) => {
            navigate(`/opportunities/${opportunity.id}`)
          }}
        />
      )}

      {/* Opportunity Form Modal */}
      <OpportunityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        opportunity={selectedOpportunity}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Opportunity"
        description={`Are you sure you want to delete "${deleteDialog.opportunity?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteOpportunityMutation.isPending}
      />
    </div>
  )
}