import { useState, useEffect } from 'react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services'
import type { Notification } from '../../types'
import { LoadingSpinner, EmptyState } from '../../components/ui/Common'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getNotifications()
      .then(setNotifications)
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  if (loading) return <LoadingSpinner text="Loading notifications..." />

  const typeConfig: Record<string, { gradient: string; icon: string }> = {
    enrollment: { gradient: 'from-blue-400 to-blue-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    material: { gradient: 'from-purple-400 to-purple-600', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    offer_letter: { gradient: 'from-emerald-400 to-emerald-600', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    certificate: { gradient: 'from-amber-400 to-amber-600', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notifications</h1>
          <p className="section-subtitle">Stay updated with your internship progress</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm">
            <CheckIcon className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      <div className="premium-card overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title="No notifications"
            message="You're all caught up! Notifications will appear here."
          />
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800/30">
            {notifications.map((n) => {
              const cfg = typeConfig[n.notification_type || ''] || { gradient: 'from-surface-400 to-surface-600', icon: '' }
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-surface-50 dark:hover:bg-surface-800/20'}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <BellIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-medium ${!n.is_read ? 'text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-400'}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-sm text-surface-500 dark:text-surface-500 mt-0.5">{n.message}</p>
                        )}
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="p-1.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex-shrink-0"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {n.created_at && (
                      <p className="text-xs text-surface-400 mt-1.5">
                        {new Date(n.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
