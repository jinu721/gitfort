import { database } from './database'
import { NotificationPreference, INotificationPreference } from './models/notification-preference'

export interface NotificationPreferenceData {
  userId: string
  streakRiskNotifications?: boolean
  securityAlerts?: boolean
  buildFailureNotifications?: boolean
  weeklyReports?: boolean
  emailFrequency?: 'immediate' | 'daily' | 'weekly' | 'never'
  quietHours?: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
}

export class NotificationPreferenceService {
  async getPreferences(userId: string): Promise<INotificationPreference | null> {
    await database.connect()
    return NotificationPreference.findOne({ userId })
  }

  async createDefaultPreferences(userId: string): Promise<INotificationPreference> {
    await database.connect()
    
    const defaultPreferences = new NotificationPreference({
      userId,
      streakRiskNotifications: true,
      securityAlerts: true,
      buildFailureNotifications: true,
      weeklyReports: false,
      emailFrequency: 'immediate',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      }
    })

    return defaultPreferences.save()
  }

  async updatePreferences(
    userId: string, 
    updates: Partial<NotificationPreferenceData>
  ): Promise<INotificationPreference | null> {
    await database.connect()
    
    return NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    )
  }

  async shouldSendNotification(
    userId: string, 
    notificationType: keyof Pick<INotificationPreference, 'streakRiskNotifications' | 'securityAlerts' | 'buildFailureNotifications' | 'weeklyReports'>
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences) {
      // If no preferences exist, create defaults and allow notification
      await this.createDefaultPreferences(userId)
      return true
    }

    // Check if notification type is enabled
    if (!preferences[notificationType]) {
      return false
    }

    // Check email frequency
    if (preferences.emailFrequency === 'never') {
      return false
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date()
      const userTimezone = preferences.quietHours.timezone
      
      // Convert current time to user's timezone
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).format(now)

      if (this.isInQuietHours(userTime, preferences.quietHours.startTime, preferences.quietHours.endTime)) {
        return false
      }
    }

    return true
  }

  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime)
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)

    if (start <= end) {
      // Same day quiet hours (e.g., 22:00 to 23:59)
      return current >= start && current <= end
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return current >= start || current <= end
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  async deletePreferences(userId: string): Promise<void> {
    await database.connect()
    await NotificationPreference.findOneAndDelete({ userId })
  }
}

export const notificationPreferenceService = new NotificationPreferenceService()