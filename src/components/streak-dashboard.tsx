"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  lastUpdate: Date | null;
  totalContributions: number;
}

interface StreakDashboardProps {
  className?: string;
}

export function StreakDashboard({ className = "" }: StreakDashboardProps) {
  const { data: session } = useSession();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStreakData();
    }
  }, [session?.user?.id]);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/streak/summary");
      
      if (!response.ok) {
        throw new Error("Failed to fetch streak data");
      }
      
      const data = await response.json();
      setStreakData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getStreakStatusColor = (isAtRisk: boolean, currentStreak: number) => {
    if (currentStreak === 0) return "text-gray-500 dark:text-github-muted";
    if (isAtRisk) return "text-dashboard-warning dark:text-github-warning";
    return "text-dashboard-success dark:text-github-accent";
  };

  const getStreakStatusBg = (isAtRisk: boolean, currentStreak: number) => {
    if (currentStreak === 0) return "bg-gray-100 dark:bg-github-surface";
    if (isAtRisk) return "bg-orange-50 dark:bg-orange-900/20";
    return "bg-green-50 dark:bg-green-900/20";
  };

  const getStreakIcon = (isAtRisk: boolean, currentStreak: number) => {
    if (currentStreak === 0) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (isAtRisk) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-github-surface rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-github-border rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-github-border rounded"></div>
                <div className="h-8 bg-gray-200 dark:bg-github-border rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-github-surface rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <div className="text-dashboard-error dark:text-github-danger mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-github-text mb-2">
            Failed to load streak data
          </h3>
          <p className="text-gray-600 dark:text-github-muted mb-4">{error}</p>
          <button
            onClick={fetchStreakData}
            className="px-4 py-2 bg-dashboard-primary dark:bg-github-info text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!streakData) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-github-surface rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-github-text">
          Contribution Streaks
        </h2>
        <button
          onClick={fetchStreakData}
          className="text-gray-500 dark:text-github-muted hover:text-gray-700 dark:hover:text-github-text transition-colors"
          title="Refresh streak data"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-lg p-4 ${getStreakStatusBg(streakData.isAtRisk, streakData.currentStreak)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              Current Streak
            </h3>
            <div className={getStreakStatusColor(streakData.isAtRisk, streakData.currentStreak)}>
              {getStreakIcon(streakData.isAtRisk, streakData.currentStreak)}
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-github-text">
              {streakData.currentStreak}
            </span>
            <span className="ml-2 text-sm text-gray-600 dark:text-github-muted">
              {streakData.currentStreak === 1 ? "day" : "days"}
            </span>
          </div>
          {streakData.isAtRisk && streakData.currentStreak > 0 && (
            <div className="mt-2 text-xs text-dashboard-warning dark:text-github-warning">
              Streak at risk
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              Longest Streak
            </h3>
            <div className="text-dashboard-info dark:text-github-info">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-github-text">
              {streakData.longestStreak}
            </span>
            <span className="ml-2 text-sm text-gray-600 dark:text-github-muted">
              {streakData.longestStreak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-github-muted">
              Total Contributions
            </h3>
            <div className="text-purple-600 dark:text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-github-text">
              {streakData.totalContributions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-github-border">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-github-muted">
          <span>Last updated: {formatLastUpdate(streakData.lastUpdate)}</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              streakData.isAtRisk && streakData.currentStreak > 0
                ? "bg-dashboard-warning dark:bg-github-warning"
                : streakData.currentStreak > 0
                ? "bg-dashboard-success dark:bg-github-accent"
                : "bg-gray-400 dark:bg-github-muted"
            }`}></div>
            <span>
              {streakData.isAtRisk && streakData.currentStreak > 0
                ? "At Risk"
                : streakData.currentStreak > 0
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}