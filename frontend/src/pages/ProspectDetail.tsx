import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, CheckCircle, Mail, MessageSquare, ArrowRight, Building2, User, Phone, MapPin, Target, Calendar, FileText, Database } from 'lucide-react'
import { 
  useProspect, 
  useDeleteProspect, 
  useUpdateProspect, 
  useValidateProspect, 
  useAdvanceProspectSequence, 
  useMarkProspectResponded, 
  useConvertProspectToLead,
  useEnrichProspectFromICO
} from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { InlineEditText, InlineEditSelect, InlineEditNumber, InlineEditEmail } from '../components/ui/InlineEdit'
import { PROSPECT_STATUSES, PROSPECT_SEQUENCE_POSITIONS, LEAD_INDUSTRIES } from '../types'
import type { ProspectModel } from '../types'
import { format } from 'date-fns'

export function ProspectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToastContext()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isValidateOpen, setIsValidateOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)

  const { data: prospect, isLoading, error } = useProspect(id!)
  const deleteProspectMutation = useDeleteProspect()
  const validateProspectMutation = useValidateProspect()
  const advanceSequenceMutation = useAdvanceProspectSequence()
  const markRespondedMutation = useMarkProspectResponded()
  const convertToLeadMutation = useConvertProspectToLead()
  const enrichFromICOMutation = useEnrichProspectFromICO({
    onSuccess: (data) => {
      const updatedFields = Object.keys(data.enriched_fields).filter(
        key => data.enriched_fields[key] && data.enriched_fields[key] !== ''
      );
      
      toast.success('Prospect enriched successfully', {
        description: `Updated ${updatedFields.length} fields: ${data.enriched_fields.company_name ? 'company name, ' : ''}${data.enriched_fields.address_city ? 'address, ' : ''}${data.enriched_fields.legal_form ? 'legal form, ' : ''}${data.enriched_fields.contact_name ? 'CEO contact' : 'business data'}`
      })
    },
    onError: (error) => {
      toast.error('Failed to enrich prospect', {
        description: error.message,
      })
    },
  })
  const updateProspectMutation = useUpdateProspect({
    onSuccess: () => {
      toast.success('Prospect updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update prospect', {
        description: error.message,
      })
    },
  })

  const updateProspectField = async (field: keyof ProspectModel, value: any): Promise<void> => {
    await updateProspectMutation.mutateAsync({
      id: id!,
      data: { [field]: value }
    })
  }

  const handleDelete = async () => {
    try {
      await deleteProspectMutation.mutateAsync(id!)
      toast.success('Prospect deleted successfully')
      navigate('/prospects')
    } catch (error) {
      toast.error('Failed to delete prospect')
    }
  }

  const handleValidate = async () => {
    try {
      await validateProspectMutation.mutateAsync({
        id: id!,
        notes: 'Manually validated'
      })
      toast.success('Prospect validated successfully')
      setIsValidateOpen(false)
    } catch (error: any) {
      toast.error('Failed to validate prospect')
    }
  }

  const handleAdvanceSequence = async () => {
    try {
      await advanceSequenceMutation.mutateAsync(id!)
      toast.success('Email sequence advanced successfully')
    } catch (error: any) {
      toast.error('Failed to advance sequence')
    }
  }

  const handleMarkResponded = async () => {
    try {
      await markRespondedMutation.mutateAsync(id!)
      toast.success('Prospect marked as responded')
    } catch (error: any) {
      toast.error('Failed to mark as responded')
    }
  }

  const handleConvert = async () => {
    try {
      const result = await convertToLeadMutation.mutateAsync(id!)
      toast.success('Prospect converted to lead successfully', {
        description: `Created lead ${result.lead_id}`
      })
      // Navigate to the created lead
      if (result.lead_id) {
        navigate(`/leads/${result.lead_id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to convert prospect')
    }
  }

  const handleEnrichFromICO = async () => {
    try {
      await enrichFromICOMutation.mutateAsync(id!)
    } catch (error: any) {
      // Error handling is done in the mutation's onError callback
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

  const getStatusBadge = (status: string) => {
    const statusObj = PROSPECT_STATUSES.find(s => s.value === status)
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      validated: 'bg-green-100 text-green-800',
      email_generated: 'bg-purple-100 text-purple-800',
      sent: 'bg-indigo-100 text-indigo-800',
      follow_up_1: 'bg-yellow-100 text-yellow-800',
      follow_up_2: 'bg-orange-100 text-orange-800',
      follow_up_3: 'bg-red-100 text-red-800',
      responded: 'bg-emerald-100 text-emerald-800',
      converted: 'bg-green-100 text-green-800',
      dead: 'bg-gray-100 text-gray-800',
      disqualified: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusObj?.label || status}
      </span>
    )
  }

  const getSequenceBadge = (position: number) => {
    const sequenceObj = PROSPECT_SEQUENCE_POSITIONS.find(p => p.value === position)
    const colors = {
      0: 'bg-blue-100 text-blue-800',
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-red-100 text-red-800',
      4: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {sequenceObj?.label || `Position ${position}`}
      </span>
    )
  }

  const getIndustryLabel = (value: string) => {
    const industry = LEAD_INDUSTRIES.find(i => i.value === value)
    return industry?.label || value || '-'
  }

  const actions = prospect ? [
    ...(prospect.ico ? [{
      label: enrichFromICOMutation.isPending ? 'Enriching...' : 'Enrich from ICO',
      icon: Database,
      onClick: handleEnrichFromICO,
      variant: 'primary' as const,
      disabled: enrichFromICOMutation.isPending,
    }] : []),
    ...(prospect.validated ? [] : [{
      label: 'Validate',
      icon: CheckCircle,
      onClick: () => setIsValidateOpen(true),
      variant: 'success' as const,
      disabled: false,
    }]),
    ...(prospect.validated && prospect.status && !['responded', 'converted', 'dead', 'disqualified'].includes(prospect.status) ? [{
      label: 'Advance Sequence',
      icon: Mail,
      onClick: handleAdvanceSequence,
      variant: 'primary' as const,
      disabled: advanceSequenceMutation.isPending,
    }] : []),
    ...(prospect.status && !['responded', 'converted', 'dead', 'disqualified'].includes(prospect.status) ? [{
      label: 'Mark Responded',
      icon: MessageSquare,
      onClick: handleMarkResponded,
      variant: 'secondary' as const,
      disabled: markRespondedMutation.isPending,
    }] : []),
    ...((prospect.status === 'responded' || prospect.validated) && !prospect.converted_to_lead ? [{
      label: 'Convert to Lead',
      icon: ArrowRight,
      onClick: () => setIsConvertOpen(true),
      variant: 'warning' as const,
      disabled: false,
    }] : []),
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => setIsDeleteOpen(true),
      variant: 'danger' as const,
      disabled: false,
    },
  ] : []

  const sections = prospect ? [
    {
      title: 'Company Information',
      icon: Building2,
      fields: [
        { 
          label: 'Company Name', 
          value: (
            <InlineEditText
              value={prospect.company_name}
              onSave={(value) => updateProspectField('company_name', value)}
              placeholder="Company name"
              required
            />
          )
        },
        { 
          label: 'Website', 
          value: (
            <InlineEditText
              value={prospect.website}
              onSave={(value) => updateProspectField('website', value)}
              placeholder="Website URL"
            />
          )
        },
        { 
          label: 'Industry', 
          value: (
            <InlineEditSelect
              value={prospect.industry}
              options={LEAD_INDUSTRIES}
              onSave={(value) => updateProspectField('industry', value)}
              placeholder="Select industry"
              allowEmpty
            />
          )
        },
        { 
          label: 'ICO', 
          value: (
            <InlineEditText
              value={prospect.ico}
              onSave={(value) => updateProspectField('ico', value)}
              placeholder="Czech business ID"
            />
          )
        },
        { 
          label: 'Description', 
          value: (
            <InlineEditText
              value={prospect.description}
              onSave={(value) => updateProspectField('description', value)}
              placeholder="Company description"
              multiline
            />
          )
        },
      ]
    },
    {
      title: 'Contact Information',
      icon: User,
      fields: [
        { 
          label: 'Contact Name', 
          value: (
            <InlineEditText
              value={prospect.contact_name}
              onSave={(value) => updateProspectField('contact_name', value)}
              placeholder="Contact name"
            />
          )
        },
        { 
          label: 'First Name', 
          value: (
            <InlineEditText
              value={prospect.contact_first_name}
              onSave={(value) => updateProspectField('contact_first_name', value)}
              placeholder="First name"
            />
          )
        },
        { 
          label: 'Last Name', 
          value: (
            <InlineEditText
              value={prospect.contact_last_name}
              onSave={(value) => updateProspectField('contact_last_name', value)}
              placeholder="Last name"
            />
          )
        },
        { 
          label: 'Title', 
          value: (
            <InlineEditText
              value={prospect.contact_title}
              onSave={(value) => updateProspectField('contact_title', value)}
              placeholder="Job title"
            />
          )
        },
        { 
          label: 'Email', 
          value: (
            <InlineEditEmail
              value={prospect.email_address}
              onSave={(value) => updateProspectField('email_address', value)}
              placeholder="Email address"
            />
          )
        },
        { 
          label: 'Phone', 
          value: (
            <InlineEditText
              value={prospect.phone_number}
              onSave={(value) => updateProspectField('phone_number', value)}
              placeholder="Phone number"
            />
          )
        },
      ]
    },
    {
      title: 'Lead Generation',
      icon: Target,
      fields: [
        { 
          label: 'Niche', 
          value: (
            <InlineEditText
              value={prospect.niche}
              onSave={(value) => updateProspectField('niche', value)}
              placeholder="Target niche"
              required
            />
          )
        },
        { 
          label: 'Location', 
          value: (
            <InlineEditText
              value={prospect.location}
              onSave={(value) => updateProspectField('location', value)}
              placeholder="Target location"
              required
            />
          )
        },
        { 
          label: 'Keyword', 
          value: (
            <InlineEditText
              value={prospect.keyword}
              onSave={(value) => updateProspectField('keyword', value)}
              placeholder="Search keyword"
            />
          )
        },
        { 
          label: 'Campaign ID', 
          value: (
            <InlineEditText
              value={prospect.campaign_id}
              onSave={(value) => updateProspectField('campaign_id', value)}
              placeholder="Campaign identifier"
            />
          )
        },
      ]
    },
    {
      title: 'Address',
      icon: MapPin,
      fields: [
        { 
          label: 'Street', 
          value: (
            <InlineEditText
              value={prospect.address_street}
              onSave={(value) => updateProspectField('address_street', value)}
              placeholder="Street address"
            />
          )
        },
        { 
          label: 'City', 
          value: (
            <InlineEditText
              value={prospect.address_city}
              onSave={(value) => updateProspectField('address_city', value)}
              placeholder="City"
            />
          )
        },
        { 
          label: 'State', 
          value: (
            <InlineEditText
              value={prospect.address_state}
              onSave={(value) => updateProspectField('address_state', value)}
              placeholder="State/Province"
            />
          )
        },
        { 
          label: 'Country', 
          value: (
            <InlineEditText
              value={prospect.address_country}
              onSave={(value) => updateProspectField('address_country', value)}
              placeholder="Country"
            />
          )
        },
        { 
          label: 'Postal Code', 
          value: (
            <InlineEditText
              value={prospect.address_postal_code}
              onSave={(value) => updateProspectField('address_postal_code', value)}
              placeholder="Postal code"
            />
          )
        },
      ]
    },
    {
      title: 'Email Automation',
      icon: Mail,
      fields: [
        { 
          label: 'Status', 
          value: getStatusBadge(prospect.status || 'new')
        },
        { 
          label: 'Sequence Position', 
          value: getSequenceBadge(prospect.sequence_position || 0)
        },
        { 
          label: 'Next Follow-up', 
          value: formatDate(prospect.next_followup_date || null)
        },
        { 
          label: 'Email Subject', 
          value: (
            <InlineEditText
              value={prospect.email_subject}
              onSave={(value) => updateProspectField('email_subject', value)}
              placeholder="Email subject"
            />
          )
        },
        { 
          label: 'Email Body', 
          value: (
            <InlineEditText
              value={prospect.email_body}
              onSave={(value) => updateProspectField('email_body', value)}
              placeholder="Email body"
              multiline
            />
          )
        },
        { 
          label: 'Email Sent', 
          value: prospect.email_sent ? 'Yes' : 'No'
        },
        { 
          label: 'Email Status', 
          value: prospect.email_status || '-'
        },
        { 
          label: 'Last Email Sent', 
          value: formatDate(prospect.last_email_sent || null)
        },
      ]
    },
    {
      title: 'Validation & Quality',
      icon: CheckCircle,
      fields: [
        { 
          label: 'Validated', 
          value: prospect.validated ? 'Yes' : 'No'
        },
        { 
          label: 'Validation Notes', 
          value: (
            <InlineEditText
              value={prospect.validation_notes}
              onSave={(value) => updateProspectField('validation_notes', value)}
              placeholder="Validation notes"
              multiline
            />
          )
        },
        { 
          label: 'Auto Validation Score', 
          value: prospect.auto_validation_score ? prospect.auto_validation_score.toFixed(2) : '-'
        },
        { 
          label: 'Should Send Follow-up', 
          value: prospect.should_send_followup ? 'Yes' : 'No'
        },
      ]
    },
    {
      title: 'Tracking',
      icon: Calendar,
      fields: [
        { 
          label: 'Response Received', 
          value: prospect.response_received ? 'Yes' : 'No'
        },
        { 
          label: 'Response Date', 
          value: formatDate(prospect.response_date || null)
        },
        { 
          label: 'Converted to Lead', 
          value: prospect.converted_to_lead ? 'Yes' : 'No'
        },
        { 
          label: 'Lead ID', 
          value: prospect.lead_id || '-'
        },
        { 
          label: 'Contact ID', 
          value: prospect.contact_id || '-'
        },
        { 
          label: 'Organization ID', 
          value: prospect.organization_id || '-'
        },
      ]
    },
    {
      title: 'Czech Business Registry (ARES)',
      icon: Database,
      fields: [
        { 
          label: 'Enriched from ICO', 
          value: prospect.ico_enriched ? 'Yes' : 'No'
        },
        { 
          label: 'Enriched Date', 
          value: formatDate(prospect.ico_enriched_at || null)
        },
        { 
          label: 'Legal Form', 
          value: prospect.legal_form || '-'
        },
        { 
          label: 'Legal Form Code', 
          value: prospect.legal_form_code || '-'
        },
        { 
          label: 'Registration Date', 
          value: prospect.registration_date ? new Date(prospect.registration_date).toLocaleDateString() : '-'
        },
        { 
          label: 'Employee Count Range', 
          value: prospect.employee_count_range || '-'
        },
        { 
          label: 'Business Activities', 
          value: prospect.business_activities && prospect.business_activities.length > 0 ? (
            <div className="space-y-1">
              {prospect.business_activities.slice(0, 3).map((activity, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{activity.nace_code}</span>
                  {activity.description && (
                    <span className="text-gray-600 ml-2">{activity.description}</span>
                  )}
                </div>
              ))}
              {prospect.business_activities.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{prospect.business_activities.length - 3} more activities
                </div>
              )}
            </div>
          ) : '-'
        },
      ]
    },
    {
      title: 'System Information',
      icon: FileText,
      fields: [
        { 
          label: 'Created', 
          value: formatDate(prospect.created_at)
        },
        { 
          label: 'Modified', 
          value: formatDate(prospect.modified_at)
        },
        { 
          label: 'Created By', 
          value: prospect.created_by_name || '-'
        },
        { 
          label: 'Assigned To', 
          value: prospect.assigned_user_name || '-'
        },
      ]
    },
  ] : []

  const breadcrumbs = prospect ? [
    { label: 'Prospects', href: '/prospects' },
    { label: prospect.company_name, href: `/prospects/${prospect.id}` }
  ] : []

  return (
    <>
      <DetailView
        title={prospect?.company_name || 'Prospect'}
        subtitle={prospect ? `${prospect.full_contact_name || prospect.contact_name || 'No contact'} • ${prospect.niche} • ${prospect.location}` : ''}
        sections={sections}
        actions={
          <div className="flex items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                    action.variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
                    action.variant === 'warning' ? 'bg-orange-600 text-white hover:bg-orange-700' :
                    action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                    'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              )
            })}
          </div>
        }
        isLoading={isLoading}
        error={error?.message}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Prospect"
        description={`Are you sure you want to delete "${prospect?.company_name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteProspectMutation.isPending}
      />

      {/* Validate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isValidateOpen}
        onClose={() => setIsValidateOpen(false)}
        onConfirm={handleValidate}
        title="Validate Prospect"
        description={`Mark "${prospect?.company_name}" as validated and ready for email automation?`}
        confirmText="Validate"
        type="success"
        isLoading={validateProspectMutation.isPending}
      />

      {/* Convert Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onConfirm={handleConvert}
        title="Convert to Lead"
        description={
          <div className="space-y-3">
            <p className="text-gray-700">
              Convert <strong>"{prospect?.company_name}"</strong> to a qualified lead?
            </p>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                <span><strong>Company:</strong> {prospect?.company_name}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 text-green-600 mr-2" />
                <span><strong>Contact:</strong> {prospect?.full_contact_name || 'No contact'}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-purple-600 mr-2" />
                <span><strong>Status:</strong> {prospect?.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              This will create a new lead record and mark the prospect as converted.
            </p>
          </div>
        }
        confirmText="Convert to Lead"
        type="success"
        isLoading={convertToLeadMutation.isPending}
      />
    </>
  )
}