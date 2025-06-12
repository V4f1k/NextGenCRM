import { useState } from 'react'
import { Plus, Search, Filter, Loader2, AlertCircle, Edit, Trash2, Building2 } from 'lucide-react'
import { useOrganizations, useDeleteOrganization } from '../hooks/useApi'
import type { OrganizationModel, OrganizationFilters } from '../types'
import { OrganizationForm } from '../components/forms/OrganizationForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'

export function Organizations() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<OrganizationFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; organization?: OrganizationModel }>({ isOpen: false })
  
  const toast = useToastContext()
  
  // Combine search term with filters
  const queryFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
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

  const formatEmployees = (count: number | undefined) => {
    if (!count) return 'N/A'
    return count.toLocaleString()
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
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your business organizations and companies
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handleCreateOrganization}>
          <Plus className="w-4 h-4 mr-2" />
          New Organization
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
                placeholder="Search organizations..."
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

      {/* Organizations List */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load organizations</p>
            <button 
              onClick={() => refetch()}
              className="btn-primary px-4 py-2"
            >
              Try Again
            </button>
          </div>
        ) : data && data.results.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.results.map((organization) => (
                    <tr key={organization.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {organization.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {organization.website || 'No website'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {organization.type ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(organization.type)}`}>
                            {organization.type.charAt(0).toUpperCase() + organization.type.slice(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {organization.industry ? (
                          organization.industry.charAt(0).toUpperCase() + organization.industry.slice(1).replace('_', ' ')
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {organization.email_address || 'No email'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {organization.phone_number || 'No phone'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(organization.annual_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Edit organization"
                            onClick={() => handleEditOrganization(organization)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete organization"
                            onClick={() => handleDeleteOrganization(organization)}
                            disabled={deleteOrganizationMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {data.count > data.results.length && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {data.results.length} of {data.count} organizations
                </div>
                <div className="flex gap-2">
                  {data.previous && (
                    <button className="btn-outline px-3 py-1 text-sm">
                      Previous
                    </button>
                  )}
                  {data.next && (
                    <button className="btn-outline px-3 py-1 text-sm">
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first organization.'}
            </p>
            <button className="btn-primary px-6 py-2" onClick={handleCreateOrganization}>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </button>
          </div>
        )}
      </div>

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
        title="Delete Organization"
        description={`Are you sure you want to delete "${deleteDialog.organization?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteOrganizationMutation.isPending}
      />
    </div>
  )
}