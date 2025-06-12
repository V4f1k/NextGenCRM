import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { OpportunityModel } from '../../types'
import { OPPORTUNITY_STAGES, OPPORTUNITY_TYPES } from '../../types'
import { Modal, ModalBody, ModalFooter } from '../ui/Modal'
import { useCreateOpportunity, useUpdateOpportunity, useOrganizations, useContacts } from '../../hooks/useApi'
import { useToastContext } from '../../context/ToastContext'
import { useEffect } from 'react'
import clsx from 'clsx'

const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  organization_id: z.string().optional(),
  contact_id: z.string().optional(),
  stage: z.string().optional(),
  type: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive').optional(),
  probability: z.coerce.number().min(0, 'Probability must be between 0 and 100').max(100, 'Probability must be between 0 and 100').optional(),
  close_date: z.string().optional(),
  lead_source: z.string().optional(),
  next_step: z.string().optional(),
  description: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormProps {
  isOpen: boolean
  onClose: () => void
  opportunity?: OpportunityModel
  mode: 'create' | 'edit'
  preselectedOrganizationId?: string
  preselectedContactId?: string
}

export function OpportunityForm({ 
  isOpen, 
  onClose, 
  opportunity, 
  mode, 
  preselectedOrganizationId,
  preselectedContactId 
}: OpportunityFormProps) {
  const toast = useToastContext()
  
  const createOpportunityMutation = useCreateOpportunity({
    onSuccess: (data) => {
      toast.success('Opportunity created successfully', {
        description: `${data.name} has been added to your pipeline`,
      })
      onClose()
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create opportunity', {
        description: error.message,
      })
    },
  })

  const updateOpportunityMutation = useUpdateOpportunity({
    onSuccess: (data) => {
      toast.success('Opportunity updated successfully', {
        description: `${data.name} has been updated`,
      })
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to update opportunity', {
        description: error.message,
      })
    },
  })

  // Fetch accounts and contacts for dropdowns
  const { data: organizationsData } = useOrganizations()
  const { data: contactsData } = useContacts()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      stage: 'prospecting',
      probability: 10,
    },
  })

  const selectedOrganizationId = watch('organization_id')
  const currentStage = watch('stage')
  const currentProbability = watch('probability')

  // Filter contacts by selected account
  const filteredContacts = contactsData?.results?.filter(contact => 
    !selectedOrganizationId || contact.organization_id === selectedOrganizationId
  ) || []

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && opportunity) {
      const formData: Partial<OpportunityFormData> = {
        name: opportunity.name,
        organization_id: opportunity.organization_id || '',
        contact_id: opportunity.contact_id || '',
        stage: opportunity.stage || 'prospecting',
        type: opportunity.type || '',
        amount: opportunity.amount || undefined,
        probability: opportunity.probability || 10,
        close_date: opportunity.close_date || '',
        lead_source: opportunity.lead_source || '',
        next_step: opportunity.next_step || '',
        description: opportunity.description || '',
      }

      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof OpportunityFormData, value)
      })
    } else if (mode === 'create') {
      reset()
      if (preselectedOrganizationId) {
        setValue('organization_id', preselectedOrganizationId)
      }
      if (preselectedContactId) {
        setValue('contact_id', preselectedContactId)
      }
    }
  }, [opportunity, mode, setValue, reset, preselectedOrganizationId, preselectedContactId])

  // Auto-update probability based on stage
  useEffect(() => {
    if (currentStage) {
      const stageProbabilities: Record<string, number> = {
        prospecting: 10,
        qualification: 20,
        needs_analysis: 40,
        value_proposition: 60,
        id_decision_makers: 70,
        perception_analysis: 80,
        proposal_price_quote: 90,
        negotiation_review: 95,
        closed_won: 100,
        closed_lost: 0,
      }
      
      const defaultProbability = stageProbabilities[currentStage]
      if (defaultProbability !== undefined && currentProbability !== defaultProbability) {
        setValue('probability', defaultProbability)
      }
    }
  }, [currentStage, setValue, currentProbability])

  const onSubmit = (data: OpportunityFormData) => {
    const cleanedData = {
      ...data,
      organization_id: data.organization_id || undefined,
      contact_id: data.contact_id || undefined,
      amount: data.amount || undefined,
      close_date: data.close_date || undefined,
    }

    if (mode === 'create') {
      createOpportunityMutation.mutate(cleanedData)
    } else if (mode === 'edit' && opportunity) {
      updateOpportunityMutation.mutate({ 
        id: opportunity.id, 
        data: cleanedData 
      })
    }
  }

  const isLoading = createOpportunityMutation.isPending || updateOpportunityMutation.isPending

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-gray-100 text-gray-800'
      case 'qualification': return 'bg-blue-100 text-blue-800'
      case 'needs_analysis': return 'bg-indigo-100 text-indigo-800'
      case 'value_proposition': return 'bg-purple-100 text-purple-800'
      case 'id_decision_makers': return 'bg-pink-100 text-pink-800'
      case 'perception_analysis': return 'bg-yellow-100 text-yellow-800'
      case 'proposal_price_quote': return 'bg-orange-100 text-orange-800'
      case 'negotiation_review': return 'bg-red-100 text-red-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Opportunity' : 'Edit Opportunity'}
      size="xl"
      closeOnOutsideClick={!isLoading}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Opportunity Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={clsx('input', errors.name && 'border-red-300')}
                  placeholder="Enter opportunity name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <select {...register('organization_id')} className="input">
                  <option value="">Select organization</option>
                  {organizationsData?.results?.map((account) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <select {...register('contact_id')} className="input">
                  <option value="">Select contact</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </option>
                  ))}
                </select>
                {selectedOrganizationId && filteredContacts.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">No contacts found for selected account</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Opportunity Type
                </label>
                <select {...register('type')} className="input">
                  <option value="">Select type</option>
                  {OPPORTUNITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lead_source" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <input
                  {...register('lead_source')}
                  type="text"
                  className="input"
                  placeholder="Web, Referral, Campaign..."
                />
              </div>
            </div>
          </div>

          {/* Sales Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Sales Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Stage
                </label>
                <div className="flex items-center gap-2">
                  <select {...register('stage')} className="input flex-1">
                    {OPPORTUNITY_STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                  {currentStage && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(currentStage)}`}>
                      {OPPORTUNITY_STAGES.find(s => s.value === currentStage)?.label}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-1">
                  Probability (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    {...register('probability')}
                    type="number"
                    min="0"
                    max="100"
                    className={clsx('input flex-1', errors.probability && 'border-red-300')}
                    placeholder="50"
                  />
                  <span className="text-sm text-gray-500 min-w-0">{currentProbability}%</span>
                </div>
                {errors.probability && (
                  <p className="mt-1 text-sm text-red-600">{errors.probability.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    {...register('amount')}
                    type="number"
                    min="0"
                    step="0.01"
                    className={clsx('input flex-1', errors.amount && 'border-red-300')}
                    placeholder="100000"
                  />
                  <span className="text-sm text-gray-500 min-w-0">
                    {formatCurrency(watch('amount'))}
                  </span>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="close_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Close Date
                </label>
                <input
                  {...register('close_date')}
                  type="date"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="next_step" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Step
                </label>
                <input
                  {...register('next_step')}
                  type="text"
                  className="input"
                  placeholder="Schedule demo, Send proposal, Follow up..."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="input resize-none"
                  placeholder="Add notes about this opportunity..."
                />
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            className="btn-outline px-4 py-2"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary px-6 py-2"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Opportunity' : 'Update Opportunity'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}