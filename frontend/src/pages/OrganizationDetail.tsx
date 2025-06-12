import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Building2, Globe, Phone, Mail, MapPin, DollarSign } from 'lucide-react'
import { useOrganization, useDeleteOrganization } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { OrganizationForm } from '../components/forms/OrganizationForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { ORGANIZATION_TYPES, ORGANIZATION_INDUSTRIES } from '../types'
import { format } from 'date-fns'

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: organization, isLoading, error } = useOrganization(id!)
  const deleteOrganizationMutation = useDeleteOrganization()

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteOrganizationMutation.mutateAsync(id!)
      showToast('success', 'Organization deleted successfully')
      navigate('/organizations')
    } catch (error) {
      showToast('error', 'Failed to delete organization')
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'PPp')
    } catch {
      return date
    }
  }

  const getTypeBadge = (type: string) => {
    const typeObj = ORGANIZATION_TYPES.find(t => t.value === type)
    return typeObj?.label || type || '-'
  }

  const getIndustryBadge = (industry: string) => {
    const industryObj = ORGANIZATION_INDUSTRIES.find(i => i.value === industry)
    return industryObj?.label || industry || '-'
  }

  const formatAddress = (type: 'billing' | 'shipping') => {
    if (!organization) return '-'
    const prefix = type === 'billing' ? 'billing_address_' : 'shipping_address_'
    const street = organization[`${prefix}street`]
    const city = organization[`${prefix}city`]
    const state = organization[`${prefix}state`]
    const postalCode = organization[`${prefix}postal_code`]
    const country = organization[`${prefix}country`]

    const parts = [street, city, state, postalCode, country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '-'
  }

  const sections = organization ? [
    {
      title: 'General Information',
      fields: [
        { label: 'Organization Name', value: organization.name },
        { label: 'Type', value: getTypeBadge(organization.type || '') },
        { label: 'Industry', value: getIndustryBadge(organization.industry || '') },
        { label: 'Website', value: organization.website ? (
          <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
            {organization.website}
          </a>
        ) : '-' },
        { label: 'Phone', value: organization.phone_number || '-' },
        { label: 'Email', value: organization.email_address || '-' },
      ]
    },
    {
      title: 'Financial Information',
      fields: [
        { label: 'Annual Revenue', value: formatCurrency(organization.annual_revenue) },
        { label: 'Number of Employees', value: organization.number_of_employees || '-' },
        { label: 'SIC Code', value: organization.sic_code || '-' },
        { label: 'Ticker Symbol', value: organization.ticker_symbol || '-' },
        { label: 'Ownership', value: organization.ownership || '-' },
        { label: 'Rating', value: organization.rating || '-' },
      ]
    },
    {
      title: 'Addresses',
      fields: [
        { label: 'Billing Address', value: formatAddress('billing'), colSpan: 3 },
        { label: 'Shipping Address', value: formatAddress('shipping'), colSpan: 3 },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { label: 'Description', value: organization.description || '-', colSpan: 3 },
        { label: 'Tags', value: organization.tags?.join(', ') || '-', colSpan: 3 },
      ]
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Created By', value: organization.created_by_name || '-' },
        { label: 'Created At', value: formatDate(organization.created_at) },
        { label: 'Modified By', value: organization.modified_by_name || '-' },
        { label: 'Modified At', value: formatDate(organization.modified_at) },
        { label: 'Assigned To', value: organization.assigned_user_name || '-' },
        { label: 'Team', value: organization.assigned_team || '-' },
      ]
    }
  ] : []

  const actions = (
    <>
      <button
        onClick={handleEdit}
        className="btn btn-secondary"
      >
        <Edit className="w-4 h-4" />
        Edit
      </button>
      <button
        onClick={() => setIsDeleteOpen(true)}
        className="btn bg-red-600 text-white hover:bg-red-700"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </>
  )

  return (
    <>
      <DetailView
        title={organization?.name || 'Organization Details'}
        subtitle={`Organization #${id?.slice(0, 8)}`}
        sections={sections}
        actions={actions}
        isLoading={isLoading}
        error={error?.message}
      />

      {/* Edit Modal */}
      {isEditOpen && organization && (
        <OrganizationForm
          mode="edit"
          organization={organization}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Organization"
        message={`Are you sure you want to delete "${organization?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteOrganizationMutation.isPending}
      />
    </>
  )
}