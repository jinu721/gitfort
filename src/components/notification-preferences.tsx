'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface NotificationPreferences {
  streakRiskNotifications: boolean
  securityAlerts: boolean
  buildFailureNotifications: boolean
  weeklyReports: boolean
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never'
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
}

export function NotificationPreferences() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPreferences()
    }
  }, [session])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notification-preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return

    setSaving(true)
    try {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Failed to update preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-400">Failed to load notification preferences.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-fjalla-one)' }}>
        Notification Preferences
      </h3>

      <div className="space-y-6">
        {/* Notification Types */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Notification Types</h4>
          <div className="space-y-3">
            {[
              { key: 'streakRiskNotifications', label: 'Streak Risk Alerts', description: 'Get notified when your contribution streak is at risk' },
              { key: 'securityAlerts', label: 'Security Alerts', description: 'Receive notifications about security vulnerabilities' },
              { key: 'buildFailureNotifications', label: 'Build Failures', description: 'Get notified when CI/CD builds fail' },
              { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly summary reports' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">{label}</label>
                  <p className="text-sm text-gray-400">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences[key as keyof NotificationPreferences] as boolean}
                    onChange={(e) => updatePreferences({ [key]: e.target.checked })}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Email Frequency */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Email Frequency</h4>
          <select
            value={preferences.emailFrequency}
            onChange={(e) => updatePreferences({ emailFrequency: e.target.value as any })}
            disabled={saving}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
            <option value="never">Never</option>
          </select>
        </div>

        {/* Quiet Hours */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Quiet Hours</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-white">Enable Quiet Hours</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) => updatePreferences({ 
                    quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                  })}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => updatePreferences({
                      quietHours: { ...preferences.quietHours, startTime: e.target.value }
                    })}
                    disabled={saving}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => updatePreferences({
                      quietHours: { ...preferences.quietHours, endTime: e.target.value }
                    })}
                    disabled={saving}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {saving && (
          <div className="text-center">
            <div className="inline-flex items-center text-emerald-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-2"></div>
              Saving preferences...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}