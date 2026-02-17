import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"

interface ToggleProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline'
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className = "", size = 'default', variant = 'default', ...props }, ref) => {
  const sizeClasses = {
    default: 'h-9 px-3',
    sm: 'h-8 px-2 text-xs',
    lg: 'h-10 px-4'
  }

  const variantClasses = {
    default: 'bg-transparent hover:bg-muted hover:text-muted-foreground',
    outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground'
  }

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
})
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle }
