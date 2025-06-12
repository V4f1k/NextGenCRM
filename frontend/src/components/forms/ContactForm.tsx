import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ContactModel, CONTACT_SALUTATIONS } from '../../types'
import { Modal, ModalBody, ModalFooter } from '../ui/Modal'
import { useCreateContact, useUpdateContact, useAccounts } from '../../hooks/useApi'
import { useToastContext } from '../../context/ToastContext'
import { useEffect } from 'react'
import clsx from 'clsx'

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  salutation: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  email_address: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone_number: z.string().optional(),
  mobile_phone: z.string().optional(),
  account_id: z.string().optional(),
  do_not_call: z.boolean().default(false),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  description: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  isOpen: boolean
  onClose: () => void
  contact?: ContactModel
  mode: 'create' | 'edit'
  preselectedAccountId?: string
}

export function ContactForm({ isOpen, onClose, contact, mode, preselectedAccountId }: ContactFormProps) {
  const toast = useToastContext()
  
  const createContactMutation = useCreateContact({
    onSuccess: (data) => {
      toast.success('Contact created successfully', {
        description: `${data.first_name} ${data.last_name} has been added to your CRM`,
      })
      onClose()
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create contact', {
        description: error.message,
      })
    },
  })

  const updateContactMutation = useUpdateContact({
    onSuccess: (data) => {
      toast.success('Contact updated successfully', {
        description: `${data.first_name} ${data.last_name} has been updated`,
      })
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to update contact', {
        description: error.message,
      })
    },
  })

  // Fetch accounts for dropdown
  const { data: accountsData } = useAccounts()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      do_not_call: false,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && contact) {
      const formData: Partial<ContactFormData> = {
        first_name: contact.first_name,
        last_name: contact.last_name,
        salutation: contact.salutation || '',
        title: contact.title || '',
        department: contact.department || '',
        email_address: contact.email_address || '',
        phone_number: contact.phone_number || '',
        mobile_phone: contact.mobile_phone || '',
        account_id: contact.account_id || '',
        do_not_call: contact.do_not_call || false,
        address_street: contact.address_street || '',
        address_city: contact.address_city || '',
        address_state: contact.address_state || '',
        address_postal_code: contact.address_postal_code || '',
        address_country: contact.address_country || '',
        description: contact.description || '',
      }

      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof ContactFormData, value)
      })
    } else if (mode === 'create') {
      reset()
      if (preselectedAccountId) {
        setValue('account_id', preselectedAccountId)
      }
    }
  }, [contact, mode, setValue, reset, preselectedAccountId])

  const onSubmit = (data: ContactFormData) => {
    const cleanedData = {
      ...data,
      email_address: data.email_address || undefined,
      account_id: data.account_id || undefined,
    }

    if (mode === 'create') {
      createContactMutation.mutate(cleanedData)
    } else if (mode === 'edit' && contact) {
      updateContactMutation.mutate({ 
        id: contact.id, 
        data: cleanedData 
      })
    }
  }

  const isLoading = createContactMutation.isPending || updateContactMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Contact' : 'Edit Contact'}
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
                <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Account
                </label>
                <select {...register('account_id')} className="input">
                  <option value="">Select account</option>
                  {accountsData?.results?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
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
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  {...register('department')}
                  type="text"
                  className="input"
                  placeholder="Sales, Marketing, IT..."
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
                  placeholder="contact@example.com"
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
              placeholder="Add notes about this contact..."
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
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Update Contact'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}