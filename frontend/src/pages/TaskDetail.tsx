import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useTask, useDeleteTask, useUpdateTask } from '../hooks/useApi'
import { DetailView } from '../components/DetailView'
import { TaskForm } from '../components/forms/TaskForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToastContext } from '../context/ToastContext'
import { InlineEditText, InlineEditSelect } from '../components/ui/InlineEdit'
import { TASK_STATUSES, TASK_PRIORITIES } from '../types'
import type { TaskModel } from '../types'
import { format } from 'date-fns'

export function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToastContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: task, isLoading, error } = useTask(id!)
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask({
    onSuccess: () => {
      toast.success('Task updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update task', {
        description: error.message,
      })
    },
  })

  const updateTaskField = async (field: keyof TaskModel, value: any): Promise<void> => {
    await updateTaskMutation.mutateAsync({
      id: id!,
      data: { [field]: value }
    })
  }

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(id!)
      toast.success('Task deleted successfully')
      navigate('/tasks')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusObj = TASK_STATUSES.find(s => s.value === status)
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      started: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      deferred: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusObj?.label || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityObj = TASK_PRIORITIES.find(p => p.value === priority)
    const colors = {
      low: 'bg-green-100 text-green-800',
      normal: 'bg-gray-100 text-gray-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {priorityObj?.label || priority}
      </span>
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'PPp')
    } catch {
      return date
    }
  }

  const sections = task ? [
    {
      title: 'General Information',
      fields: [
        { 
          label: 'Task Name', 
          value: (
            <InlineEditText
              value={task.name}
              onSave={(value) => updateTaskField('name', value)}
              placeholder="Task name"
              required
            />
          )
        },
        { 
          label: 'Status', 
          value: (
            <InlineEditSelect
              value={task.status}
              options={TASK_STATUSES}
              onSave={(value) => updateTaskField('status', value)}
              placeholder="Select status"
            />
          )
        },
        { 
          label: 'Priority', 
          value: (
            <InlineEditSelect
              value={task.priority}
              options={TASK_PRIORITIES}
              onSave={(value) => updateTaskField('priority', value)}
              placeholder="Select priority"
            />
          )
        },
        { 
          label: 'Start Date', 
          value: (
            <InlineEditText
              value={task.date_start}
              onSave={(value) => updateTaskField('date_start', value)}
              placeholder="YYYY-MM-DD HH:MM:SS"
            />
          )
        },
        { 
          label: 'Due Date', 
          value: (
            <InlineEditText
              value={task.date_end}
              onSave={(value) => updateTaskField('date_end', value)}
              placeholder="YYYY-MM-DD HH:MM:SS"
            />
          )
        },
        { label: 'Assigned To', value: task.assigned_user_name || '-' },
      ]
    },
    {
      title: 'Details',
      fields: [
        { 
          label: 'Description', 
          value: (
            <InlineEditText
              value={task.description}
              onSave={(value) => updateTaskField('description', value)}
              placeholder="Description"
              multiline
            />
          ),
          colSpan: 3 
        },
      ]
    },
    {
      title: 'Related To',
      fields: [
        { label: 'Type', value: task.parent_type || '-' },
        { label: 'Name', value: task.parent_name || '-' },
      ]
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Created By', value: task.created_by_name || '-' },
        { label: 'Created At', value: formatDate(task.created_at) },
        { label: 'Modified By', value: task.modified_by_name || '-' },
        { label: 'Modified At', value: formatDate(task.modified_at) },
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
        title={task?.name || 'Task Details'}
        subtitle={`Task #${id?.slice(0, 8)}`}
        sections={sections}
        actions={actions}
        isLoading={isLoading}
        error={error?.message}
      />

      {/* Edit Modal */}
      {isEditOpen && task && (
        <TaskForm
          mode="edit"
          task={task}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  )
}