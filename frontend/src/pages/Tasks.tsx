import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Edit, Trash2, CheckSquare, Clock, AlertCircle, Building2, User, DollarSign } from 'lucide-react'
import { useTasks, useDeleteTask, useAccounts, useContacts, useOpportunities } from '../hooks/useApi'
import type { TaskModel, TaskFilters } from '../types'
import { TASK_STATUSES, TASK_PRIORITIES } from '../types'
import { TaskForm } from '../components/forms/TaskForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { useToastContext } from '../context/ToastContext'

export function Tasks() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<TaskModel | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; task?: TaskModel }>({ isOpen: false })
  const [sorting, setSorting] = useState<{ field: string | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null,
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const toast = useToastContext()
  
  // Combine search term with filters and sorting
  const queryFilters = {
    ...filters,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(sorting.field && sorting.direction && { ordering: `${sorting.direction === 'desc' ? '-' : ''}${sorting.field}` }),
  }
  
  const { data, isLoading, error, refetch } = useTasks(queryFilters)
  const { data: accountsData } = useAccounts()
  const { data: contactsData } = useContacts()
  const { data: opportunitiesData } = useOpportunities()
  const deleteTaskMutation = useDeleteTask({
    onSuccess: () => {
      toast.success('Task deleted successfully')
      setDeleteDialog({ isOpen: false })
    },
    onError: (error) => {
      toast.error('Failed to delete task', {
        description: error.message,
      })
    },
  })

  const getRelatedName = (parentType: string | null, parentId: string | null) => {
    if (!parentType || !parentId) return 'No relation'
    
    switch (parentType) {
      case 'Account':
        const account = accountsData?.results?.find(acc => acc.id === parentId)
        return account?.name || 'Unknown Account'
      case 'Contact':
        const contact = contactsData?.results?.find(cont => cont.id === parentId)
        return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact'
      case 'Opportunity':
        const opportunity = opportunitiesData?.results?.find(opp => opp.id === parentId)
        return opportunity?.name || 'Unknown Opportunity'
      default:
        return 'Unknown'
    }
  }

  const getRelatedIcon = (parentType: string | null) => {
    switch (parentType) {
      case 'Account':
        return <Building2 className="w-4 h-4 text-gray-400 mr-1" />
      case 'Contact':
        return <User className="w-4 h-4 text-gray-400 mr-1" />
      case 'Opportunity':
        return <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'started': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'canceled': return 'bg-red-100 text-red-800'
      case 'deferred': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateTask = () => {
    setFormMode('create')
    setSelectedTask(undefined)
    setIsFormOpen(true)
  }

  const handleEditTask = (task: TaskModel) => {
    setFormMode('edit')
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleDeleteTask = (task: TaskModel) => {
    setDeleteDialog({ isOpen: true, task })
  }

  const confirmDelete = () => {
    if (deleteDialog.task) {
      deleteTaskMutation.mutate(deleteDialog.task.id)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSorting({ field, direction })
  }

  // Calculate task metrics
  const tasks = data?.results || []
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const overdueTasks = tasks.filter(task => isOverdue(task.date_due)).length
  const todaysTasks = tasks.filter(task => {
    if (!task.date_due) return false
    const today = new Date().toDateString()
    return new Date(task.date_due).toDateString() === today
  }).length

  const columns: Column<TaskModel>[] = [
    {
      key: 'name',
      header: 'Task',
      sortable: true,
      render: (value, task) => (
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            task.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {task.status === 'completed' ? (
              <CheckSquare className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">{task.name}</div>
            {task.parent_type && (
              <div className="flex items-center text-sm text-gray-500">
                {getRelatedIcon(task.parent_type)}
                <span>{task.parent_type}: {getRelatedName(task.parent_type, task.parent_id)}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        const statusLabel = TASK_STATUSES.find(s => s.value === value)?.label || value
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
            {statusLabel}
          </span>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">-</span>
        const priorityLabel = TASK_PRIORITIES.find(p => p.value === value)?.label || value
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(value)}`}>
            {priorityLabel}
          </span>
        )
      },
    },
    {
      key: 'date_due',
      header: 'Due Date',
      sortable: true,
      render: (value, task) => {
        if (!value) return <span className="text-gray-400">-</span>
        const date = new Date(value)
        const overdue = isOverdue(value)
        return (
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-1" />
            <div>
              <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                {date.toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500">
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {overdue && task.status !== 'completed' && (
              <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
            )}
          </div>
        )
      },
    },
    {
      key: 'date_start',
      header: 'Start Date',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>
        const date = new Date(value)
        return (
          <div>
            <div className="text-sm text-gray-900">{date.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, task) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="text-primary-600 hover:text-primary-900 p-1"
            title="Edit task"
            onClick={(e) => {
              e.stopPropagation()
              handleEditTask(task)
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete task"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteTask(task)
            }}
            disabled={deleteTaskMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const emptyState = (
    <div className="text-center py-12">
      <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first task.'}
      </p>
      <button className="btn-primary px-6 py-2" onClick={handleCreateTask}>
        <Plus className="w-4 h-4 mr-2" />
        Create Task
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your tasks and track progress
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handleCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-lg font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-900">{completedTasks}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-lg font-semibold text-gray-900">{overdueTasks}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Due Today</p>
              <p className="text-lg font-semibold text-gray-900">{todaysTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="input pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input min-w-32"
            >
              <option value="all">All Status</option>
              {TASK_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <button className="btn-outline px-4 py-2">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={tasks}
        columns={columns}
        loading={isLoading}
        error={error?.message}
        emptyState={emptyState}
        sorting={{
          field: sorting.field,
          direction: sorting.direction,
          onSortChange: handleSortChange,
        }}
        onRowClick={(task) => {
          navigate(`/tasks/${task.id}`)
        }}
      />

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        task={selectedTask}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteDialog.task?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteTaskMutation.isPending}
      />
    </div>
  )
}