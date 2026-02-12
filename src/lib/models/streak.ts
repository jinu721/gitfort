import mongoose, { Schema, Document } from 'mongoose'

export interface IContributionDay {
  date: string
  contributionCount: number
}

export interface IStreak extends Document {
  userId: string
  currentStreak: number
  longestStreak: number
  lastContributionDate: Date
  contributionData: IContributionDay[]
  calculatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ContributionDaySchema = new Schema<IContributionDay>({
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  contributionCount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false })

const StreakSchema = new Schema<IStreak>({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  currentStreak: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  longestStreak: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastContributionDate: {
    type: Date,
    required: true
  },
  contributionData: {
    type: [ContributionDaySchema],
    required: true,
    default: []
  },
  calculatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'streaks'
})

StreakSchema.index({ userId: 1 }, { unique: true })
StreakSchema.index({ calculatedAt: 1 })
StreakSchema.index({ currentStreak: -1 })
StreakSchema.index({ longestStreak: -1 })

export const Streak = mongoose.models.Streak || mongoose.model<IStreak>('Streak', StreakSchema)