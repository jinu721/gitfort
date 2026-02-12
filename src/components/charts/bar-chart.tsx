'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BarChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  color?: string
  height?: number
  horizontal?: boolean
}

export function RepositoryBarChart({ 
  data, 
  title, 
  color = '#8884d8', 
  height = 300, 
  horizontal = false 
}: BarChartProps) {
  const truncateName = (name: string, maxLength: number = 20) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
  }

  const chartData = data.map(item => ({
    ...item,
    displayName: truncateName(item.name)
  }))

  if (horizontal) {
    return (
      <div className="w-full">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="displayName" 
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip 
              formatter={(value: number) => [value, 'Count']}
              labelFormatter={(label) => {
                const originalItem = data.find(item => truncateName(item.name) === label)
                return originalItem ? originalItem.name : label
              }}
            />
            <Bar dataKey="value" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="displayName" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number) => [value, 'Count']}
            labelFormatter={(label) => {
              const originalItem = data.find(item => truncateName(item.name) === label)
              return originalItem ? originalItem.name : label
            }}
          />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}