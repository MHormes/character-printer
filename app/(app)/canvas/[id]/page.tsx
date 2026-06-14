"use client";

import { use, useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Hammer,
  Grid3x3,
  Printer,
  FileDown,
  Loader2,
  Check,
  Save,
  BookmarkPlus,
  X,
  Undo2,
  Redo2,
} from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/ui/toggle-button";
import { Input } from "@/components/ui/input";
import { CanvasArea } from "@/components/canvas/canvas-area";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useCharacterStore } from "@/lib/store/character-store";
import { loadCharacter } from "@/lib/actions/character";
import { useSaveCharacter } from "@/lib/hooks/use-save-character";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { exportPdf } from "@/lib/canvas/export-pdf";
import {
  createCanvasTemplate,
  deleteCanvasTemplate,
  listCanvasTemplates,
} from "@/lib/actions/canvas-template";
import { stripWidgetIds } from "@/lib/canvas/page-utils";
import type { CanvasTemplate } from "@/lib/types/canvas";

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showGridConfig, setShowGridConfig] = useState(false);
  const [templates, setTemplates] = useState<CanvasTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<"idle" | "saving">(
    "idle",
  );
  const [pdfStatus, setPdfStatus] = useState<"idle" | "exporting">("idle");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const cols = useCanvasStore((s) => s.cols);
  const setCols = useCanvasStore((s) => s.setCols);
  const canvasPages = useCanvasStore((s) => s.pages);
  const currentPageIndex = useCanvasStore((s) => s.currentPageIndex);
  const setPage = useCanvasStore((s) => s.setPage);
  const setCanvasData = useCanvasStore((s) => s.setCanvasData);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const historyLength = useCanvasStore((s) => s.history.length);
  const futureLength = useCanvasStore((s) => s.future.length);

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const clearCharacter = useCharacterStore((s) => s.clearCharacter);
  const character = useCharacterStore((s) => s.character);
  const autoSave = useCharacterStore((s) => s.autoSave);
  const setAutoSave = useCharacterStore((s) => s.setAutoSave);

  const rows = Math.ceil((cols * 297) / 210);
  const isMobile = useIsMobile();
  const mounted = useSyncExternalStore(
    (cb) => { cb(); return () => {}; },
    () => true,
    () => false,
  );

  const { saveStatus, handleSave, handleToggleAutoSave } = useSaveCharacter({
    id,
    autoSave,
    autoSaveDeps: [canvasPages, cols],
    shouldAutoSave: !!character,
    buildSaveData: () => ({
      ...character!,
      canvas: { ...character!.canvas, pages: canvasPages },
    }),
    setAutoSave,
  });

  useEffect(() => {
    if (!userId) return;
    clearCharacter();
    Promise.all([loadCharacter(id), listCanvasTemplates(userId)]).then(
      ([res, userTemplates]) => {
        setTemplates(userTemplates);
        if (res) {
          setCharacter(res.data, res.autoSave);
          setCanvasData(res.data.canvas.pages);
        }
      },
    );
  }, [id, userId, clearCharacter, setCharacter, setCanvasData]);

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

  async function handleExportPdf() {
    if (pdfStatus === "exporting") return;
    setPdfStatus("exporting");
    try {
      await exportPdf(character?.identity.name);
    } finally {
      setPdfStatus("idle");
    }
  }

  if (!character) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between bg-primary px-8 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href="/characters"
              className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="size-3.5" />
              Characters
            </Link>
            <div className="h-4 w-px bg-primary-foreground/20" />
            <span className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground">
              Canvas
            </span>
          </div>
        </header>
        <div className="border-b border-border bg-section px-8 py-2" />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Primary nav bar */}
      <header className="flex shrink-0 items-center justify-between bg-primary px-4 md:px-8 py-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/characters"
            className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            Characters
          </Link>
          {!isMobile && (
            <>
              <div className="h-4 w-px bg-primary-foreground/20" />
              <span className="font-cinzel text-xs tracking-[0.3em] uppercase font-semibold text-primary-foreground truncate">
                {character.identity.name || "Canvas"}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/forge/${id}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Hammer className="size-4" />
            Forge
          </Link>
          {!isMobile && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={undo}
                disabled={historyLength === 0}
                title="Undo (Ctrl+Z)"
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30"
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={redo}
                disabled={futureLength === 0}
                title="Redo (Ctrl+Shift+Z)"
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30"
              >
                <Redo2 className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSave}
                disabled={saveStatus === "saving"}
              >
                <Save className="size-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Secondary action bar */}
      {!isMobile && <div className="flex shrink-0 items-center justify-between border-b border-border bg-section px-8 py-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="size-3 animate-spin" />
              Saving…
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="size-3" />
              Saved
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <ToggleButton
            isActive={autoSave}
            onClick={() => handleToggleAutoSave(!autoSave)}
          >
            Auto-save {autoSave ? "on" : "off"}
          </ToggleButton>
          <div className="h-4 w-px bg-border" />
          {showTemplateForm ? (
            <div className="flex items-center gap-2">
              <Input
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  if (templateError) setTemplateError(null);
                }}
                placeholder="Template name"
                className="h-7 w-36 text-xs"
              />
              <Button
                size="xs"
                variant="secondary"
                onClick={handleSaveTemplate}
                disabled={templateStatus === "saving"}
              >
                <BookmarkPlus className="size-3.5" />
                Save
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                className="text-card-foreground hover:text-card-foreground"
                onClick={() => {
                  setShowTemplateForm(false);
                  setTemplateName("");
                  setTemplateError(null);
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="xs"
              variant="outline"
              className="text-card-foreground hover:text-card-foreground"
              onClick={() => setShowTemplateForm(true)}
            >
              <BookmarkPlus className="size-3.5" />
              Save as template
            </Button>
          )}
          <div className="h-4 w-px bg-border" />
          <div className="relative">
            <ToggleButton
              isActive={showGridConfig}
              onClick={() => setShowGridConfig((v) => !v)}
            >
              <Grid3x3 className="size-3.5" />
              Grid size
            </ToggleButton>
            {showGridConfig && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 flex min-w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md">
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
            )}
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="text-card-foreground hover:text-card-foreground"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5" />
            Print
          </Button>
          <Button
            size="xs"
            variant="outline"
            className="text-card-foreground hover:text-card-foreground"
            onClick={handleExportPdf}
            disabled={pdfStatus === "exporting"}
          >
            {pdfStatus === "exporting" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileDown className="size-3.5" />
            )}
            Export PDF
          </Button>
        </div>
      </div>}

      {templateError && (
        <div className="border-b border-border bg-section px-8 py-2 text-xs text-destructive">
          {templateError}
        </div>
      )}

      <CanvasArea
        templates={templates}
        onDeleteTemplate={handleDeleteTemplate}
        isMobile={isMobile}
      />

      {/* Mobile page navigation — portaled to body so fixed bottom-0 is never contained */}
      {mounted && isMobile && canvasPages.length > 1 && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-t border-border bg-section">
          <button
            type="button"
            onClick={() => setPage(currentPageIndex - 1)}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-30 transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            {currentPageIndex + 1} / {canvasPages.length}
          </span>
          <button
            type="button"
            onClick={() => setPage(currentPageIndex + 1)}
            disabled={currentPageIndex === canvasPages.length - 1}
            className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-30 transition-colors hover:text-foreground"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
