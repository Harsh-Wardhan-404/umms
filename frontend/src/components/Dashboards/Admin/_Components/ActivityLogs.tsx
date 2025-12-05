import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Clock, Package, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ActivityLog {
  id: string
  type: 'batch_created' | 'batch_completed' | 'batch_status_changed' | 'batch_cancelled'
  batchCode: string
  productName: string
  status: string
  timestamp: Date
  supervisor?: {
    firstName: string
    lastName: string
  }
}

const ActivityLogs = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get('/api/batches?limit=10')
        const batches = response.data.batches || []

        // Transform batches into activity logs
        const logs: ActivityLog[] = batches.map((batch: any) => {
          let type: ActivityLog['type'] = 'batch_created'
          if (batch.status === 'Completed') {
            type = 'batch_completed'
          } else if (batch.status === 'Cancelled') {
            type = 'batch_cancelled'
          } else if (batch.status !== 'Planned') {
            type = 'batch_status_changed'
          }

          return {
            id: batch.id,
            type,
            batchCode: batch.batchCode,
            productName: batch.productName,
            status: batch.status,
            timestamp: new Date(batch.createdAt || batch.startTime),
            supervisor: batch.supervisor,
          }
        })

        setActivities(logs)
      } catch (error) {
        console.error('Error fetching activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: ActivityLog['type'], status: string) => {
    switch (type) {
      case 'batch_completed':
        return <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
      case 'batch_cancelled':
        return <XCircle className="size-4 text-red-600 dark:text-red-400" />
      case 'batch_status_changed':
        if (status === 'InProgress') {
          return <Play className="size-4 text-blue-600 dark:text-blue-400" />
        }
        return <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400" />
      default:
        return <Package className="size-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getActivityMessage = (activity: ActivityLog) => {
    const supervisorName = activity.supervisor
      ? `${activity.supervisor.firstName} ${activity.supervisor.lastName}`
      : 'Unknown'

    switch (activity.type) {
      case 'batch_completed':
        return `Batch ${activity.batchCode} for ${activity.productName} was completed`
      case 'batch_cancelled':
        return `Batch ${activity.batchCode} for ${activity.productName} was cancelled`
      case 'batch_status_changed':
        return `Batch ${activity.batchCode} status changed to ${activity.status}`
      default:
        return `New batch ${activity.batchCode} created for ${activity.productName}`
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'InProgress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'QualityCheck':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold">Recent Activity</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading activities...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">Recent Activity</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Package className="size-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getActivityMessage(activity)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusBadgeColor(activity.status)}`}>
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.batchCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Clock className="size-3" />
                      <span>{formatTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogs

