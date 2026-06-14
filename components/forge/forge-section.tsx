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
  forceExpanded?: boolean;
  headerTourId?: string;
};

export function ForgeSection({
  title,
  className,
  headerAction,
  children,
  collapsible = false,
  defaultCollapsed = false,
  forceExpanded = false,
  headerTourId,
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

  useEffect(() => {
    if (forceExpanded && storageKey) {
      localStorage.setItem(storageKey, "false");
      setIsCollapsed(false);
    }
  }, [forceExpanded, storageKey]);

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
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2",
            collapsible && "cursor-pointer select-none",
          )}
          data-tour-id={headerTourId}
          onClick={toggleCollapse}
        >
          {collapsible &&
            (isCollapsed ? (
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-3 shrink-0 text-muted-foreground" />
            ))}
          <h2 className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </h2>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      {(!collapsible || !isLoaded || !isCollapsed || forceExpanded) && children}
    </section>
  );
}
