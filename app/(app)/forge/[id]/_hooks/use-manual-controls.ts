"use client";

import { useState, useEffect } from "react";

export type ManualSectionId =
  | "coreStats"
  | "savingThrows"
  | "skills"
  | "combat"
  | "trackers"
  | "spells"
  | "otherProficiencies"
  | "actions";

type ForgeManualUiPrefs = {
  manualControlsEnabled: boolean;
  sections: Record<ManualSectionId, boolean>;
};

const DEFAULT_MANUAL_UI_PREFS: ForgeManualUiPrefs = {
  manualControlsEnabled: false,
  sections: {
    coreStats: false,
    savingThrows: false,
    skills: false,
    combat: false,
    trackers: false,
    spells: false,
    otherProficiencies: false,
    actions: false,
  },
};

function getStorageKey(id: string) {
  return `character-printer:forge-ui:${id}`;
}

export function useManualControls(id: string) {
  const [manualUiPrefs, setManualUiPrefs] = useState<ForgeManualUiPrefs>(DEFAULT_MANUAL_UI_PREFS);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      const raw = window.localStorage.getItem(getStorageKey(id));
      if (!raw) {
        setManualUiPrefs(DEFAULT_MANUAL_UI_PREFS);
        setLoadedForId(id);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Partial<ForgeManualUiPrefs>;
        setManualUiPrefs({
          manualControlsEnabled: parsed.manualControlsEnabled ?? false,
          sections: { ...DEFAULT_MANUAL_UI_PREFS.sections, ...(parsed.sections ?? {}) },
        });
      } catch {
        setManualUiPrefs(DEFAULT_MANUAL_UI_PREFS);
      }
      setLoadedForId(id);
    });
  }, [id]);

  useEffect(() => {
    if (loadedForId !== id) return;
    window.localStorage.setItem(getStorageKey(id), JSON.stringify(manualUiPrefs));
  }, [id, loadedForId, manualUiPrefs]);

  function toggleManualControls() {
    setManualUiPrefs((current) => {
      const turningOn = !current.manualControlsEnabled;
      return {
        ...current,
        manualControlsEnabled: turningOn,
        sections: turningOn
          ? (Object.fromEntries(
              Object.keys(current.sections).map((k) => [k, true]),
            ) as Record<ManualSectionId, boolean>)
          : current.sections,
      };
    });
  }

  function setManualSection(section: ManualSectionId, visible: boolean) {
    setManualUiPrefs((current) => ({
      ...current,
      sections: { ...current.sections, [section]: visible },
    }));
  }

  function isManualSectionVisible(section: ManualSectionId) {
    return manualUiPrefs.manualControlsEnabled && manualUiPrefs.sections[section];
  }

  return {
    manualControlsEnabled: manualUiPrefs.manualControlsEnabled,
    isManualSectionVisible,
    toggleManualControls,
    setManualSection,
  };
}
