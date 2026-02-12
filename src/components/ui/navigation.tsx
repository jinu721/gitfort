'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={`text-sm font-medium ${
                  item.current
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface NavigationItem {
  id: string
  label: string
  icon: string
  href?: string
  badge?: string | number
  children?: NavigationItem[]
}

interface SidebarNavigationProps {
  items: NavigationItem[]
  activeItem: string
  onItemClick: (itemId: string) => void
  className?: string
}

export function SidebarNavigation({
  items,
  activeItem,
  onItemClick,
  className = ''
}: SidebarNavigationProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = activeItem === item.id
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              onItemClick(item.id)
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            level > 0 ? 'ml-4' : ''
          } ${
            isActive
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <div className="flex items-center">
            <span className="mr-3">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {item.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map(item => renderNavigationItem(item))}
    </nav>
  )
}

interface TabNavigationProps {
  tabs: Array<{
    id: string
    label: string
    icon?: string
    count?: number
    disabled?: boolean
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: TabNavigationProps) {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : tab.disabled
                ? 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>
    </div>
  )
}

interface NavigationState {
  currentSection: string
  breadcrumbs: BreadcrumbItem[]
  history: string[]
}

export function useNavigation(initialSection: string = 'overview') {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentSection: initialSection,
    breadcrumbs: [{ label: 'Dashboard', current: true }],
    history: [initialSection]
  })

  const navigateTo = (section: string, label?: string) => {
    setNavigationState(prev => ({
      currentSection: section,
      breadcrumbs: [
        { label: 'Dashboard', href: '#overview' },
        { label: label || section, current: true }
      ],
      history: [...prev.history.slice(-9), section] // Keep last 10 items
    }))
  }

  const goBack = () => {
    if (navigationState.history.length > 1) {
      const newHistory = [...navigationState.history]
      newHistory.pop() // Remove current
      const previousSection = newHistory[newHistory.length - 1]
      
      setNavigationState(prev => ({
        currentSection: previousSection,
        breadcrumbs: prev.breadcrumbs.slice(0, -1),
        history: newHistory
      }))
    }
  }

  const canGoBack = navigationState.history.length > 1

  return {
    currentSection: navigationState.currentSection,
    breadcrumbs: navigationState.breadcrumbs,
    history: navigationState.history,
    navigateTo,
    goBack,
    canGoBack
  }
}

interface BackButtonProps {
  onBack: () => void
  disabled?: boolean
  className?: string
}

export function BackButton({ onBack, disabled = false, className = '' }: BackButtonProps) {
  return (
    <button
      onClick={onBack}
      disabled={disabled}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 ${className}`}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back
    </button>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  backButton?: {
    onBack: () => void
    disabled?: boolean
  }
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  backButton
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 1 && (
        <Breadcrumb items={breadcrumbs} className="mb-4" />
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {backButton && (
            <BackButton
              onBack={backButton.onBack}
              disabled={backButton.disabled}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}