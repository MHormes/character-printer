"use client";

import { use, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
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

    const printRoot = document.getElementById("print-all-pages");
    if (!printRoot) return;

    setPdfStatus("exporting");

    const exportHost = document.createElement("div");
    exportHost.setAttribute("aria-hidden", "true");
    exportHost.style.position = "fixed";
    exportHost.style.left = "-100000px";
    exportHost.style.top = "0";
    exportHost.style.pointerEvents = "none";
    exportHost.style.opacity = "0";
    exportHost.style.background = "white";

    try {
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const [{ toJpeg }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const clonedRoot = printRoot.cloneNode(true) as HTMLDivElement;
      clonedRoot.id = "pdf-export-pages";
      clonedRoot.style.display = "block";
      exportHost.appendChild(clonedRoot);
      document.body.appendChild(exportHost);

      const pageNodes = Array.from(clonedRoot.children).filter(
        (node): node is HTMLElement => node instanceof HTMLElement,
      );

      if (pageNodes.length === 0) return;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (const [index, pageNode] of pageNodes.entries()) {
        // Ensure the node is visible and has dimensions
        const width = pageNode.offsetWidth || 794; // fallback to ~210mm at 96dpi
        const height = pageNode.offsetHeight || 1123; // fallback to ~297mm at 96dpi

        const imageData = await toJpeg(pageNode, {
          backgroundColor: "#ffffff",
          cacheBust: true,
          pixelRatio: 2,
          quality: 0.95,
          width: width,
          height: height,
        });

        const pageHeight = (height * 210) / width;

        if (index > 0) {
          pdf.addPage("a4", "portrait");
        }

        pdf.addImage(
          imageData,
          "JPEG",
          0,
          0,
          210,
          pageHeight,
          undefined,
          "FAST",
        );
      }

      const baseName = character?.identity.name?.trim() || "character-sheet";
      const fileName = `${baseName.replace(/[<>:\"/\\|?*\u0000-\u001F]+/g, "-")}.pdf`;
      pdf.save(fileName);
    } finally {
      exportHost.remove();
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
      <header className="flex shrink-0 items-center justify-between bg-primary px-8 py-3">
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
            {character.identity.name || "Canvas"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/forge/${id}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Hammer className="size-4" />
            Forge
          </Link>
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
        </div>
      </header>

      {/* Secondary action bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-section px-8 py-2">
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
              Grid
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
      </div>

      {templateError && (
        <div className="border-b border-border bg-section px-8 py-2 text-xs text-destructive">
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
