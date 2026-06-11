import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useParams } from "next/navigation";

type Props = {
  title: string;
  className?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export function ForgeSection({
  title,
  className,
  headerAction,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: Props) {
  const params = useParams();
  const charId = params?.id as string;
  const storageKey = charId
    ? `forge-section-collapsed:${charId}:${title}`
    : null;

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (collapsible && storageKey) {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) setIsCollapsed(stored === "true");
      }
      setIsLoaded(true);
    });
  }, [collapsible, storageKey]);

  function toggleCollapse() {
    if (!collapsible) return;
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (storageKey) {
      localStorage.setItem(storageKey, String(next));
    }
  }

  return (
    <section
      className={cn(
        "space-y-3 rounded-xl border border-border bg-section p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsible && "cursor-pointer select-none",
          )}
          onClick={toggleCollapse}
        >
          {collapsible &&
            (isCollapsed ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-3 text-muted-foreground" />
            ))}
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </h2>
        </div>
        {headerAction}
      </div>
      {(!collapsible || !isLoaded || !isCollapsed) && children}
    </section>
  );
}
