'use client'

import { Component, ReactNode } from 'react'
import { ButtonLoading } from './loading-states'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error, errorInfo })
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback 
          error={this.state.error} 
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  onRetry?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.'
}: ErrorFallbackProps) {
  return (
    <div className="min-h-64 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

interface ErrorAlertProps {
  title: string
  message: string
  type?: 'error' | 'warning' | 'info'
  onClose?: () => void
  onRetry?: () => void
  retryLoading?: boolean
}

export function ErrorAlert({ 
  title, 
  message, 
  type = 'error', 
  onClose, 
  onRetry,
  retryLoading = false
}: ErrorAlertProps) {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconMap = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{iconMap[type]}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
          
          <div className="mt-3 flex space-x-2">
            {onRetry && (
              <ButtonLoading
                onClick={onRetry}
                isLoading={retryLoading}
                className="text-xs px-3 py-1 bg-white border border-current rounded hover:bg-gray-50"
              >
                Retry
              </ButtonLoading>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-xs px-3 py-1 bg-white border border-current rounded hover:bg-gray-50"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  retryLoading?: boolean
}

export function NetworkError({ onRetry, retryLoading = false }: NetworkErrorProps) {
  return (
    <ErrorAlert
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      type="error"
      onRetry={onRetry}
      retryLoading={retryLoading}
    />
  )
}

interface NotFoundErrorProps {
  resource?: string
  onGoBack?: () => void
}

export function NotFoundError({ resource = 'resource', onGoBack }: NotFoundErrorProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found
      </h2>
      <p className="text-gray-600 mb-6">
        The {resource} you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Go Back
        </button>
      )}
    </div>
  )
}

interface UnauthorizedErrorProps {
  onLogin?: () => void
}

export function UnauthorizedError({ onLogin }: UnauthorizedErrorProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Access Denied
      </h2>
      <p className="text-gray-600 mb-6">
        You don&apos;t have permission to access this resource. Please log in or contact an administrator.
      </p>
      {onLogin && (
        <button
          onClick={onLogin}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Log In
        </button>
      )}
    </div>
  )
}

interface RateLimitErrorProps {
  resetTime?: Date
  onRetry?: () => void
}

export function RateLimitError({ resetTime, onRetry }: RateLimitErrorProps) {
  const formatResetTime = (date: Date) => {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const minutes = Math.ceil(diff / (1000 * 60))
    return minutes > 0 ? `${minutes} minutes` : 'soon'
  }

  return (
    <ErrorAlert
      title="Rate Limit Exceeded"
      message={`You've made too many requests. ${
        resetTime ? `Try again in ${formatResetTime(resetTime)}.` : 'Please wait before trying again.'
      }`}
      type="warning"
      onRetry={onRetry}
    />
  )
}

interface ValidationErrorProps {
  errors: Record<string, string[]>
  onClose?: () => void
}

export function ValidationError({ errors, onClose }: ValidationErrorProps) {
  const errorCount = Object.keys(errors).length
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">❌</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="font-semibold text-red-800">
            Validation Error{errorCount > 1 ? 's' : ''}
          </h3>
          <div className="mt-2 space-y-1">
            {Object.entries(errors).map(([field, fieldErrors]) => (
              <div key={field}>
                <span className="font-medium text-red-700">{field}:</span>
                <ul className="list-disc list-inside ml-4">
                  {fieldErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {onClose && (
            <div className="mt-3">
              <button
                onClick={onClose}
                className="text-xs px-3 py-1 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ErrorToastProps {
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
  duration?: number
  onClose?: () => void
}

export function ErrorToast({ 
  message, 
  type = 'error', 
  duration = 5000, 
  onClose 
}: ErrorToastProps) {
  const typeStyles = {
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white'
  }

  const iconMap = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅'
  }

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full shadow-lg rounded-lg p-4 z-50 ${typeStyles[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span>{iconMap[type]}</span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-white hover:text-gray-200"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}