import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit, Trash2, DollarSign, TrendingUp, Calendar, Building2 } from 'lucide-react'
import { useOpportunity, useDeleteOpportunity } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { OpportunityForm } from '../components/forms/OpportunityForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { OPPORTUNITY_STAGES, LEAD_SOURCES } from '../types'
import { format } from 'date-fns'

export function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: opportunity, isLoading, error } = useOpportunity(id!)
  const deleteOpportunityMutation = useDeleteOpportunity()

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteOpportunityMutation.mutateAsync(id!)
      showToast('success', 'Opportunity deleted successfully')
      navigate('/opportunities')
    } catch (error) {
      showToast('error', 'Failed to delete opportunity')
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'PP')
    } catch {
      return date
    }
  }

  const formatDateTime = (date: string | null) => {
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

  const getStageBadge = (stage: string) => {
    const stageObj = OPPORTUNITY_STAGES.find(s => s.value === stage)
    const colors = {
      prospecting: 'bg-gray-100 text-gray-800',
      qualification: 'bg-blue-100 text-blue-800',
      needs_analysis: 'bg-purple-100 text-purple-800',
      value_proposition: 'bg-indigo-100 text-indigo-800',
      id_decision_makers: 'bg-yellow-100 text-yellow-800',
      perception_analysis: 'bg-orange-100 text-orange-800',
      proposal: 'bg-pink-100 text-pink-800',
      negotiation: 'bg-red-100 text-red-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {stageObj?.label || stage}
      </span>
    )
  }

  const getSourceLabel = (value: string) => {
    const source = LEAD_SOURCES.find(s => s.value === value)
    return source?.label || value || '-'
  }

  const getExpectedRevenue = () => {
    if (!opportunity?.amount || !opportunity?.probability) return '-'
    const expected = (opportunity.amount * opportunity.probability) / 100
    return formatCurrency(expected)
  }

  const sections = opportunity ? [
    {
      title: 'Opportunity Information',
      fields: [
        { label: 'Opportunity Name', value: opportunity.name },
        { label: 'Account', value: opportunity.account_name ? (
          <Link to={`/accounts/${opportunity.account}`} className="text-primary-600 hover:text-primary-800">
            {opportunity.account_name}
          </Link>
        ) : '-' },
        { label: 'Stage', value: getStageBadge(opportunity.stage || 'prospecting') },
        { label: 'Close Date', value: formatDate(opportunity.close_date) },
        { label: 'Type', value: opportunity.type || '-' },
        { label: 'Lead Source', value: getSourceLabel(opportunity.lead_source || '') },
      ]
    },
    {
      title: 'Financial Information',
      fields: [
        { label: 'Amount', value: formatCurrency(opportunity.amount) },
        { label: 'Probability (%)', value: opportunity.probability ? `${opportunity.probability}%` : '-' },
        { label: 'Expected Revenue', value: getExpectedRevenue() },
        { label: 'Currency', value: opportunity.amount_currency || 'USD' },
      ]
    },
    {
      title: 'Related Contacts',
      fields: [
        { 
          label: 'Contacts', 
          value: opportunity.contacts_names?.length ? (
            <div className="space-y-1">
              {opportunity.contacts_names.map((name, index) => (
                <div key={index}>{name}</div>
              ))}
            </div>
          ) : '-',
          colSpan: 3
        },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { label: 'Next Step', value: opportunity.next_step || '-', colSpan: 3 },
        { label: 'Description', value: opportunity.description || '-', colSpan: 3 },
      ]
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Created By', value: opportunity.created_by_name || '-' },
        { label: 'Created At', value: formatDateTime(opportunity.created_at) },
        { label: 'Modified By', value: opportunity.modified_by_name || '-' },
        { label: 'Modified At', value: formatDateTime(opportunity.modified_at) },
        { label: 'Assigned To', value: opportunity.assigned_user_name || '-' },
        { label: 'Team', value: opportunity.assigned_team || '-' },
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
        title={opportunity?.name || 'Opportunity Details'}
        subtitle={`Opportunity #${id?.slice(0, 8)}`}
        sections={sections}
        actions={actions}
        isLoading={isLoading}
        error={error?.message}
      />

      {/* Edit Modal */}
      {isEditOpen && opportunity && (
        <OpportunityForm
          mode="edit"
          opportunity={opportunity}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${opportunity?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteOpportunityMutation.isPending}
      />
    </>
  )
}