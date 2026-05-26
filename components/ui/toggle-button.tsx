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
  ...props
}: ToggleButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      className={cn(
        "border border-border",
        isActive
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  )
}
