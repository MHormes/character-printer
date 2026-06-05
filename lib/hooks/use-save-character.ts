"use client";

import { useState, useRef, useEffect } from "react";
import { saveCharacter } from "@/lib/actions/character";
import type { CharacterData } from "@/lib/types/character";

type UseSaveCharacterOptions = {
  id: string;
  autoSave: boolean;
  autoSaveDeps: unknown[];
  shouldAutoSave: boolean;
  buildSaveData: () => CharacterData;
  setAutoSave: (v: boolean) => void;
};

export function useSaveCharacter({
  id,
  autoSave,
  autoSaveDeps,
  shouldAutoSave,
  buildSaveData,
  setAutoSave,
}: UseSaveCharacterOptions) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildSaveDataRef = useRef(buildSaveData);
  useEffect(() => { buildSaveDataRef.current = buildSaveData; });

  useEffect(() => {
    if (!shouldAutoSave || !autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      await saveCharacter(id, buildSaveDataRef.current(), autoSave);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, autoSave, shouldAutoSave, ...autoSaveDeps]);

  async function handleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    await saveCharacter(id, buildSaveDataRef.current(), autoSave);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handleToggleAutoSave(checked: boolean) {
    setAutoSave(checked);
    await saveCharacter(id, buildSaveDataRef.current(), checked);
  }

  return { saveStatus, handleSave, handleToggleAutoSave };
}
