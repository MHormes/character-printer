import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonProps = React.ComponentProps<typeof Button>

interface ToggleButtonProps extends Omit<ButtonProps, "variant"> {
  isActive: boolean
}

export function ToggleButton({
  isActive,
  className,
  size = "xs",
  children,
  ...props
}: ToggleButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      className={cn(
        "border border-border gap-2",
        isActive
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground"
          : "text-foreground hover:bg-muted hover:text-secondary-foreground",
        className
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-1 min-w-[4rem]">{children}</span>
      <span
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200",
          isActive ? "bg-primary" : "bg-muted-foreground/40"
        )}
      >
        <span
          className={cn(
            "absolute h-3 w-3 rounded-full bg-primary-foreground shadow-sm transition-transform duration-200",
            isActive ? "translate-x-3.5" : "translate-x-0.5"
          )}
        />
      </span>
    </Button>
  )
}
