import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, User, Phone, Mail, Globe, DollarSign, ArrowRightCircle, Building2, UserPlus, Target } from 'lucide-react'
import { useLead, useDeleteLead, useConvertLead, useUpdateLead } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { LeadForm } from '../components/forms/LeadForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { InlineEditText, InlineEditSelect, InlineEditNumber, InlineEditEmail } from '../components/ui/InlineEdit'
import { LEAD_STATUSES, LEAD_SOURCES, CONTACT_SALUTATIONS, LEAD_INDUSTRIES } from '../types'
import type { LeadModel } from '../types'
import { format } from 'date-fns'

export function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)

  const { data: lead, isLoading, error } = useLead(id!)
  const deleteLeadMutation = useDeleteLead()
  const convertLeadMutation = useConvertLead()
  const updateLeadMutation = useUpdateLead({
    onSuccess: () => {
      toast.success('Lead updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update lead', {
        description: error.message,
      })
    },
  })

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const updateLeadField = async (field: keyof LeadModel, value: any): Promise<void> => {
    await updateLeadMutation.mutateAsync({
      id: id!,
      data: { [field]: value }
    })
  }

  const handleDelete = async () => {
    try {
      await deleteLeadMutation.mutateAsync(id!)
      toast.success('Lead deleted successfully')
      navigate('/leads')
    } catch (error) {
      toast.error('Failed to delete lead')
    }
  }

  const handleConvert = async () => {
    try {
      const result = await convertLeadMutation.mutateAsync(id!)
      toast.success('Lead converted successfully', {
        description: `Created Organization, Contact, and ${result.opportunity_id ? 'Opportunity' : 'records'}`
      })
      // Navigate to the created organization
      if (result.organization_id) {
        navigate(`/organizations/${result.organization_id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to convert lead')
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'PPp')
    } catch {
      return date
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusObj = LEAD_STATUSES.find(s => s.value === status)
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      in_process: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      recycled: 'bg-gray-100 text-gray-800',
      dead: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusObj?.label || status}
      </span>
    )
  }

  const getSalutationLabel = (value: string) => {
    const salutation = CONTACT_SALUTATIONS.find(s => s.value === value)
    return salutation?.label || value || ''
  }

  const getSourceLabel = (value: string) => {
    const source = LEAD_SOURCES.find(s => s.value === value)
    return source?.label || value || '-'
  }

  const getIndustryLabel = (value: string) => {
    const industry = LEAD_INDUSTRIES.find(i => i.value === value)
    return industry?.label || value || '-'
  }

  const sections = lead ? [
    {
      title: 'Lead Information',
      fields: [
        { 
          label: 'Salutation', 
          value: (
            <InlineEditSelect
              value={lead.salutation_name}
              options={CONTACT_SALUTATIONS}
              onSave={(value) => updateLeadField('salutation_name', value)}
              placeholder="Select salutation"
              allowEmpty
            />
          )
        },
        { 
          label: 'Full Name', 
          value: (
            <InlineEditText
              value={lead.full_name}
              onSave={(value) => updateLeadField('full_name', value)}
              placeholder="Full name"
              required
            />
          )
        },
        { 
          label: 'Title', 
          value: (
            <InlineEditText
              value={lead.title}
              onSave={(value) => updateLeadField('title', value)}
              placeholder="Job title"
            />
          )
        },
        { 
          label: 'Organization', 
          value: (
            <InlineEditText
              value={lead.account_name}
              onSave={(value) => updateLeadField('account_name', value)}
              placeholder="Organization name"
            />
          )
        },
        { 
          label: 'Status', 
          value: (
            <InlineEditSelect
              value={lead.status}
              options={LEAD_STATUSES}
              onSave={(value) => updateLeadField('status', value)}
              placeholder="Select status"
              allowEmpty
            />
          )
        },
        { 
          label: 'Source', 
          value: (
            <InlineEditSelect
              value={lead.source}
              options={LEAD_SOURCES}
              onSave={(value) => updateLeadField('source', value)}
              placeholder="Select source"
              allowEmpty
            />
          )
        },
        { 
          label: 'Industry', 
          value: (
            <InlineEditSelect
              value={lead.industry}
              options={LEAD_INDUSTRIES}
              onSave={(value) => updateLeadField('industry', value)}
              placeholder="Select industry"
              allowEmpty
            />
          )
        },
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        { 
          label: 'Email', 
          value: (
            <InlineEditEmail
              value={lead.email_address}
              onSave={(value) => updateLeadField('email_address', value)}
              placeholder="Email address"
            />
          )
        },
        { 
          label: 'Phone', 
          value: (
            <InlineEditText
              value={lead.phone_number}
              onSave={(value) => updateLeadField('phone_number', value)}
              placeholder="Phone number"
            />
          )
        },
        { 
          label: 'Mobile', 
          value: (
            <InlineEditText
              value={lead.phone_number_mobile}
              onSave={(value) => updateLeadField('phone_number_mobile', value)}
              placeholder="Mobile number"
            />
          )
        },
        { 
          label: 'Website', 
          value: (
            <InlineEditText
              value={lead.website}
              onSave={(value) => updateLeadField('website', value)}
              placeholder="Website URL"
            />
          )
        },
        { 
          label: 'Do Not Call', 
          value: (
            <InlineEditSelect
              value={lead.do_not_call ? 'true' : 'false'}
              options={[
                { value: 'false', label: 'No' },
                { value: 'true', label: 'Yes' }
              ]}
              onSave={(value) => updateLeadField('do_not_call', value === 'true')}
              placeholder="Select option"
            />
          )
        },
      ]
    },
    {
      title: 'Opportunity Information',
      fields: [
        { 
          label: 'Opportunity Amount', 
          value: (
            <InlineEditNumber
              value={lead.opportunity_amount}
              onSave={(value) => updateLeadField('opportunity_amount', value)}
              placeholder="Opportunity amount"
              min={0}
              formatDisplay={formatCurrency}
              allowEmpty
            />
          )
        },
      ]
    },
    {
      title: 'Address',
      fields: [
        { 
          label: 'Street', 
          value: (
            <InlineEditText
              value={lead.address_street}
              onSave={(value) => updateLeadField('address_street', value)}
              placeholder="Street address"
            />
          )
        },
        { 
          label: 'City', 
          value: (
            <InlineEditText
              value={lead.address_city}
              onSave={(value) => updateLeadField('address_city', value)}
              placeholder="City"
            />
          )
        },
        { 
          label: 'State', 
          value: (
            <InlineEditText
              value={lead.address_state}
              onSave={(value) => updateLeadField('address_state', value)}
              placeholder="State"
            />
          )
        },
        { 
          label: 'Postal Code', 
          value: (
            <InlineEditText
              value={lead.address_postal_code}
              onSave={(value) => updateLeadField('address_postal_code', value)}
              placeholder="Postal code"
            />
          )
        },
        { 
          label: 'Country', 
          value: (
            <InlineEditText
              value={lead.address_country}
              onSave={(value) => updateLeadField('address_country', value)}
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
              value={lead.description}
              onSave={(value) => updateLeadField('description', value)}
              placeholder="Description"
              multiline
            />
          ),
          colSpan: 3 
        },
      ]
    },
    ...(lead.converted ? [{
      title: 'Conversion Information',
      fields: [
        { label: 'Converted', value: 'Yes' },
        { label: 'Converted At', value: formatDate(lead.converted_at) },
      ]
    }] : []),
    {
      title: 'System Information',
      fields: [
        { label: 'Created By', value: lead.created_by_name || '-' },
        { label: 'Created At', value: formatDate(lead.created_at) },
        { label: 'Modified By', value: lead.modified_by_name || '-' },
        { label: 'Modified At', value: formatDate(lead.modified_at) },
        { label: 'Assigned To', value: lead.assigned_user_name || '-' },
        { label: 'Team', value: lead.assigned_team || '-' },
      ]
    }
  ] : []

  const actions = (
    <>
      {!lead?.converted && (
        <button
          onClick={() => setIsConvertOpen(true)}
          className="btn btn-primary"
        >
          <ArrowRightCircle className="w-4 h-4" />
          Convert
        </button>
      )}
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
        title={lead?.full_name || 'Lead Details'}
        subtitle={`Lead #${id?.slice(0, 8)}`}
        sections={sections}
        actions={actions}
        isLoading={isLoading}
        error={error?.message}
      />

      {/* Edit Modal */}
      {isEditOpen && lead && (
        <LeadForm
          mode="edit"
          lead={lead}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${lead?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteLeadMutation.isPending}
      />

      {/* Convert Confirmation */}
      <ConfirmDialog
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onConfirm={handleConvert}
        title="Convert Lead"
        description={
          <div className="space-y-3">
            <p className="text-gray-700">
              Convert <strong>"{lead?.full_name}"</strong> into business records:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                <span><strong>Organization:</strong> {lead?.account_name || 'New organization'}</span>
              </div>
              <div className="flex items-center">
                <UserPlus className="w-4 h-4 text-green-600 mr-2" />
                <span><strong>Contact:</strong> {lead?.full_name}</span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 text-purple-600 mr-2" />
                <span><strong>Opportunity:</strong> {lead?.opportunity_amount ? `$${lead.opportunity_amount}` : 'Potential deal'}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              The original lead will be marked as "converted" and preserved for history.
            </p>
          </div>
        }
        confirmText="Convert Lead"
        confirmButtonClass="bg-primary-600 hover:bg-primary-700 text-white"
        isLoading={convertLeadMutation.isPending}
      />
    </>
  )
}