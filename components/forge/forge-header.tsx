"use client";

import Link from "next/link";
import { ArrowLeft, Layout, Save, Check, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToggleButton } from "@/components/ui/toggle-button";

type ForgeHeaderProps = {
  characterId: string;
  characterName: string;
  saveStatus?: "idle" | "saving" | "saved";
  manualControlsEnabled?: boolean;
  autoSave?: boolean;
  isLoading?: boolean;
  onSave?: () => void;
  onToggleManualControls?: () => void;
  onToggleAutoSave?: (checked: boolean) => void;
};

export function ForgeHeader({
  characterId,
  characterName,
  saveStatus = "idle",
  manualControlsEnabled = false,
  autoSave = false,
  isLoading = false,
  onSave,
  onToggleManualControls,
  onToggleAutoSave,
}: ForgeHeaderProps) {
  return (
    <>
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
            {characterName || "Forge"}
          </span>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2">
            <Link
              href={`/canvas/${characterId}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Layout className="size-4" />
              Canvas
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={onSave}
              disabled={saveStatus === "saving"}
            >
              <Save className="size-4" />
              Save
            </Button>
          </div>
        )}
      </header>

      <div className="flex items-center justify-between border-b border-border bg-section px-8 py-2 shrink-0">
        {!isLoading ? (
          <>
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
                isActive={manualControlsEnabled}
                onClick={onToggleManualControls}
              >
                {manualControlsEnabled ? "Manual on" : "Manual off"}
              </ToggleButton>
              <ToggleButton
                isActive={autoSave}
                onClick={() => onToggleAutoSave?.(!autoSave)}
              >
                Auto-save {autoSave ? "on" : "off"}
              </ToggleButton>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
