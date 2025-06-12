import { Building2, Users, UserPlus, Target, AlertCircle, Loader2, Clock } from 'lucide-react'
import { useDashboardStats, useRecentActivities } from '../hooks/useApi'
import { formatDistanceToNow } from 'date-fns'

const getStatColor = (type: string) => {
  switch (type) {
    case 'accounts': return 'bg-blue-500'
    case 'contacts': return 'bg-green-500'
    case 'leads': return 'bg-yellow-500'
    case 'opportunities': return 'bg-purple-500'
    case 'tasks': return 'bg-indigo-500'
    case 'calls': return 'bg-pink-500'
    default: return 'bg-gray-500'
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'Account': return 'bg-blue-400'
    case 'Contact': return 'bg-green-400'
    case 'Lead': return 'bg-yellow-400'
    case 'Opportunity': return 'bg-purple-400'
    case 'Task': return 'bg-indigo-400'
    case 'Call': return 'bg-pink-400'
    default: return 'bg-gray-400'
  }
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useRecentActivities(10)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to NextGenCRM - Your modern CRM solution
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            </div>
          ))
        ) : statsError ? (
          <div className="col-span-full card p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load dashboard statistics</p>
          </div>
        ) : stats ? (
          <>
            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${getStatColor('accounts')}`}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Accounts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.accounts.total}</p>
                  <p className="text-xs text-green-600">+{stats.accounts.recent} this month</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${getStatColor('contacts')}`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.contacts.total}</p>
                  <p className="text-xs text-green-600">+{stats.contacts.recent} this month</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${getStatColor('leads')}`}>
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Leads</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.leads.new + stats.leads.qualified}</p>
                  <p className="text-xs text-blue-600">{stats.leads.converted} converted</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${getStatColor('opportunities')}`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Open Opportunities</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.opportunities.open}</p>
                  <p className="text-xs text-green-600">{formatCurrency(stats.opportunities.total_amount)}</p>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${getStatColor('tasks')}`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.tasks.pending + stats.tasks.in_progress}</p>
                  <p className="text-xs text-red-600">{stats.tasks.overdue} overdue</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md bg-emerald-500`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Won Deals</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.opportunities.won}</p>
                  <p className="text-xs text-green-600">{formatCurrency(stats.opportunities.won_amount)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md bg-teal-500`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.tasks.completed}</p>
                  <p className="text-xs text-blue-600">{stats.tasks.total} total</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${getStatColor('calls')}`}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Calls Held</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.calls.held}</p>
                  <p className="text-xs text-green-600">{stats.calls.planned} planned</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : activitiesError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">Failed to load recent activities</p>
              </div>
            ) : activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                  <p className="text-sm text-gray-600 flex-1">
                    New {activity.type.toLowerCase()} "{activity.name}" created
                    {activity.created_by && (
                      <span className="text-gray-500"> by {activity.created_by}</span>
                    )}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No recent activities</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="btn-primary w-full text-left px-4 py-2">
              Create New Account
            </button>
            <button className="btn-secondary w-full text-left px-4 py-2">
              Add Contact
            </button>
            <button className="btn-outline w-full text-left px-4 py-2">
              Schedule Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}