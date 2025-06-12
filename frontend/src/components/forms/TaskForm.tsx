import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { TaskModel } from '../../types'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../types'
import { Modal, ModalBody, ModalFooter } from '../ui/Modal'
import { useCreateTask, useUpdateTask, useOrganizations, useContacts, useOpportunities } from '../../hooks/useApi'
import { useToastContext } from '../../context/ToastContext'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  status: z.string().optional(),
  priority: z.string().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  parent_type: z.string().optional(),
  parent_id: z.string().optional(),
  description: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  task?: TaskModel
  mode: 'create' | 'edit'
  preselectedParentType?: string
  preselectedParentId?: string
}

export function TaskForm({ 
  isOpen, 
  onClose, 
  task, 
  mode, 
  preselectedParentType,
  preselectedParentId 
}: TaskFormProps) {
  const toast = useToastContext()
  const [selectedParentType, setSelectedParentType] = useState<string>('')
  
  const createTaskMutation = useCreateTask({
    onSuccess: (data) => {
      toast.success('Task created successfully', {
        description: `${data.name} has been added to your tasks`,
      })
      onClose()
      reset()
    },
    onError: (error) => {
      toast.error('Failed to create task', {
        description: error.message,
      })
    },
  })

  const updateTaskMutation = useUpdateTask({
    onSuccess: (data) => {
      toast.success('Task updated successfully', {
        description: `${data.name} has been updated`,
      })
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to update task', {
        description: error.message,
      })
    },
  })

  // Fetch related entities for parent selection
  const { data: organizationsData } = useOrganizations()
  const { data: contactsData } = useContacts()
  const { data: opportunitiesData } = useOpportunities()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'not_started',
      priority: 'medium',
    },
  })

  const parentType = watch('parent_type')
  const currentStatus = watch('status')
  const currentPriority = watch('priority')

  // Update selected parent type when form value changes
  useEffect(() => {
    setSelectedParentType(parentType || '')
  }, [parentType])

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && task) {
      const formData: Partial<TaskFormData> = {
        name: task.name,
        status: task.status || 'not_started',
        priority: task.priority || 'medium',
        date_start: task.date_start ? new Date(task.date_start).toISOString().slice(0, 16) : '',
        date_end: task.date_end ? new Date(task.date_end).toISOString().slice(0, 16) : '',
        parent_type: task.parent_type || '',
        parent_id: task.parent_id || '',
        description: task.description || '',
      }

      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof TaskFormData, value)
      })
      
      setSelectedParentType(task.parent_type || '')
    } else if (mode === 'create') {
      reset()
      if (preselectedParentType && preselectedParentId) {
        setValue('parent_type', preselectedParentType)
        setValue('parent_id', preselectedParentId)
        setSelectedParentType(preselectedParentType)
      }
    }
  }, [task, mode, setValue, reset, preselectedParentType, preselectedParentId])

  const onSubmit = (data: TaskFormData) => {
    const cleanedData = {
      ...data,
      parent_type: data.parent_type || undefined,
      parent_id: data.parent_id || undefined,
      date_start: data.date_start || undefined,
      date_end: data.date_end || undefined,
    }

    if (mode === 'create') {
      createTaskMutation.mutate(cleanedData)
    } else if (mode === 'edit' && task) {
      updateTaskMutation.mutate({ 
        id: task.id, 
        data: cleanedData 
      })
    }
  }

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'started': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'canceled': return 'bg-red-100 text-red-800'
      case 'deferred': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getParentOptions = () => {
    switch (selectedParentType) {
      case 'Organization':
        return organizationsData?.results?.map(account => ({
          id: organization.id,
          name: organization.name
        })) || []
      case 'Contact':
        return contactsData?.results?.map(contact => ({
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`
        })) || []
      case 'Opportunity':
        return opportunitiesData?.results?.map(opportunity => ({
          id: opportunity.id,
          name: opportunity.name
        })) || []
      default:
        return []
    }
  }

  const formatDateTime = (date: string) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Task' : 'Edit Task'}
      size="lg"
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
                  Task Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={clsx('input', errors.name && 'border-red-300')}
                  placeholder="Enter task name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <select {...register('status')} className="input flex-1">
                    {TASK_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {currentStatus && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
                      {TASK_STATUSES.find(s => s.value === currentStatus)?.label}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <select {...register('priority')} className="input flex-1">
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                  {currentPriority && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(currentPriority)}`}>
                      {TASK_PRIORITIES.find(p => p.value === currentPriority)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Scheduling</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_start" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  {...register('date_start')}
                  type="datetime-local"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="date_end" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date & Time
                </label>
                <input
                  {...register('date_end')}
                  type="datetime-local"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Related To */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Related To</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parent_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Related Type
                </label>
                <select 
                  {...register('parent_type')} 
                  className="input"
                  onChange={(e) => {
                    setValue('parent_type', e.target.value)
                    setValue('parent_id', '') // Clear parent_id when type changes
                    setSelectedParentType(e.target.value)
                  }}
                >
                  <option value="">Select type</option>
                  <option value="Organization">Organization</option>
                  <option value="Contact">Contact</option>
                  <option value="Opportunity">Opportunity</option>
                </select>
              </div>

              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Related Record
                </label>
                <select {...register('parent_id')} className="input" disabled={!selectedParentType}>
                  <option value="">Select record</option>
                  {getParentOptions().map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {selectedParentType && getParentOptions().length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">No {selectedParentType.toLowerCase()}s found</p>
                )}
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
              placeholder="Add task details and notes..."
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
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}