import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, User, Phone, Mail, Globe, DollarSign, ArrowRightCircle, Building2, UserPlus, Target } from 'lucide-react'
import { useLead, useDeleteLead, useConvertLead } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { LeadForm } from '../components/forms/LeadForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { LEAD_STATUSES, LEAD_SOURCES, CONTACT_SALUTATIONS, LEAD_INDUSTRIES } from '../types'
import { format } from 'date-fns'

export function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)

  const { data: lead, isLoading, error } = useLead(id!)
  const deleteLeadMutation = useDeleteLead()
  const convertLeadMutation = useConvertLead()

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteLeadMutation.mutateAsync(id!)
      showToast('success', 'Lead deleted successfully')
      navigate('/leads')
    } catch (error) {
      showToast('error', 'Failed to delete lead')
    }
  }

  const handleConvert = async () => {
    try {
      const result = await convertLeadMutation.mutateAsync(id!)
      showToast('success', 'Lead converted successfully', {
        description: `Created Organization, Contact, and ${result.opportunity_id ? 'Opportunity' : 'records'}`
      })
      // Navigate to the created organization
      if (result.organization_id) {
        navigate(`/organizations/${result.organization_id}`)
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Failed to convert lead')
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
        { label: 'Full Name', value: `${getSalutationLabel(lead.salutation_name || '')} ${lead.full_name}`.trim() || '-' },
        { label: 'Title', value: lead.title || '-' },
        { label: 'Company', value: lead.account_name || '-' },
        { label: 'Status', value: getStatusBadge(lead.status || 'new') },
        { label: 'Source', value: getSourceLabel(lead.source || '') },
        { label: 'Industry', value: getIndustryLabel(lead.industry || '') },
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Email', value: lead.email_address ? (
          <a href={`mailto:${lead.email_address}`} className="text-primary-600 hover:text-primary-800">
            {lead.email_address}
          </a>
        ) : '-' },
        { label: 'Phone', value: lead.phone_number || '-' },
        { label: 'Mobile', value: lead.phone_number_mobile || '-' },
        { label: 'Website', value: lead.website ? (
          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
            {lead.website}
          </a>
        ) : '-' },
        { label: 'Do Not Call', value: lead.do_not_call ? 'Yes' : 'No' },
      ]
    },
    {
      title: 'Opportunity Information',
      fields: [
        { label: 'Opportunity Amount', value: formatCurrency(lead.opportunity_amount) },
      ]
    },
    {
      title: 'Address',
      fields: [
        { 
          label: 'Address', 
          value: [
            lead.address_street,
            lead.address_city,
            lead.address_state,
            lead.address_postal_code,
            lead.address_country
          ].filter(Boolean).join(', ') || '-',
          colSpan: 3
        },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { label: 'Description', value: lead.description || '-', colSpan: 3 },
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