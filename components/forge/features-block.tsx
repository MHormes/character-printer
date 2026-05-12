"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FeatureEntry } from "@/lib/types/character";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { searchSrdFeatures } from "@/lib/actions/5e-data";
import type { SrdFeatureResult } from "@/lib/actions/5e-data";

// ─── Feature picker ───────────────────────────────────────────────────────────

function FeaturePicker({
  onAdd,
  onClose,
}: {
  onAdd: (feat: SrdFeatureResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SrdFeatureResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(q: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchSrdFeatures(q || undefined);
      setResults(res);
      setLoading(false);
    }, 250);
  }

  useEffect(() => {
    runSearch(query);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(q: string) {
    setQuery(q);
    runSearch(q);
  }

  function handleAdd(feat: FeatRow) {
    onAdd(feat);
    setAddedNames((prev) => new Set([...prev, feat.name]));
  }

  return (
    <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search feats & features…"
            className="h-6 pl-6 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-0.5">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && results.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No feats found
          </p>
        )}
        {!loading &&
          results.map((feat) => {
            const added = addedNames.has(feat.name);
            return (
              <div
                key={feat.id}
                className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium">{feat.name}</span>
                </div>
                <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {feat.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdd(feat)}
                  disabled={added}
                  className={cn(
                    "flex shrink-0 size-5 items-center justify-center rounded-full text-xs transition-colors",
                    added
                      ? "text-muted-foreground cursor-default"
                      : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                  )}
                  title={added ? "Added" : "Add feature"}
                >
                  {added ? "✓" : <Plus className="size-3" />}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FeaturesBlockProps = {
  features: FeatureEntry[];
  onChange: (list: FeatureEntry[]) => void;
};

export function FeaturesBlock({ features, onChange }: FeaturesBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function patch(id: string, update: Partial<FeatureEntry>) {
    onChange(features.map((f) => (f.id === id ? { ...f, ...update } : f)));
  }

  function addFeature() {
    const id = crypto.randomUUID();
    onChange([...features, { id, name: "", source: "", description: "" }]);
    setExpandedIds((prev) => new Set([...prev, id]));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = features.findIndex((f) => f.id === active.id);
    const newIdx = features.findIndex((f) => f.id === over.id);
    onChange(arrayMove(features, oldIdx, newIdx));
  }

  return (
    <div className="space-y-1.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={features.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {features.map((feature) => (
            <SortableFeatureItem
              key={feature.id}
              feature={feature}
              expanded={expandedIds.has(feature.id)}
              onToggle={() => toggleExpand(feature.id)}
              onPatch={(u) => patch(feature.id, u)}
              onDelete={() =>
                onChange(features.filter((f) => f.id !== feature.id))
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      {showPicker && (
        <FeaturePicker
          onAdd={(feat) => {
            onChange([
              ...features,
              {
                id: crypto.randomUUID(),
                name: feat.name,
                source: feat.category,
                description: feat.description,
              },
            ]);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className={cn(
            "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs transition-colors",
            showPicker
              ? "border-foreground/30 text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          <Search className="size-3.5" />
          Search Feature or Trait
        </button>
        <button
          type="button"
          onClick={addFeature}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add manually
        </button>
      </div>
    </div>
  );
}

type SortableFeatureItemProps = {
  feature: FeatureEntry;
  expanded: boolean;
  onToggle: () => void;
  onPatch: (u: Partial<FeatureEntry>) => void;
  onDelete: () => void;
};

function SortableFeatureItem({
  feature,
  expanded,
  onToggle,
  onPatch,
  onDelete,
}: SortableFeatureItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border border-border bg-card",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
        <Input
          type="text"
          value={feature.name}
          placeholder="Feature name"
          onChange={(e) => onPatch({ name: e.target.value })}
          className="h-6 min-w-0 flex-1 text-xs"
        />
        {!expanded && feature.source && (
          <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {feature.source}
          </span>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">
              Source
            </span>
            <Input
              type="text"
              value={feature.source}
              placeholder="e.g. High Elf, Fighter 2, Feat"
              onChange={(e) => onPatch({ source: e.target.value })}
              className="h-6 text-xs"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea
              value={feature.description}
              placeholder="Feature description..."
              onChange={(e) => onPatch({ description: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:border-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}
