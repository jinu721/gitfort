'use client'

import { useState, useEffect } from 'react'
import { CommitLineChart, LanguagePieChart, RepositoryBarChart, ContributionHeatmap } from './charts'
import { DashboardSkeleton, EmptyState, ButtonLoading } from './ui'
import type { 
  CommitFrequencyData, 
  LanguageUsageData, 
  ActivityData, 
  HeatmapData 
} from '@/lib/analytics-processor'

interface AnalyticsDashboardProps {
  username: string
}

interface DateRangeFilter {
  range: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: string
  endDate?: string
}

export function AnalyticsDashboard({ username }: AnalyticsDashboardProps) {
  const [commitData, setCommitData] = useState<CommitFrequencyData | null>(null)
  const [languageData, setLanguageData] = useState<LanguageUsageData | null>(null)
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({ range: 'year' })
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'languages' | 'activity' | 'heatmap'>('overview')

  useEffect(() => {
    fetchAnalyticsData()
  }, [username, dateFilter])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username,
          dateRange: dateFilter.range,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setCommitData(data.commitFrequency)
      setLanguageData(data.languageUsage)
      setActivityData(data.repositoryActivity)
      setHeatmapData(data.heatmap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (range: DateRangeFilter['range']) => {
    setDateFilter({ range })
  }

  const handleCustomDateRange = (startDate: string, endDate: string) => {
    setDateFilter({ range: 'custom', startDate, endDate })
  }

  if (loading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Analytics</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <ButtonLoading
            onClick={fetchAnalyticsData}
            isLoading={loading}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </ButtonLoading>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'commits', label: 'Commits' },
    { id: 'languages', label: 'Languages' },
    { id: 'activity', label: 'Activity' },
    { id: 'heatmap', label: 'Heatmap' }
  ] as const

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        
        <div className="flex flex-wrap gap-2">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range as DateRangeFilter['range'])}
              className={`px-3 py-1 rounded text-sm ${
                dateFilter.range === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Commits</h3>
              <p className="text-2xl font-bold text-gray-900">{commitData?.totalCommits || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Active Repositories</h3>
              <p className="text-2xl font-bold text-gray-900">{activityData?.activeRepositories || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Languages Used</h3>
              <p className="text-2xl font-bold text-gray-900">{languageData?.languageCount || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Current Streak</h3>
              <p className="text-2xl font-bold text-gray-900">{heatmapData?.streakData.currentStreak || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              {commitData && (
                <CommitLineChart 
                  data={commitData.daily.slice(-30)} 
                  title="Commit Activity (Last 30 Days)"
                  color="#3b82f6"
                />
              )}
            </div>
            <div className="bg-white p-6 rounded-lg border">
              {languageData && (
                <LanguagePieChart 
                  data={languageData.languages.slice(0, 8).map(lang => ({
                    name: lang.name,
                    value: lang.percentage,
                    color: lang.color
                  }))}
                  title="Language Distribution"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'commits' && commitData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
              <p className="text-xl font-bold text-gray-900">{commitData.averagePerDay.toFixed(1)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Weekly Average</h3>
              <p className="text-xl font-bold text-gray-900">{commitData.averagePerWeek.toFixed(1)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Monthly Average</h3>
              <p className="text-xl font-bold text-gray-900">{commitData.averagePerMonth.toFixed(1)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <CommitLineChart 
              data={commitData.daily} 
              title="Daily Commit Frequency"
              color="#10b981"
              height={400}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <CommitLineChart 
                data={commitData.weekly} 
                title="Weekly Commit Frequency"
                color="#f59e0b"
              />
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <CommitLineChart 
                data={commitData.monthly} 
                title="Monthly Commit Frequency"
                color="#ef4444"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'languages' && languageData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Primary Language</h3>
              <p className="text-xl font-bold text-gray-900">{languageData.primaryLanguage}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Languages</h3>
              <p className="text-xl font-bold text-gray-900">{languageData.languageCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Bytes</h3>
              <p className="text-xl font-bold text-gray-900">{(languageData.totalBytes / 1024).toFixed(0)}KB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <LanguagePieChart 
                data={languageData.languages.map(lang => ({
                  name: lang.name,
                  value: lang.percentage,
                  color: lang.color
                }))}
                title="Language Distribution by Percentage"
              />
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <RepositoryBarChart 
                data={languageData.languages.slice(0, 10).map(lang => ({
                  name: lang.name,
                  value: lang.bytes
                }))}
                title="Language Usage by Bytes"
                color="#8b5cf6"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && activityData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Repositories</h3>
              <p className="text-xl font-bold text-gray-900">{activityData.totalRepositories}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Active Repositories</h3>
              <p className="text-xl font-bold text-gray-900">{activityData.activeRepositories}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Average Activity Score</h3>
              <p className="text-xl font-bold text-gray-900">{activityData.averageActivityScore.toFixed(1)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Most Active</h3>
              <p className="text-sm font-bold text-gray-900 truncate">{activityData.mostActiveRepository}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <RepositoryBarChart 
              data={activityData.repositoryActivity.slice(0, 15).map(repo => ({
                name: repo.repository,
                value: repo.activityScore
              }))}
              title="Repository Activity Scores"
              color="#06b6d4"
              height={400}
              horizontal={true}
            />
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && heatmapData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Contributions</h3>
              <p className="text-xl font-bold text-gray-900">{heatmapData.totalContributions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Current Streak</h3>
              <p className="text-xl font-bold text-gray-900">{heatmapData.streakData.currentStreak}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Longest Streak</h3>
              <p className="text-xl font-bold text-gray-900">{heatmapData.streakData.longestStreak}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
              <p className="text-xl font-bold text-gray-900">{heatmapData.averageContributions.toFixed(1)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <ContributionHeatmap 
              data={heatmapData.contributions}
              title="Contribution Heatmap"
              height={250}
            />
          </div>
        </div>
      )}
    </div>
  )
}