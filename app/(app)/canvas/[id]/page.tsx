"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Hammer,
  Grid3x3,
  Printer,
  Loader2,
  Check,
  Save,
  BookmarkPlus,
  X,
} from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CanvasArea } from "@/components/canvas/canvas-area";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useCharacterStore } from "@/lib/store/character-store";
import { loadCharacter, saveCharacter } from "@/lib/actions/character";
import {
  createCanvasTemplate,
  deleteCanvasTemplate,
  listCanvasTemplates,
} from "@/lib/actions/canvas-template";
import { getOrCreateStubUser } from "@/lib/actions/user";
import { stripWidgetIds } from "@/lib/canvas/page-utils";
import type { CanvasTemplate } from "@/lib/types/canvas";

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showGridConfig, setShowGridConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [templates, setTemplates] = useState<CanvasTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<"idle" | "saving">(
    "idle",
  );
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cols = useCanvasStore((s) => s.cols);
  const setCols = useCanvasStore((s) => s.setCols);
  const canvasPages = useCanvasStore((s) => s.pages);
  const setCanvasData = useCanvasStore((s) => s.setCanvasData);

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const clearCharacter = useCharacterStore((s) => s.clearCharacter);
  const character = useCharacterStore((s) => s.character);
  const autoSave = useCharacterStore((s) => s.autoSave);
  const setAutoSave = useCharacterStore((s) => s.setAutoSave);

  const rows = Math.ceil((cols * 297) / 210);

  useEffect(() => {
    clearCharacter();
    Promise.all([loadCharacter(id), getOrCreateStubUser()]).then(
      async ([res, user]) => {
        setUserId(user.id);
        const userTemplates = await listCanvasTemplates(user.id);
        setTemplates(userTemplates);

        if (res) {
          setCharacter(res.data, res.autoSave);
          setCanvasData(res.data.canvas.pages);
        }
      },
    );
  }, [id, clearCharacter, setCharacter, setCanvasData]);

  // Auto-save on canvas change with 1.5s debounce
  useEffect(() => {
    if (!character || !autoSave) return;

    const updatedCharacter = {
      ...character,
      canvas: { ...character.canvas, pages: canvasPages },
    };

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      await saveCharacter(id, updatedCharacter, autoSave);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [canvasPages, cols, autoSave, id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!character) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    const updatedCharacter = {
      ...character,
      canvas: { ...character.canvas, pages: canvasPages },
    };

    setSaveStatus("saving");
    await saveCharacter(id, updatedCharacter, autoSave);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handleToggleAutoSave(checked: boolean) {
    setAutoSave(checked);
    if (character) {
      const updatedCharacter = {
        ...character,
        canvas: { ...character.canvas, pages: canvasPages },
      };
      await saveCharacter(id, updatedCharacter, checked);
    }
  }

  async function handleSaveTemplate() {
    if (!userId) return;
    const currentPage = canvasPages[useCanvasStore.getState().currentPageIndex];
    if (!currentPage) return;

    setTemplateStatus("saving");
    setTemplateError(null);

    try {
      const created = await createCanvasTemplate(userId, {
        name: templateName,
        cols: currentPage.cols,
        widgets: stripWidgetIds(currentPage.widgets),
      });
      setTemplates((prev) => [created, ...prev]);
      setTemplateName("");
      setShowTemplateForm(false);
    } catch (error) {
      setTemplateError(
        error instanceof Error ? error.message : "Could not save template.",
      );
    } finally {
      setTemplateStatus("idle");
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!userId) return;
    await deleteCanvasTemplate(userId, templateId);
    setTemplates((prev) =>
      prev.filter((template) => template.id !== templateId),
    );
  }

  if (!character) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/characters"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Characters
          </Link>
          <h1 className="text-lg font-semibold">Canvas</h1>
          <Link
            href={`/forge/${id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Hammer className="size-4" />
            Open Forge
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {showTemplateForm ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1">
              <Input
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  if (templateError) setTemplateError(null);
                }}
                placeholder="Template name"
                className="h-7 w-40 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveTemplate}
                disabled={templateStatus === "saving"}
              >
                <BookmarkPlus className="size-4" />
                Save page
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  setShowTemplateForm(false);
                  setTemplateName("");
                  setTemplateError(null);
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTemplateForm(true)}
            >
              <BookmarkPlus className="size-4" />
              Save as template
            </Button>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => handleToggleAutoSave(e.target.checked)}
              className="h-3.5 w-3.5 accent-foreground"
            />
            Auto-save
          </label>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="size-3 text-green-600" />
                Saved
              </>
            )}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            <Save className="size-4" />
            Save
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <button
            type="button"
            onClick={() => setShowGridConfig((v) => !v)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Grid3x3 className="size-4" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Printer className="size-4" />
            Print
          </button>
        </div>
      </header>

      {showGridConfig && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-section px-6 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Columns</span>
            <Input
              type="number"
              min={1}
              value={cols}
              onChange={(e) =>
                setCols(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="h-7 w-16 text-xs"
            />
            <span className="text-xs text-muted-foreground">
              {rows} rows on this page
            </span>
          </div>
          {templateError && (
            <span className="text-xs text-destructive">{templateError}</span>
          )}
        </div>
      )}

      {!showGridConfig && templateError && (
        <div className="border-b border-border bg-section px-6 py-2 text-xs text-destructive">
          {templateError}
        </div>
      )}

      <CanvasArea
        templates={templates}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </div>
  );
}
