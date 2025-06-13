import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit, Trash2, User, Phone, Mail, MapPin, Building2, Briefcase } from 'lucide-react'
import { useContact, useDeleteContact, useUpdateContact } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { ContactForm } from '../components/forms/ContactForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { InlineEditText, InlineEditSelect, InlineEditEmail } from '../components/ui/InlineEdit'
import { CONTACT_SALUTATIONS } from '../types'
import type { ContactModel } from '../types'
import { format } from 'date-fns'

export function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: contact, isLoading, error } = useContact(id!)
  const deleteContactMutation = useDeleteContact()
  const updateContactMutation = useUpdateContact({
    onSuccess: () => {
      toast.success('Contact updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update contact', {
        description: error.message,
      })
    },
  })

  const updateContactField = async (field: keyof ContactModel, value: any): Promise<void> => {
    await updateContactMutation.mutateAsync({
      id: id!,
      data: { [field]: value }
    })
  }

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteContactMutation.mutateAsync(id!)
      toast.success('Contact deleted successfully')
      navigate('/contacts')
    } catch (error) {
      toast.error('Failed to delete contact')
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

  const getSalutationLabel = (value: string) => {
    const salutation = CONTACT_SALUTATIONS.find(s => s.value === value)
    return salutation?.label || value || ''
  }

  const sections = contact ? [
    {
      title: 'Personal Information',
      fields: [
        { 
          label: 'Salutation', 
          value: (
            <InlineEditSelect
              value={contact.salutation_name}
              options={CONTACT_SALUTATIONS}
              onSave={(value) => updateContactField('salutation_name', value)}
              placeholder="Select salutation"
              allowEmpty
            />
          )
        },
        { 
          label: 'Full Name', 
          value: (
            <InlineEditText
              value={contact.full_name}
              onSave={(value) => updateContactField('full_name', value)}
              placeholder="Full name"
              required
            />
          )
        },
        { 
          label: 'Title', 
          value: (
            <InlineEditText
              value={contact.title}
              onSave={(value) => updateContactField('title', value)}
              placeholder="Job title"
            />
          )
        },
        { 
          label: 'Department', 
          value: (
            <InlineEditText
              value={contact.department}
              onSave={(value) => updateContactField('department', value)}
              placeholder="Department"
            />
          )
        },
        { 
          label: 'Organization', 
          value: contact.account_name ? (
            <Link to={`/organizations/${contact.organization}`} className="text-primary-600 hover:text-primary-800">
              {contact.account_name}
            </Link>
          ) : '-' 
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
              value={contact.email_address}
              onSave={(value) => updateContactField('email_address', value)}
              placeholder="Email address"
            />
          )
        },
        { 
          label: 'Phone', 
          value: (
            <InlineEditText
              value={contact.phone_number}
              onSave={(value) => updateContactField('phone_number', value)}
              placeholder="Phone number"
            />
          )
        },
        { 
          label: 'Mobile', 
          value: (
            <InlineEditText
              value={contact.phone_number_mobile}
              onSave={(value) => updateContactField('phone_number_mobile', value)}
              placeholder="Mobile number"
            />
          )
        },
        { 
          label: 'Home Phone', 
          value: (
            <InlineEditText
              value={contact.phone_number_home}
              onSave={(value) => updateContactField('phone_number_home', value)}
              placeholder="Home phone"
            />
          )
        },
        { 
          label: 'Fax', 
          value: (
            <InlineEditText
              value={contact.phone_number_fax}
              onSave={(value) => updateContactField('phone_number_fax', value)}
              placeholder="Fax number"
            />
          )
        },
        { 
          label: 'Do Not Call', 
          value: (
            <InlineEditSelect
              value={contact.do_not_call ? 'true' : 'false'}
              options={[
                { value: 'false', label: 'No' },
                { value: 'true', label: 'Yes' }
              ]}
              onSave={(value) => updateContactField('do_not_call', value === 'true')}
              placeholder="Select option"
            />
          )
        },
      ]
    },
    {
      title: 'Social Media',
      fields: [
        { 
          label: 'LinkedIn', 
          value: (
            <InlineEditText
              value={contact.linkedin}
              onSave={(value) => updateContactField('linkedin', value)}
              placeholder="LinkedIn URL"
            />
          )
        },
        { 
          label: 'Twitter', 
          value: (
            <InlineEditText
              value={contact.twitter}
              onSave={(value) => updateContactField('twitter', value)}
              placeholder="Twitter handle"
            />
          )
        },
        { 
          label: 'Facebook', 
          value: (
            <InlineEditText
              value={contact.facebook}
              onSave={(value) => updateContactField('facebook', value)}
              placeholder="Facebook URL"
            />
          )
        },
      ]
    },
    {
      title: 'Mailing Address',
      fields: [
        { 
          label: 'Street', 
          value: (
            <InlineEditText
              value={contact.mailing_address_street}
              onSave={(value) => updateContactField('mailing_address_street', value)}
              placeholder="Street address"
            />
          )
        },
        { 
          label: 'City', 
          value: (
            <InlineEditText
              value={contact.mailing_address_city}
              onSave={(value) => updateContactField('mailing_address_city', value)}
              placeholder="City"
            />
          )
        },
        { 
          label: 'State', 
          value: (
            <InlineEditText
              value={contact.mailing_address_state}
              onSave={(value) => updateContactField('mailing_address_state', value)}
              placeholder="State"
            />
          )
        },
        { 
          label: 'Postal Code', 
          value: (
            <InlineEditText
              value={contact.mailing_address_postal_code}
              onSave={(value) => updateContactField('mailing_address_postal_code', value)}
              placeholder="Postal code"
            />
          )
        },
        { 
          label: 'Country', 
          value: (
            <InlineEditText
              value={contact.mailing_address_country}
              onSave={(value) => updateContactField('mailing_address_country', value)}
              placeholder="Country"
            />
          )
        },
      ]
    },
    {
      title: 'Other Address',
      fields: [
        { 
          label: 'Street', 
          value: (
            <InlineEditText
              value={contact.other_address_street}
              onSave={(value) => updateContactField('other_address_street', value)}
              placeholder="Street address"
            />
          )
        },
        { 
          label: 'City', 
          value: (
            <InlineEditText
              value={contact.other_address_city}
              onSave={(value) => updateContactField('other_address_city', value)}
              placeholder="City"
            />
          )
        },
        { 
          label: 'State', 
          value: (
            <InlineEditText
              value={contact.other_address_state}
              onSave={(value) => updateContactField('other_address_state', value)}
              placeholder="State"
            />
          )
        },
        { 
          label: 'Postal Code', 
          value: (
            <InlineEditText
              value={contact.other_address_postal_code}
              onSave={(value) => updateContactField('other_address_postal_code', value)}
              placeholder="Postal code"
            />
          )
        },
        { 
          label: 'Country', 
          value: (
            <InlineEditText
              value={contact.other_address_country}
              onSave={(value) => updateContactField('other_address_country', value)}
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
              value={contact.description}
              onSave={(value) => updateContactField('description', value)}
              placeholder="Description"
              multiline
            />
          ),
          colSpan: 3 
        },
      ]
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Created By', value: contact.created_by_name || '-' },
        { label: 'Created At', value: formatDate(contact.created_at) },
        { label: 'Modified By', value: contact.modified_by_name || '-' },
        { label: 'Modified At', value: formatDate(contact.modified_at) },
        { label: 'Assigned To', value: contact.assigned_user_name || '-' },
        { label: 'Team', value: contact.assigned_team || '-' },
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
        title={contact?.full_name || 'Contact Details'}
        subtitle={`Contact #${id?.slice(0, 8)}`}
        sections={sections}
        actions={actions}
        isLoading={isLoading}
        error={error?.message}
      />

      {/* Edit Modal */}
      {isEditOpen && contact && (
        <ContactForm
          mode="edit"
          contact={contact}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contact?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteContactMutation.isPending}
      />
    </>
  )
}