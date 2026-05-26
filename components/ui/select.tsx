import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

const selectSizes = {
  default: "h-8 px-2 text-sm shadow-sm",
  sm: "h-6 px-1.5 text-xs",
}

interface SelectProps extends ComponentProps<"select"> {
  selectSize?: keyof typeof selectSizes
}

function Select({ className, selectSize = "default", ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        "rounded-md border border-input bg-background text-card-foreground transition-colors",
        "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        selectSizes[selectSize],
        className,
      )}
      {...props}
    />
  )
}

export { Select }
