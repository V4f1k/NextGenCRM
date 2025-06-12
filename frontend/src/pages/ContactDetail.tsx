import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit, Trash2, User, Phone, Mail, MapPin, Building2, Briefcase } from 'lucide-react'
import { useContact, useDeleteContact } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { ContactForm } from '../components/forms/ContactForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { CONTACT_SALUTATIONS } from '../types'
import { format } from 'date-fns'

export function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: contact, isLoading, error } = useContact(id!)
  const deleteContactMutation = useDeleteContact()

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteContactMutation.mutateAsync(id!)
      showToast('success', 'Contact deleted successfully')
      navigate('/contacts')
    } catch (error) {
      showToast('error', 'Failed to delete contact')
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
        { label: 'Full Name', value: `${getSalutationLabel(contact.salutation_name || '')} ${contact.full_name}`.trim() || '-' },
        { label: 'Title', value: contact.title || '-' },
        { label: 'Department', value: contact.department || '-' },
        { label: 'Account', value: contact.account_name ? (
          <Link to={`/accounts/${contact.account}`} className="text-primary-600 hover:text-primary-800">
            {contact.account_name}
          </Link>
        ) : '-' },
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Email', value: contact.email_address ? (
          <a href={`mailto:${contact.email_address}`} className="text-primary-600 hover:text-primary-800">
            {contact.email_address}
          </a>
        ) : '-' },
        { label: 'Phone', value: contact.phone_number || '-' },
        { label: 'Mobile', value: contact.phone_number_mobile || '-' },
        { label: 'Home Phone', value: contact.phone_number_home || '-' },
        { label: 'Fax', value: contact.phone_number_fax || '-' },
        { label: 'Do Not Call', value: contact.do_not_call ? 'Yes' : 'No' },
      ]
    },
    {
      title: 'Social Media',
      fields: [
        { label: 'LinkedIn', value: contact.linkedin ? (
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
            {contact.linkedin}
          </a>
        ) : '-' },
        { label: 'Twitter', value: contact.twitter ? (
          <a href={`https://twitter.com/${contact.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
            {contact.twitter}
          </a>
        ) : '-' },
        { label: 'Facebook', value: contact.facebook || '-' },
      ]
    },
    {
      title: 'Addresses',
      fields: [
        { 
          label: 'Mailing Address', 
          value: [
            contact.mailing_address_street,
            contact.mailing_address_city,
            contact.mailing_address_state,
            contact.mailing_address_postal_code,
            contact.mailing_address_country
          ].filter(Boolean).join(', ') || '-',
          colSpan: 3
        },
        { 
          label: 'Other Address', 
          value: [
            contact.other_address_street,
            contact.other_address_city,
            contact.other_address_state,
            contact.other_address_postal_code,
            contact.other_address_country
          ].filter(Boolean).join(', ') || '-',
          colSpan: 3
        },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { label: 'Description', value: contact.description || '-', colSpan: 3 },
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