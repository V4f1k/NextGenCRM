import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AccountModel, ACCOUNT_TYPES, ACCOUNT_INDUSTRIES } from '../../types'
import { Modal, ModalBody, ModalFooter } from '../ui/Modal'
import { useCreateAccount, useUpdateAccount } from '../../hooks/useApi'
import { useToastContext } from '../../context/ToastContext'
import { useEffect } from 'react'
import clsx from 'clsx'

const accountSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  type: z.string().optional(),
  phone_number: z.string().optional(),
  email_address: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  billing_address_street: z.string().optional(),
  billing_address_city: z.string().optional(),
  billing_address_state: z.string().optional(),
  billing_address_postal_code: z.string().optional(),
  billing_address_country: z.string().optional(),
  shipping_address_street: z.string().optional(),
  shipping_address_city: z.string().optional(),
  shipping_address_state: z.string().optional(),
  shipping_address_postal_code: z.string().optional(),
  shipping_address_country: z.string().optional(),
  description: z.string().optional(),
  annual_revenue: z.coerce.number().positive('Revenue must be positive').optional(),
  number_of_employees: z.coerce.number().int().positive('Number of employees must be positive').optional(),
})

type AccountFormData = z.infer<typeof accountSchema>

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  account?: AccountModel
  mode: 'create' | 'edit'
}

export function AccountForm({ isOpen, onClose, account, mode }: AccountFormProps) {
  const toast = useToastContext()
  
  const createAccountMutation = useCreateAccount({
    onSuccess: (data) => {
      toast.success('Account created successfully', {
        description: `${data.name} has been added to your CRM`,
      })
      onClose()
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create account', {
        description: error.message,
      })
    },
  })

  const updateAccountMutation = useUpdateAccount({
    onSuccess: (data) => {
      toast.success('Account updated successfully', {
        description: `${data.name} has been updated`,
      })
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to update account', {
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
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  })

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && account) {
      const formData: Partial<AccountFormData> = {
        name: account.name,
        website: account.website || '',
        industry: account.industry || '',
        type: account.type || '',
        phone_number: account.phone_number || '',
        email_address: account.email_address || '',
        billing_address_street: account.billing_address_street || '',
        billing_address_city: account.billing_address_city || '',
        billing_address_state: account.billing_address_state || '',
        billing_address_postal_code: account.billing_address_postal_code || '',
        billing_address_country: account.billing_address_country || '',
        shipping_address_street: account.shipping_address_street || '',
        shipping_address_city: account.shipping_address_city || '',
        shipping_address_state: account.shipping_address_state || '',
        shipping_address_postal_code: account.shipping_address_postal_code || '',
        shipping_address_country: account.shipping_address_country || '',
        description: account.description || '',
        annual_revenue: account.annual_revenue || undefined,
        number_of_employees: account.number_of_employees || undefined,
      }

      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof AccountFormData, value)
      })
    } else if (mode === 'create') {
      reset()
    }
  }, [account, mode, setValue, reset])

  const onSubmit = (data: AccountFormData) => {
    const cleanedData = {
      ...data,
      website: data.website || undefined,
      email_address: data.email_address || undefined,
      annual_revenue: data.annual_revenue || undefined,
      number_of_employees: data.number_of_employees || undefined,
    }

    if (mode === 'create') {
      createAccountMutation.mutate(cleanedData)
    } else if (mode === 'edit' && account) {
      updateAccountMutation.mutate({ 
        id: account.id, 
        data: cleanedData 
      })
    }
  }

  const isLoading = createAccountMutation.isPending || updateAccountMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Account' : 'Edit Account'}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={clsx('input', errors.name && 'border-red-300')}
                  placeholder="Enter company name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
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

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select {...register('type')} className="input">
                  <option value="">Select type</option>
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select {...register('industry')} className="input">
                  <option value="">Select industry</option>
                  {ACCOUNT_INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label htmlFor="email_address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...register('email_address')}
                  type="email"
                  className={clsx('input', errors.email_address && 'border-red-300')}
                  placeholder="contact@company.com"
                />
                {errors.email_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.email_address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Company Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="annual_revenue" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Revenue
                </label>
                <input
                  {...register('annual_revenue')}
                  type="number"
                  className={clsx('input', errors.annual_revenue && 'border-red-300')}
                  placeholder="1000000"
                  min="0"
                />
                {errors.annual_revenue && (
                  <p className="mt-1 text-sm text-red-600">{errors.annual_revenue.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="number_of_employees" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Employees
                </label>
                <input
                  {...register('number_of_employees')}
                  type="number"
                  className={clsx('input', errors.number_of_employees && 'border-red-300')}
                  placeholder="50"
                  min="1"
                />
                {errors.number_of_employees && (
                  <p className="mt-1 text-sm text-red-600">{errors.number_of_employees.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="billing_address_street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  {...register('billing_address_street')}
                  type="text"
                  className="input"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="billing_address_city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register('billing_address_city')}
                    type="text"
                    className="input"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label htmlFor="billing_address_state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    {...register('billing_address_state')}
                    type="text"
                    className="input"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label htmlFor="billing_address_postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    {...register('billing_address_postal_code')}
                    type="text"
                    className="input"
                    placeholder="10001"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="billing_address_country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  {...register('billing_address_country')}
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
              placeholder="Add notes about this account..."
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
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Account' : 'Update Account'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}