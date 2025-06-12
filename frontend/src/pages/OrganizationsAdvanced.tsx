import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Edit, Trash2, Building2 } from 'lucide-react'
import { useOrganizations, useDeleteOrganization } from '../hooks/useApi'
import type { OrganizationModel, OrganizationFilters } from '../types'
import { OrganizationForm } from '../components/forms/OrganizationForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'
// import { useTranslation } from 'react-i18next'

export function OrganizationsAdvanced() {
  const navigate = useNavigate()
  // const { t } = useTranslation()
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'organizations.title': 'Organizations',
      'organizations.subtitle': 'Manage your business organizations',
      'organizations.newOrganization': 'New Organization',
      'organizations.noOrganizations': 'No organizations',
      'organizations.createFirst': 'Get started by creating your first organization.',
      'organizations.searchPlaceholder': 'Search organizations...',
      'common.filter': 'Filter',
      'common.delete': 'Delete',
      'common.confirmDelete': 'Are you sure you want to delete this item?',
      'common.noData': 'No data found',
      'entities.organization': 'Organization'
    }
    return translations[key] || key
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<OrganizationFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; organization?: OrganizationModel }>({ isOpen: false })
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
  
  const { data, isLoading, error, refetch } = useOrganizations(queryFilters)
  const deleteOrganizationMutation = useDeleteOrganization({
    onSuccess: () => {
      toast.success('Organization deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete organization', {
        description: error.message,
      })
    },
  })

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'customer': return 'bg-green-100 text-green-800'
      case 'partner': return 'bg-blue-100 text-blue-800'
      case 'investor': return 'bg-purple-100 text-purple-800'
      case 'reseller': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateOrganization = () => {
    setFormMode('create')
    setSelectedOrganization(undefined)
    setIsFormOpen(true)
  }

  const handleEditOrganization = (organization: OrganizationModel) => {
    setFormMode('edit')
    setSelectedOrganization(organization)
    setIsFormOpen(true)
  }

  const handleDeleteOrganization = (organization: OrganizationModel) => {
    setDeleteDialog({ isOpen: true, organization })
  }

  const confirmDelete = () => {
    if (deleteDialog.organization) {
      deleteOrganizationMutation.mutate(deleteDialog.organization.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  const columns: Column<OrganizationModel>[] = [
    {
      key: 'name',
      header: 'Organization',
      sortable: true,
      render: (value, organization) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{organization.name}</div>
          <div className="text-sm text-gray-500">{organization.website || 'No website'}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(value)}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
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
        return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')
      },
    },
    {
      key: 'email_address',
      header: 'Contact',
      render: (value, organization) => (
        <div>
          <div className="text-sm text-gray-900">{organization.email_address || 'No email'}</div>
          <div className="text-sm text-gray-500">{organization.phone_number || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'annual_revenue',
      header: 'Revenue',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{formatCurrency(value)}</span>
      ),
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
      render: (_, organization) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="text-primary-600 hover:text-primary-900 p-1"
            title="Edit organization"
            onClick={(e) => {
              e.stopPropagation()
              handleEditOrganization(organization)
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete organization"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteOrganization(organization)
            }}
            disabled={deleteOrganizationMutation.isPending}
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('organizations.noOrganizations')}</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? t('common.noData') : t('organizations.createFirst')}
      </p>
      <button className="btn-primary px-6 py-2" onClick={handleCreateOrganization}>
        <Plus className="w-4 h-4 mr-2" />
        {t('organizations.newOrganization')}
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('organizations.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('organizations.subtitle')}
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handleCreateOrganization}>
          <Plus className="w-4 h-4 mr-2" />
          {t('organizations.newOrganization')}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('organizations.searchPlaceholder')}
                className="input pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline px-4 py-2">
              <Filter className="w-4 h-4 mr-2" />
              {t('common.filter')}
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
        onRowClick={(organization) => {
          navigate(`/organizations/${organization.id}`)
        }}
      />

      {/* Organization Form Modal */}
      <OrganizationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        organization={selectedOrganization}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title={t('common.delete') + ' ' + t('entities.organization')}
        description={t('common.confirmDelete')}
        confirmText={t('common.delete')}
        type="danger"
        isLoading={deleteOrganizationMutation.isPending}
      />
    </div>
  )
}