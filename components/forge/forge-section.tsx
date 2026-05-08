import { cn } from "@/lib/utils"

type Props = {
  title: string
  className?: string
  headerAction?: React.ReactNode
  children: React.ReactNode
}

export function ForgeSection({ title, className, headerAction, children }: Props) {
  return (
    <section className={cn("space-y-3 rounded-xl border border-border bg-section p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {headerAction}
      </div>
      {children}
    </section>
  )
}
