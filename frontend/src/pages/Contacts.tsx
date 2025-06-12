import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, User, Building2 } from 'lucide-react'
import { useContacts, useDeleteContact, useAccounts } from '../hooks/useApi'
import { ContactModel, ContactFilters } from '../types'
import { ContactForm } from '../components/forms/ContactForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'

export function Contacts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ContactFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedContact, setSelectedContact] = useState<ContactModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; contact?: ContactModel }>({ isOpen: false })
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
  
  const { data, isLoading, error, refetch } = useContacts(queryFilters)
  const { data: accountsData } = useAccounts()
  const deleteContactMutation = useDeleteContact({
    onSuccess: () => {
      toast.success('Contact deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete contact', {
        description: error.message,
      })
    },
  })

  const getAccountName = (accountId: string | null) => {
    if (!accountId || !accountsData?.results) return 'No Account'
    const account = accountsData.results.find(acc => acc.id === accountId)
    return account?.name || 'Unknown Account'
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateContact = () => {
    setFormMode('create')
    setSelectedContact(undefined)
    setIsFormOpen(true)
  }

  const handleEditContact = (contact: ContactModel) => {
    setFormMode('edit')
    setSelectedContact(contact)
    setIsFormOpen(true)
  }

  const handleDeleteContact = (contact: ContactModel) => {
    setDeleteDialog({ isOpen: true, contact })
  }

  const confirmDelete = () => {
    if (deleteDialog.contact) {
      deleteContactMutation.mutate(deleteDialog.contact.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  const columns: Column<ContactModel>[] = [
    {
      key: 'first_name',
      header: 'Name',
      sortable: true,
      render: (value, contact) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {contact.salutation && `${contact.salutation} `}
              {contact.first_name} {contact.last_name}
            </div>
            <div className="text-sm text-gray-500">{contact.title || 'No title'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'account_name',
      header: 'Account',
      render: (_, contact) => (
        <div className="flex items-center">
          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{getAccountName(contact.account_id)}</span>
        </div>
      ),
    },
    {
      key: 'email_address',
      header: 'Contact Info',
      render: (value, contact) => (
        <div>
          <div className="text-sm text-gray-900">{contact.email_address || 'No email'}</div>
          <div className="text-sm text-gray-500">{contact.phone_number || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>
        return <span className="text-sm text-gray-900">{value}</span>
      },
    },
    {
      key: 'do_not_call',
      header: 'Status',
      render: (value) => (
        <div className="flex flex-col gap-1">
          {value && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              Do Not Call
            </span>
          )}
        </div>
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
      render: (_, contact) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="text-primary-600 hover:text-primary-900 p-1"
            title="Edit contact"
            onClick={(e) => {
              e.stopPropagation()
              handleEditContact(contact)
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete contact"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteContact(contact)
            }}
            disabled={deleteContactMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const emptyState = (
    <div className="text-center py-12">
      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first contact.'}
      </p>
      <button className="btn-primary px-6 py-2" onClick={handleCreateContact}>
        <Plus className="w-4 h-4 mr-2" />
        Create Contact
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your individual contacts and relationships
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handleCreateContact}>
          <Plus className="w-4 h-4 mr-2" />
          New Contact
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
                placeholder="Search contacts..."
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
        onRowClick={(contact) => {
          // Optional: Navigate to contact detail page
          console.log('Row clicked:', contact)
        }}
      />

      {/* Contact Form Modal */}
      <ContactForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        contact={selectedContact}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Contact"
        description={`Are you sure you want to delete "${deleteDialog.contact?.first_name} ${deleteDialog.contact?.last_name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteContactMutation.isPending}
      />
    </div>
  )
}