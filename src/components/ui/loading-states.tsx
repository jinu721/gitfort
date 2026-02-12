interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]} ${className}`} />
  )
}

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = '', width = 'w-full', height = 'h-4' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow border animate-pulse">
      <div className="flex items-center space-x-4">
        <Skeleton className="rounded-full" width="w-12" height="h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton width="w-3/4" height="h-4" />
          <Skeleton width="w-1/2" height="h-3" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton width="w-1/4" height="h-5" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-6 py-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <Skeleton width="w-8" height="h-8" className="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton width="w-3/4" height="h-4" />
                <Skeleton width="w-1/2" height="h-3" />
              </div>
              <Skeleton width="w-16" height="h-6" className="rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="animate-pulse">
        <Skeleton width="w-1/3" height="h-6" className="mb-4" />
        <div className="space-y-3">
          <div className="flex items-end space-x-2 h-32">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={index}
                width="w-8"
                height={`h-${Math.floor(Math.random() * 20) + 8}`}
                className="flex-1"
              />
            ))}
          </div>
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} width="w-8" height="h-3" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      
      <TableSkeleton />
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ progress, className = '', showPercentage = false }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">{clampedProgress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
}

export function LoadingOverlay({ isLoading, children, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export function InlineLoading({ text = 'Loading...', size = 'sm' }: InlineLoadingProps) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}

export function ButtonLoading({ children, isLoading, ...props }: any) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      <div className="flex items-center justify-center space-x-2">
        {isLoading && <LoadingSpinner size="sm" className="border-white" />}
        <span>{children}</span>
      </div>
    </button>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon = '📭', action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}