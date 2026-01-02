import { useMemo } from 'react'
import { clsx } from 'clsx'

interface ScoreRingProps {
  score: number
  maxScore?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export default function ScoreRing({
  score,
  maxScore = 100,
  size = 'md',
  showLabel = true,
  label,
  className,
}: ScoreRingProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100))
  
  const sizes = {
    sm: { width: 64, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 96, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 128, strokeWidth: 10, fontSize: 'text-3xl' },
  }
  
  const { width, strokeWidth, fontSize } = sizes[size]
  const radius = (width - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  
  const color = useMemo(() => {
    if (percentage >= 75) return 'stroke-success-500'
    if (percentage >= 50) return 'stroke-warning-500'
    return 'stroke-danger-500'
  }, [percentage])
  
  const bgColor = useMemo(() => {
    if (percentage >= 75) return 'text-success-600'
    if (percentage >= 50) return 'text-warning-600'
    return 'text-danger-600'
  }, [percentage])

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className="relative" style={{ width, height: width }}>
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary-200"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={clsx(color, 'transition-all duration-500 ease-out')}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx(fontSize, 'font-bold', bgColor)}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {showLabel && label && (
        <span className="mt-2 text-sm text-secondary-600">{label}</span>
      )}
    </div>
  )
}
