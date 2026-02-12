'use client'

import { useMemo } from 'react'

interface HeatmapData {
  date: string
  count: number
  level: number
  dayOfWeek: number
  weekOfYear: number
}

interface HeatmapChartProps {
  data: HeatmapData[]
  title?: string
  height?: number
  cellSize?: number
}

export function ContributionHeatmap({ 
  data, 
  title, 
  height = 200, 
  cellSize = 12 
}: HeatmapChartProps) {
  const { weeks, monthLabels } = useMemo(() => {
    if (!data.length) return { weeks: [], monthLabels: [] }

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const startDate = new Date(sortedData[0].date)
    const endDate = new Date(sortedData[sortedData.length - 1].date)
    
    const weeks: Array<Array<HeatmapData | null>> = []
    const monthLabels: Array<{ month: string; x: number }> = []
    
    const startOfWeek = new Date(startDate)
    startOfWeek.setDate(startDate.getDate() - startDate.getDay())
    
    let currentWeek: Array<HeatmapData | null> = []
    let weekIndex = 0
    let lastMonth = -1
    
    for (let d = new Date(startOfWeek); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay()
      const dateStr = d.toISOString().split('T')[0]
      const dayData = data.find(item => item.date === dateStr)
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push([...currentWeek])
        currentWeek = []
        weekIndex++
      }
      
      if (d.getMonth() !== lastMonth && dayOfWeek === 0) {
        monthLabels.push({
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          x: weekIndex * (cellSize + 2)
        })
        lastMonth = d.getMonth()
      }
      
      currentWeek.push(dayData || null)
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }
    
    return { weeks, monthLabels }
  }, [data, cellSize])

  const getLevelColor = (level: number): string => {
    const colors = [
      '#ebedf0',
      '#9be9a8', 
      '#40c463',
      '#30a14e',
      '#216e39'
    ]
    return colors[level] || colors[0]
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <svg 
          width={Math.max(weeks.length * (cellSize + 2) + 50, 400)} 
          height={height}
          className="border rounded"
        >
          {monthLabels.map((label, index) => (
            <text
              key={index}
              x={label.x + 25}
              y={15}
              fontSize="12"
              fill="#586069"
              textAnchor="start"
            >
              {label.month}
            </text>
          ))}
          
          {dayLabels.map((day, dayIndex) => (
            <text
              key={dayIndex}
              x={15}
              y={35 + dayIndex * (cellSize + 2)}
              fontSize="10"
              fill="#586069"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {dayIndex % 2 === 1 ? day : ''}
            </text>
          ))}
          
          {weeks.map((week, weekIndex) => (
            <g key={weekIndex}>
              {week.map((day, dayIndex) => (
                <rect
                  key={`${weekIndex}-${dayIndex}`}
                  x={25 + weekIndex * (cellSize + 2)}
                  y={25 + dayIndex * (cellSize + 2)}
                  width={cellSize}
                  height={cellSize}
                  fill={day ? getLevelColor(day.level) : '#ebedf0'}
                  stroke="#ffffff"
                  strokeWidth="1"
                  rx="2"
                >
                  <title>
                    {day 
                      ? `${day.date}: ${day.count} contributions`
                      : 'No data'
                    }
                  </title>
                </rect>
              ))}
            </g>
          ))}
        </svg>
        
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm border border-white"
                style={{ backgroundColor: getLevelColor(level) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}