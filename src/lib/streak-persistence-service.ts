import { Streak, IStreak, IContributionDay } from './models/streak'
import { database } from './database'

export interface StreakPersistenceResult {
  success: boolean
  data?: IStreak
  error?: string
}

export interface StreakQueryOptions {
  includeContributions?: boolean
  sortBy?: 'calculatedAt' | 'currentStreak' | 'longestStreak'
  sortOrder?: 'asc' | 'desc'
}

export class StreakPersistenceService {
  public async saveStreak(
    userId: string,
    currentStreak: number,
    longestStreak: number,
    lastContributionDate: Date,
    contributionData: IContributionDay[]
  ): Promise<StreakPersistenceResult> {
    try {
      await database.connect()

      const streakDocument = {
        userId,
        currentStreak,
        longestStreak,
        lastContributionDate,
        contributionData,
        calculatedAt: new Date()
      }

      const result = await Streak.findOneAndUpdate(
        { userId },
        streakDocument,
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      ).exec()

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save streak data'
      }
    }
  }

  public async getStreak(userId: string, options: StreakQueryOptions = {}): Promise<StreakPersistenceResult> {
    try {
      await database.connect()

      let query = Streak.findOne({ userId })

      if (!options.includeContributions) {
        query = query.select('-contributionData')
      }

      const result = await query.exec()

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve streak data'
      }
    }
  }

  public async updateStreakStats(
    userId: string,
    currentStreak: number,
    longestStreak: number,
    lastContributionDate: Date
  ): Promise<StreakPersistenceResult> {
    try {
      await database.connect()

      const result = await Streak.findOneAndUpdate(
        { userId },
        {
          currentStreak,
          longestStreak,
          lastContributionDate,
          calculatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true
        }
      ).exec()

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update streak stats'
      }
    }
  }

  public async updateContributionData(
    userId: string,
    contributionData: IContributionDay[]
  ): Promise<StreakPersistenceResult> {
    try {
      await database.connect()

      const result = await Streak.findOneAndUpdate(
        { userId },
        {
          contributionData,
          calculatedAt: new Date()
        },
        { 
          new: true,
          runValidators: true
        }
      ).exec()

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contribution data'
      }
    }
  }

  public async deleteStreak(userId: string): Promise<StreakPersistenceResult> {
    try {
      await database.connect()

      const result = await Streak.findOneAndDelete({ userId }).exec()

      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete streak data'
      }
    }
  }

  public async getStreakHistory(
    userId: string,
    days: number = 30
  ): Promise<{ success: boolean; data?: IContributionDay[]; error?: string }> {
    try {
      await database.connect()

      const streak = await Streak.findOne({ userId }).select('contributionData').exec()

      if (!streak || !streak.contributionData) {
        return {
          success: true,
          data: []
        }
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffString = cutoffDate.toISOString().split('T')[0]

      const filteredData = streak.contributionData
        .filter(contribution => contribution.date >= cutoffString)
        .sort((a, b) => a.date.localeCompare(b.date))

      return {
        success: true,
        data: filteredData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve streak history'
      }
    }
  }

  public async getStreakSummary(userId: string): Promise<{
    success: boolean
    data?: {
      currentStreak: number
      longestStreak: number
      lastUpdate: Date
      totalContributions: number
      hasData: boolean
    }
    error?: string
  }> {
    try {
      await database.connect()

      const streak = await Streak.findOne({ userId }).exec()

      if (!streak) {
        return {
          success: true,
          data: {
            currentStreak: 0,
            longestStreak: 0,
            lastUpdate: new Date(),
            totalContributions: 0,
            hasData: false
          }
        }
      }

      const totalContributions = streak.contributionData.reduce(
        (sum, day) => sum + day.contributionCount,
        0
      )

      return {
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastUpdate: streak.calculatedAt,
          totalContributions,
          hasData: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve streak summary'
      }
    }
  }

  public async getAllStreaks(options: StreakQueryOptions = {}): Promise<{
    success: boolean
    data?: IStreak[]
    error?: string
  }> {
    try {
      await database.connect()

      let query = Streak.find({})

      if (!options.includeContributions) {
        query = query.select('-contributionData')
      }

      if (options.sortBy) {
        const sortOrder = options.sortOrder === 'desc' ? -1 : 1
        query = query.sort({ [options.sortBy]: sortOrder })
      }

      const results = await query.exec()

      return {
        success: true,
        data: results
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve all streaks'
      }
    }
  }

  public async streakExists(userId: string): Promise<{ success: boolean; exists?: boolean; error?: string }> {
    try {
      await database.connect()

      const count = await Streak.countDocuments({ userId }).exec()

      return {
        success: true,
        exists: count > 0
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check streak existence'
      }
    }
  }

  public async getLastCalculationTime(userId: string): Promise<{
    success: boolean
    lastCalculated?: Date
    error?: string
  }> {
    try {
      await database.connect()

      const streak = await Streak.findOne({ userId }).select('calculatedAt').exec()

      return {
        success: true,
        lastCalculated: streak?.calculatedAt || null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get last calculation time'
      }
    }
  }
}
