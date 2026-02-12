'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-white dark:bg-github-bg">
      <nav className="bg-white dark:bg-github-bg border-b border-gray-200 dark:border-github-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-gray-900 dark:text-github-text" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-semibold text-gray-900 dark:text-github-text">GitFort</span>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-gray-600 dark:text-github-muted hover:text-gray-900 dark:hover:text-github-text text-sm font-medium">
                  Features
                </a>
                <a href="#security" className="text-gray-600 dark:text-github-muted hover:text-gray-900 dark:hover:text-github-text text-sm font-medium">
                  Security
                </a>
                <a href="#pricing" className="text-gray-600 dark:text-github-muted hover:text-gray-900 dark:hover:text-github-text text-sm font-medium">
                  Pricing
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="bg-github-accent hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="bg-github-accent hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-github-surface border border-github-border text-github-muted mb-8">
                <svg className="w-4 h-4 mr-2 text-github-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Automated GitHub maintenance for developers
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-github-text mb-8 leading-tight">
              Automate your GitHub
              <span className="block">presence</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-github-muted max-w-4xl mx-auto mb-12 leading-relaxed">
              GitFort monitors, analyzes, and optimizes your GitHub repositories automatically. 
              Keep your projects healthy, secure, and discoverable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white bg-github-accent hover:bg-green-700 transition-colors"
                >
                  Open Dashboard
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white bg-github-accent hover:bg-green-700 transition-colors"
                >
                  Get started for free
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              <a
                href="https://github.com"
                className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-gray-900 dark:text-github-text bg-transparent border border-gray-300 dark:border-github-border hover:bg-gray-50 dark:hover:bg-github-surface transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        <div id="features" className="py-24 bg-gray-50 dark:bg-github-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-github-text mb-6">
                Built for modern development
              </h2>
              <p className="text-xl text-gray-600 dark:text-github-muted max-w-3xl mx-auto">
                Comprehensive monitoring and automation tools designed to keep your GitHub repositories 
                healthy, secure, and performing at their best.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-github-bg p-8 rounded-lg border border-gray-200 dark:border-github-border">
                <div className="w-12 h-12 bg-github-accent rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text mb-3">Streak Monitoring</h3>
                <p className="text-gray-600 dark:text-github-muted leading-relaxed">
                  Automatically track contribution streaks with intelligent notifications and risk detection 
                  to keep your GitHub activity consistent.
                </p>
              </div>

              <div className="bg-white dark:bg-github-bg p-8 rounded-lg border border-gray-200 dark:border-github-border">
                <div className="w-12 h-12 bg-github-danger rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text mb-3">Security Scanning</h3>
                <p className="text-gray-600 dark:text-github-muted leading-relaxed">
                  Advanced vulnerability detection for API keys, secrets, and sensitive data across 
                  all your repositories with automated alerts.
                </p>
              </div>

              <div className="bg-white dark:bg-github-bg p-8 rounded-lg border border-gray-200 dark:border-github-border">
                <div className="w-12 h-12 bg-github-info rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text mb-3">Analytics Engine</h3>
                <p className="text-gray-600 dark:text-github-muted leading-relaxed">
                  Deep insights into your coding patterns with interactive charts, heatmaps, 
                  and comprehensive repository analytics.
                </p>
              </div>

              <div className="bg-white dark:bg-github-bg p-8 rounded-lg border border-gray-200 dark:border-github-border">
                <div className="w-12 h-12 bg-github-warning rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text mb-3">CI/CD Monitoring</h3>
                <p className="text-gray-600 dark:text-github-muted leading-relaxed">
                  Track pipeline health, build success rates, and failure patterns with 
                  intelligent alerts and performance optimization suggestions.
                </p>
              </div>

              <div className="bg-white dark:bg-github-bg p-8 rounded-lg border border-gray-200 dark:border-github-border">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text mb-3">Smart Automation</h3>
                <p className="text-gray-600 dark:text-github-muted leading-relaxed">
                  Automated maintenance tasks, dependency updates, and repository optimization 
                  to keep your projects running smoothly.
                </p>
              </div>

              <div className="bg-white dark:bg-github-bg p-8 rounded-lg border border-gray-200 dark:border-github-border">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-github-text mb-3">Team Collaboration</h3>
                <p className="text-gray-600 dark:text-github-muted leading-relaxed">
                  Enhanced team insights, code review analytics, and collaboration metrics 
                  to improve team productivity and code quality.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white dark:bg-github-bg">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-github-text mb-6">
              Start monitoring today
            </h2>
            <p className="text-xl text-gray-600 dark:text-github-muted mb-10 max-w-2xl mx-auto">
              Join thousands of developers who trust GitFort to keep their GitHub repositories 
              secure, optimized, and performing at their best.
            </p>
            {!session && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-md text-white bg-github-accent hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Sign up with GitHub
                </Link>
                <span className="text-gray-500 dark:text-github-muted">Free for public repositories</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 dark:bg-github-surface border-t border-gray-200 dark:border-github-border">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <svg className="h-6 w-6 text-gray-600 dark:text-github-muted" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 dark:text-github-muted font-medium">GitFort</span>
            </div>
            <p className="text-gray-500 dark:text-github-muted text-sm">
              © 2024 GitFort. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}