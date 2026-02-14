import mongoose, { Schema, Document } from 'mongoose'

export interface INotificationPreference extends Document {
  userId: string
  streakRiskNotifications: boolean
  securityAlerts: boolean
  buildFailureNotifications: boolean
  weeklyReports: boolean
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never'
  quietHours: {
    enabled: boolean
    startTime: string // HH:MM format
    endTime: string   // HH:MM format
    timezone: string
  }
  createdAt: Date
  updatedAt: Date
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  streakRiskNotifications: {
    type: Boolean,
    default: true
  },
  securityAlerts: {
    type: Boolean,
    default: true
  },
  buildFailureNotifications: {
    type: Boolean,
    default: true
  },
  weeklyReports: {
    type: Boolean,
    default: false
  },
  emailFrequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'never'],
    default: 'immediate'
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00',
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      default: '08:00',
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true,
  collection: 'notification_preferences'
})

export const NotificationPreference = mongoose.models.NotificationPreference || 
  mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema)