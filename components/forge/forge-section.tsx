import { cn } from "@/lib/utils"

type Props = {
  title: string
  className?: string
  children: React.ReactNode
}

export function ForgeSection({ title, className, children }: Props) {
  return (
    <section className={cn("space-y-3 rounded-xl border border-border bg-section p-4", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}
