import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Building2, Globe, Phone, Mail, MapPin, DollarSign } from 'lucide-react'
import { useOrganization, useDeleteOrganization, useUpdateOrganization } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { OrganizationForm } from '../components/forms/OrganizationForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { InlineEditText, InlineEditSelect, InlineEditNumber, InlineEditEmail } from '../components/ui/InlineEdit'
import { ORGANIZATION_TYPES, ORGANIZATION_INDUSTRIES } from '../types'
import type { OrganizationModel } from '../types'
import { format } from 'date-fns'

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: organization, isLoading, error } = useOrganization(id!)
  const deleteOrganizationMutation = useDeleteOrganization()
  const updateOrganizationMutation = useUpdateOrganization({
    onSuccess: () => {
      toast.success('Organization updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update organization', {
        description: error.message,
      })
    },
  })

  const updateOrganizationField = async (field: keyof OrganizationModel, value: any): Promise<void> => {
    await updateOrganizationMutation.mutateAsync({
      id: id!,
      data: { [field]: value }
    })
  }

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteOrganizationMutation.mutateAsync(id!)
      toast.success('Organization deleted successfully')
      navigate('/organizations')
    } catch (error) {
      toast.error('Failed to delete organization')
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
        { 
          label: 'Organization Name', 
          value: (
            <InlineEditText
              value={organization.name}
              onSave={(value) => updateOrganizationField('name', value)}
              placeholder="Organization name"
              required
            />
          )
        },
        { 
          label: 'Type', 
          value: (
            <InlineEditSelect
              value={organization.type}
              options={ORGANIZATION_TYPES}
              onSave={(value) => updateOrganizationField('type', value)}
              placeholder="Select type"
              allowEmpty
            />
          )
        },
        { 
          label: 'Industry', 
          value: (
            <InlineEditSelect
              value={organization.industry}
              options={ORGANIZATION_INDUSTRIES}
              onSave={(value) => updateOrganizationField('industry', value)}
              placeholder="Select industry"
              allowEmpty
            />
          )
        },
        { 
          label: 'Website', 
          value: (
            <InlineEditText
              value={organization.website}
              onSave={(value) => updateOrganizationField('website', value)}
              placeholder="Website URL"
            />
          )
        },
        { 
          label: 'Phone', 
          value: (
            <InlineEditText
              value={organization.phone_number}
              onSave={(value) => updateOrganizationField('phone_number', value)}
              placeholder="Phone number"
            />
          )
        },
        { 
          label: 'Email', 
          value: (
            <InlineEditEmail
              value={organization.email_address}
              onSave={(value) => updateOrganizationField('email_address', value)}
              placeholder="Email address"
            />
          )
        },
      ]
    },
    {
      title: 'Financial Information',
      fields: [
        { 
          label: 'Annual Revenue', 
          value: (
            <InlineEditNumber
              value={organization.annual_revenue}
              onSave={(value) => updateOrganizationField('annual_revenue', value)}
              placeholder="Annual revenue"
              min={0}
              formatDisplay={formatCurrency}
              allowEmpty
            />
          )
        },
        { 
          label: 'Number of Employees', 
          value: (
            <InlineEditNumber
              value={organization.number_of_employees}
              onSave={(value) => updateOrganizationField('number_of_employees', value)}
              placeholder="Number of employees"
              min={0}
              allowEmpty
            />
          )
        },
        { 
          label: 'SIC Code', 
          value: (
            <InlineEditText
              value={organization.sic_code}
              onSave={(value) => updateOrganizationField('sic_code', value)}
              placeholder="SIC code"
            />
          )
        },
        { 
          label: 'Ticker Symbol', 
          value: (
            <InlineEditText
              value={organization.ticker_symbol}
              onSave={(value) => updateOrganizationField('ticker_symbol', value)}
              placeholder="Ticker symbol"
            />
          )
        },
        { 
          label: 'Ownership', 
          value: (
            <InlineEditText
              value={organization.ownership}
              onSave={(value) => updateOrganizationField('ownership', value)}
              placeholder="Ownership"
            />
          )
        },
        { 
          label: 'Rating', 
          value: (
            <InlineEditSelect
              value={organization.rating}
              options={[
                { value: 'Hot', label: 'Hot' },
                { value: 'Warm', label: 'Warm' },
                { value: 'Cold', label: 'Cold' }
              ]}
              onSave={(value) => updateOrganizationField('rating', value)}
              placeholder="Select rating"
              allowEmpty
            />
          )
        },
      ]
    },
    {
      title: 'Billing Address',
      fields: [
        { 
          label: 'Street', 
          value: (
            <InlineEditText
              value={organization.billing_address_street}
              onSave={(value) => updateOrganizationField('billing_address_street', value)}
              placeholder="Street address"
            />
          )
        },
        { 
          label: 'City', 
          value: (
            <InlineEditText
              value={organization.billing_address_city}
              onSave={(value) => updateOrganizationField('billing_address_city', value)}
              placeholder="City"
            />
          )
        },
        { 
          label: 'State', 
          value: (
            <InlineEditText
              value={organization.billing_address_state}
              onSave={(value) => updateOrganizationField('billing_address_state', value)}
              placeholder="State"
            />
          )
        },
        { 
          label: 'Postal Code', 
          value: (
            <InlineEditText
              value={organization.billing_address_postal_code}
              onSave={(value) => updateOrganizationField('billing_address_postal_code', value)}
              placeholder="Postal code"
            />
          )
        },
        { 
          label: 'Country', 
          value: (
            <InlineEditText
              value={organization.billing_address_country}
              onSave={(value) => updateOrganizationField('billing_address_country', value)}
              placeholder="Country"
            />
          )
        },
      ]
    },
    {
      title: 'Shipping Address',
      fields: [
        { 
          label: 'Street', 
          value: (
            <InlineEditText
              value={organization.shipping_address_street}
              onSave={(value) => updateOrganizationField('shipping_address_street', value)}
              placeholder="Street address"
            />
          )
        },
        { 
          label: 'City', 
          value: (
            <InlineEditText
              value={organization.shipping_address_city}
              onSave={(value) => updateOrganizationField('shipping_address_city', value)}
              placeholder="City"
            />
          )
        },
        { 
          label: 'State', 
          value: (
            <InlineEditText
              value={organization.shipping_address_state}
              onSave={(value) => updateOrganizationField('shipping_address_state', value)}
              placeholder="State"
            />
          )
        },
        { 
          label: 'Postal Code', 
          value: (
            <InlineEditText
              value={organization.shipping_address_postal_code}
              onSave={(value) => updateOrganizationField('shipping_address_postal_code', value)}
              placeholder="Postal code"
            />
          )
        },
        { 
          label: 'Country', 
          value: (
            <InlineEditText
              value={organization.shipping_address_country}
              onSave={(value) => updateOrganizationField('shipping_address_country', value)}
              placeholder="Country"
            />
          )
        },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { 
          label: 'Description', 
          value: (
            <InlineEditText
              value={organization.description}
              onSave={(value) => updateOrganizationField('description', value)}
              placeholder="Description"
              multiline
            />
          ),
          colSpan: 3 
        },
        { 
          label: 'Tags', 
          value: (
            <InlineEditText
              value={organization.tags?.join(', ')}
              onSave={(value) => updateOrganizationField('tags', value ? value.split(',').map(tag => tag.trim()) : [])}
              placeholder="Enter tags separated by commas"
            />
          ),
          colSpan: 3 
        },
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