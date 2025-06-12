import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Building2 } from 'lucide-react'
import { useAccounts, useDeleteAccount } from '../hooks/useApi'
import { AccountModel, AccountFilters } from '../types'
import { AccountForm } from '../components/forms/AccountForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'

export function AccountsAdvanced() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<AccountFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedAccount, setSelectedAccount] = useState<AccountModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; account?: AccountModel }>({ isOpen: false })
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
  
  const { data, isLoading, error, refetch } = useAccounts(queryFilters)
  const deleteAccountMutation = useDeleteAccount({
    onSuccess: () => {
      toast.success('Account deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete account', {
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

  const handleCreateAccount = () => {
    setFormMode('create')
    setSelectedAccount(undefined)
    setIsFormOpen(true)
  }

  const handleEditAccount = (account: AccountModel) => {
    setFormMode('edit')
    setSelectedAccount(account)
    setIsFormOpen(true)
  }

  const handleDeleteAccount = (account: AccountModel) => {
    setDeleteDialog({ isOpen: true, account })
  }

  const confirmDelete = () => {
    if (deleteDialog.account) {
      deleteAccountMutation.mutate(deleteDialog.account.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  const columns: Column<AccountModel>[] = [
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      render: (value, account) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{account.name}</div>
          <div className="text-sm text-gray-500">{account.website || 'No website'}</div>
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
      render: (value, account) => (
        <div>
          <div className="text-sm text-gray-900">{account.email_address || 'No email'}</div>
          <div className="text-sm text-gray-500">{account.phone_number || 'No phone'}</div>
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
      render: (_, account) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="text-primary-600 hover:text-primary-900 p-1"
            title="Edit account"
            onClick={(e) => {
              e.stopPropagation()
              handleEditAccount(account)
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete account"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteAccount(account)
            }}
            disabled={deleteAccountMutation.isPending}
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first account.'}
      </p>
      <button className="btn-primary px-6 py-2" onClick={handleCreateAccount}>
        <Plus className="w-4 h-4 mr-2" />
        Create Account
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your business accounts and organizations
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handleCreateAccount}>
          <Plus className="w-4 h-4 mr-2" />
          New Account
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
                placeholder="Search accounts..."
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
        onRowClick={(account) => {
          // Optional: Navigate to account detail page
          console.log('Row clicked:', account)
        }}
      />

      {/* Account Form Modal */}
      <AccountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        account={selectedAccount}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Account"
        description={`Are you sure you want to delete "${deleteDialog.account?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteAccountMutation.isPending}
      />
    </div>
  )
}