import * as React from "react"

interface ChartConfig {
  [key: string]: {
    color?: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`w-full h-full ${className}`} {...props}>
        {children}
      </div>
    )
  }
)

ChartContainer.displayName = "ChartContainer"

interface ChartTooltipProps {
  content?: React.ComponentType<any>
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ content }) => {
  return null // Recharts handles tooltip rendering
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
}

export const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

ChartTooltipContent.displayName = "ChartTooltipContent"
