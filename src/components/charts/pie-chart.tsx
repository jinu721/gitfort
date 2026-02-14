'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>
  title?: string
  height?: number
  showLegend?: boolean
}

export function LanguagePieChart({ data, title, height = 300, showLegend = true }: PieChartProps) {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number | undefined, name: string | undefined) => [
              `${(((value || 0) / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`,
              name || 'Unknown'
            ]}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => value}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}