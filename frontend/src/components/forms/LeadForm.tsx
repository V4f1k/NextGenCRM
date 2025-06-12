import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LeadModel, LEAD_STATUSES, LEAD_SOURCES, CONTACT_SALUTATIONS } from '../../types'
import { Modal, ModalBody, ModalFooter } from '../ui/Modal'
import { useCreateLead, useUpdateLead } from '../../hooks/useApi'
import { useToastContext } from '../../context/ToastContext'
import { useEffect } from 'react'
import clsx from 'clsx'

const leadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  salutation: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  email_address: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone_number: z.string().optional(),
  mobile_phone: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  do_not_call: z.boolean().default(false),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  description: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadFormProps {
  isOpen: boolean
  onClose: () => void
  lead?: LeadModel
  mode: 'create' | 'edit'
}

export function LeadForm({ isOpen, onClose, lead, mode }: LeadFormProps) {
  const toast = useToastContext()
  
  const createLeadMutation = useCreateLead({
    onSuccess: (data) => {
      toast.success('Lead created successfully', {
        description: `${data.first_name} ${data.last_name} has been added to your CRM`,
      })
      onClose()
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create lead', {
        description: error.message,
      })
    },
  })

  const updateLeadMutation = useUpdateLead({
    onSuccess: (data) => {
      toast.success('Lead updated successfully', {
        description: `${data.first_name} ${data.last_name} has been updated`,
      })
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to update lead', {
        description: error.message,
      })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      do_not_call: false,
      status: 'new',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && lead) {
      const formData: Partial<LeadFormData> = {
        first_name: lead.first_name,
        last_name: lead.last_name,
        salutation: lead.salutation || '',
        title: lead.title || '',
        company: lead.company || '',
        website: lead.website || '',
        industry: lead.industry || '',
        email_address: lead.email_address || '',
        phone_number: lead.phone_number || '',
        mobile_phone: lead.mobile_phone || '',
        status: lead.status || 'new',
        source: lead.source || '',
        do_not_call: lead.do_not_call || false,
        address_street: lead.address_street || '',
        address_city: lead.address_city || '',
        address_state: lead.address_state || '',
        address_postal_code: lead.address_postal_code || '',
        address_country: lead.address_country || '',
        description: lead.description || '',
      }

      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof LeadFormData, value)
      })
    } else if (mode === 'create') {
      reset()
    }
  }, [lead, mode, setValue, reset])

  const onSubmit = (data: LeadFormData) => {
    const cleanedData = {
      ...data,
      website: data.website || undefined,
      email_address: data.email_address || undefined,
    }

    if (mode === 'create') {
      createLeadMutation.mutate(cleanedData)
    } else if (mode === 'edit' && lead) {
      updateLeadMutation.mutate({ 
        id: lead.id, 
        data: cleanedData 
      })
    }
  }

  const isLoading = createLeadMutation.isPending || updateLeadMutation.isPending
  const currentStatus = watch('status')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_process': return 'bg-orange-100 text-orange-800'
      case 'converted': return 'bg-green-100 text-green-800'
      case 'recycled': return 'bg-gray-100 text-gray-800'
      case 'dead': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Lead' : 'Edit Lead'}
      size="xl"
      closeOnOutsideClick={!isLoading}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="salutation" className="block text-sm font-medium text-gray-700 mb-1">
                  Salutation
                </label>
                <select {...register('salutation')} className="input">
                  <option value="">Select salutation</option>
                  {CONTACT_SALUTATIONS.map((salutation) => (
                    <option key={salutation.value} value={salutation.value}>
                      {salutation.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <select {...register('status')} className="input flex-1">
                    {LEAD_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {currentStatus && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
                      {LEAD_STATUSES.find(s => s.value === currentStatus)?.label}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  {...register('first_name')}
                  type="text"
                  className={clsx('input', errors.first_name && 'border-red-300')}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  {...register('last_name')}
                  type="text"
                  className={clsx('input', errors.last_name && 'border-red-300')}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="input"
                  placeholder="CEO, Manager, Developer..."
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <select {...register('source')} className="input">
                  <option value="">Select source</option>
                  {LEAD_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Company Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  {...register('company')}
                  type="text"
                  className="input"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  {...register('website')}
                  type="url"
                  className={clsx('input', errors.website && 'border-red-300')}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  {...register('industry')}
                  type="text"
                  className="input"
                  placeholder="Technology, Healthcare, Finance..."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email_address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...register('email_address')}
                  type="email"
                  className={clsx('input', errors.email_address && 'border-red-300')}
                  placeholder="lead@example.com"
                />
                {errors.email_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.email_address.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  {...register('phone_number')}
                  type="tel"
                  className="input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="mobile_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Phone
                </label>
                <input
                  {...register('mobile_phone')}
                  type="tel"
                  className="input"
                  placeholder="+1 (555) 987-6543"
                />
              </div>

              <div className="flex items-center">
                <input
                  {...register('do_not_call')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="do_not_call" className="ml-2 text-sm text-gray-700">
                  Do not call
                </label>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Address</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  {...register('address_street')}
                  type="text"
                  className="input"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="address_city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register('address_city')}
                    type="text"
                    className="input"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    {...register('address_state')}
                    type="text"
                    className="input"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label htmlFor="address_postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    {...register('address_postal_code')}
                    type="text"
                    className="input"
                    placeholder="10001"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address_country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  {...register('address_country')}
                  type="text"
                  className="input"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="input resize-none"
              placeholder="Add notes about this lead..."
            />
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
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}