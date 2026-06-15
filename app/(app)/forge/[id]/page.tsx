"use client";

import { use, useState, useEffect, useLayoutEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCharacterStore } from "@/lib/store/character-store";
import { useTourStore } from "@/lib/store/tour-store";
import { TOUR_STEPS } from "@/lib/tour/tour-steps";
import { TourOverlay } from "@/components/tour/tour-overlay";
import { loadCharacter } from "@/lib/actions/character";
import { useSaveCharacter } from "@/lib/hooks/use-save-character";
import type { ItemRow } from "@/lib/actions/5e-data";
import { ClassChoicesPanel } from "@/components/forge/class-choices-panel";
import type { ResolvedEquipmentItem } from "@/components/forge/class-choices-panel";
import { RaceChoicesPanel } from "@/components/forge/race-choices-panel";
import { BackgroundChoicesPanel } from "@/components/forge/background-choices-panel";
import { StringField } from "@/components/forge/string-field";
import { ClassesField } from "@/components/forge/classes-field";
import { RaceField } from "@/components/forge/race-field";
import { BackgroundField } from "@/components/forge/background-field";
import { StatBlock } from "@/components/forge/stat-block";
import { SaveBlock } from "@/components/forge/save-block";
import { SkillsBlock } from "@/components/forge/skills-block";
import { OtherProficienciesBlock } from "@/components/forge/other-proficiencies-block";
import { CombatBlock } from "@/components/forge/combat-block";
import { InventoryBlock } from "@/components/forge/inventory-block";
import { ActionsBlock } from "@/components/forge/actions-block";
import { FeaturesBlock } from "@/components/forge/features-block";
import { TrackersBlock } from "@/components/forge/trackers-block";
import { StatBoxesBlock } from "@/components/forge/stat-boxes-block";
import { GlobalSaveModifierPanel } from "@/components/forge/global-save-modifier-panel";
import { ForgeHeader } from "@/components/forge/forge-header";
import { SpellsBlock } from "@/components/forge/spells-block";
import { CharacteristicsBlock } from "@/components/forge/characteristics-block";
import { BioBlock } from "@/components/forge/bio-block";
import { ForgeSection } from "@/components/forge/forge-section";
import { Loader2, User, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleButton } from "@/components/ui/toggle-button";
import type {
  AttributeKey,
  CharacterData,
  ModifierEntry,
  InventoryItem,
} from "@/lib/types/character";

import {
  resolvePb,
  resolveAttributeMod,
  materializeDynamicModifiers,
} from "@/lib/character/calculations";
import { getRuleSet } from "@/lib/rules";
import { RuleSetProvider } from "@/lib/rules/rule-context";
import {
  deriveSpellSlotBases,
  spellSlotBasesEqual,
  type SpellSlotBaseMap,
  type SpellSlotClassLike,
} from "@/lib/character/spell-slots";
import {
  applyRace,
  applyClasses,
  applyBackground,
  applyClassStartingEquipment,
  applyItemFromSrdToCharacter,
  clearRaceAutomation,
  clearBackgroundAutomation,
} from "@/lib/character/apply-srd";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  SAVE_LABELS,
} from "@/lib/character/defaults";
import { useSrdData } from "./_hooks/use-srd-data";
import {
  useManualControls,
  type ManualSectionId,
} from "./_hooks/use-manual-controls";
import { usePendingChoices } from "./_hooks/use-pending-choices";

function TourInitializer({ characterId }: { characterId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startTour = useTourStore((s) => s.startTour);

  useEffect(() => {
    if (searchParams.get("tour") === "true") {
      startTour(characterId);
      router.replace(`/forge/${characterId}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function ForgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    manualControlsEnabled,
    isManualSectionVisible,
    toggleManualControls,
    setManualSection,
  } = useManualControls(id);

  const tourActive = useTourStore((s) => s.active);
  const tourStep = useTourStore((s) => s.step);

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const clearCharacter = useCharacterStore((s) => s.clearCharacter);
  const character = useCharacterStore((s) => s.character);
  const autoSave = useCharacterStore((s) => s.autoSave);
  const setAutoSave = useCharacterStore((s) => s.setAutoSave);
  const isDirty = useCharacterStore((s) => s.isDirty);
  const updateIdentityField = useCharacterStore((s) => s.updateIdentityField);

  const setSelectionIgnore = useCharacterStore((s) => s.setSelectionIgnore);
  const updateAttributeBase = useCharacterStore((s) => s.updateAttributeBase);
  const setAttributeStack = useCharacterStore((s) => s.setAttributeStack);
  const setAttributeOverride = useCharacterStore((s) => s.setAttributeOverride);
  const setSaveProficiency = useCharacterStore((s) => s.setSaveProficiency);
  const setSaveStack = useCharacterStore((s) => s.setSaveStack);
  const setSaveOverride = useCharacterStore((s) => s.setSaveOverride);
  const setGlobalSaveStack = useCharacterStore((s) => s.setGlobalSaveStack);
  const setSkillState = useCharacterStore((s) => s.setSkillState);
  const setSkillOverride = useCharacterStore((s) => s.setSkillOverride);
  const setPassivePerceptionStack = useCharacterStore(
    (s) => s.setPassivePerceptionStack,
  );
  const setPassivePerceptionOverride = useCharacterStore(
    (s) => s.setPassivePerceptionOverride,
  );
  const setClasses = useCharacterStore((s) => s.setClasses);
  const setOtherProficiencies = useCharacterStore(
    (s) => s.setOtherProficiencies,
  );
  const setGlobalSkillStack = useCharacterStore((s) => s.setGlobalSkillStack);
  const setJackOfAllTrades = useCharacterStore((s) => s.setJackOfAllTrades);
  const setJackOfAllTradesSaves = useCharacterStore(
    (s) => s.setJackOfAllTradesSaves,
  );
  const setAc = useCharacterStore((s) => s.setAc);
  const setInitiative = useCharacterStore((s) => s.setInitiative);
  const setSpeed = useCharacterStore((s) => s.setSpeed);
  const setHp = useCharacterStore((s) => s.setHp);
  const setInventory = useCharacterStore((s) => s.setInventory);
  const setActions = useCharacterStore((s) => s.setActions);
  const setFeatures = useCharacterStore((s) => s.setFeatures);
  const setTrackers = useCharacterStore((s) => s.setTrackers);
  const setStatBoxes = useCharacterStore((s) => s.setStatBoxes);
  const setSpellCastingStat = useCharacterStore((s) => s.setSpellCastingStat);
  const setSpellSlots = useCharacterStore((s) => s.setSpellSlots);
  const setSpellList = useCharacterStore((s) => s.setSpellList);
  const updateCharacteristicsField = useCharacterStore(
    (s) => s.updateCharacteristicsField,
  );
  const updateBioField = useCharacterStore((s) => s.updateBioField);
  const setPortraitImage = useCharacterStore((s) => s.setPortraitImage);
  const replaceCharacter = useCharacterStore((s) => s.replaceCharacter);

  const { saveStatus, handleSave, handleToggleAutoSave } = useSaveCharacter({
    id,
    autoSave,
    autoSaveDeps: [character, isDirty],
    shouldAutoSave: !!character && isDirty,
    buildSaveData: () => {
      const d = structuredClone(character!);
      materializeDynamicModifiers(d);
      return d;
    },
    setAutoSave,
  });

  const [identityTab, setIdentityTab] = useState<
    "basics" | "characteristics" | "bio"
  >("basics");
  const [openChoicePanel, setOpenChoicePanel] = useState<
    "race" | "background" | null
  >(null);
  const [openGainedPanel, setOpenGainedPanel] = useState<
    "race" | "background" | "class" | null
  >(null);
  const [tourForceShowDismissed, setTourForceShowDismissed] = useState(false);
  const [tourForceExpandModifiers, setTourForceExpandModifiers] = useState(false);

  const srdSystem = character ? getRuleSet(character.edition).srdSystem : null;

  const {
    availableClasses,
    availableSpellSlotRows,
    availableRaces,
    availableSubraces,
    availableSubclasses,
    availableBackgrounds,
    allClassFeatureRows,
    allClassProfRows,
    allRaceTraitRows,
    allClassSkillChoiceRows,
    allRaceAsiBonusRows,
    allRaceAsiOptionRows,
    allRaceSkillChoiceRows,
    allRaceLanguageChoiceRows,
    allRaceProficiencyRows,
    availableLanguages,
    availableTools,
    availableFeats,
    allClassStartEquipRows,
    allClassStartEquipOptionRows,
    availableRaceCantrips,
  } = useSrdData(
    srdSystem,
    character?.identity.race ?? "",
    character?.identity.subrace ?? "",
  );

  useEffect(() => {
    clearCharacter();
    loadCharacter(id).then((res) => {
      if (res) setCharacter(res.data, res.autoSave);
    });
  }, [id, clearCharacter, setCharacter]);

  // Tour orchestration — expand sections and open panels as needed per step
  useEffect(() => {
    if (!tourActive) return;
    const step = TOUR_STEPS[tourStep];
    if (!step) return;

    if (step.requiredSection) {
      const storageKey = `forge-section-collapsed:${id}:${step.requiredSection}`;
      localStorage.setItem(storageKey, "false");
    }

    if (step.flags?.openGainedPanel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenGainedPanel("race");
    }

    if (step.flags?.openChoicesPanel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenChoicePanel("race");
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourForceShowDismissed(step.flags?.openDismissed ?? false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourForceExpandModifiers(step.flags?.expandModifiers ?? false);

    if (step.flags?.enableManual && !manualControlsEnabled) {
      toggleManualControls();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive, tourStep, id]);

  useEffect(() => {
    if (
      !character ||
      availableClasses.length === 0 ||
      availableSpellSlotRows.length === 0
    ) {
      return;
    }

    const derivedBases = deriveSpellSlotBases({
      classes: character.identity.classes,
      availableClasses: availableClasses as SpellSlotClassLike[],
      slotRows: availableSpellSlotRows,
    });
    const currentBases = Object.fromEntries(
      Object.entries(character.spells.slots).map(([level, slot]) => [
        level,
        slot.base,
      ]),
    ) as SpellSlotBaseMap;

    if (spellSlotBasesEqual(currentBases, derivedBases)) return;

    setSpellSlots(
      Object.fromEntries(
        Object.entries(character.spells.slots).map(([level, slot]) => [
          level,
          { ...slot, base: derivedBases[level] ?? 0 },
        ]),
      ),
    );
  }, [availableClasses, availableSpellSlotRows, character, setSpellSlots]);

  // Keep a ref so the SRD effect can read the latest character without `character` being a dep.
  const characterRef = useRef(character);
  useLayoutEffect(() => {
    characterRef.current = character;
  });

  // Single combined effect: apply race → class → background in sequence so each transform
  // sees the output of the previous. This prevents a race condition where separate effects
  // fire in the same render cycle and overwrite each other via stale ref snapshots.
  const classStateKey = (character?.identity.classes ?? [])
    .filter((c) => c.classId)
    .map((c) => `${c.classId}:${c.level}`)
    .join(",");
  const classChoicesKey = (character?.classChoices ?? [])
    .map((c) => `${c.id}:${c.type}:${c.featId || c.skillKey || "asi"}`)
    .join(",");
  const fullClassKey = `${classStateKey}|${classChoicesKey}`;

  // Subclass state key — drives re-render when subclass picks change
  const subclassStateKey = (character?.identity.classes ?? [])
    .filter((c) => c.classId)
    .map((c) => `${c.classId}|${c.subclassId ?? ""}:${c.level}`)
    .join(",");

  const raceKey = `${character?.identity.race ?? ""}::${character?.identity.subrace ?? ""}`;
  const raceChoicesKey = (character?.raceChoices ?? [])
    .map((c) => `${c.id}:${c.type}:${c.skillKey || "asi"}`)
    .join(",");
  const fullRaceKey = `${raceKey}|${raceChoicesKey}`;

  const bgKey = character?.identity.background ?? "";
  const ignoreKey = `${character?.selectionIgnores?.race ? "race-off" : "race-on"}|${character?.selectionIgnores?.background ? "bg-off" : "bg-on"}`;

  const srdKey = `${fullClassKey}|${fullRaceKey}|${bgKey}|${ignoreKey}|${subclassStateKey}`;

  useEffect(() => {
    const char = characterRef.current;
    if (
      !char ||
      char.mode === "npc" ||
      availableRaces.length === 0 ||
      availableBackgrounds.length === 0
    )
      return;

    let updated = structuredClone(char);
    let changed = false;

    // 1. Class features + primary-class saving throw proficiencies
    //    Migration: 2024 chars processed when class features were missing in DB
    //    get a forced re-run so features populate correctly.
    const noClassFeaturesYet =
      char.edition === "2024" &&
      allClassFeatureRows.length > 0 &&
      char.identity.classes.some((c) => c.classId) &&
      !char.features.some((f) => f.sourceId?.startsWith("class:")) &&
      !!char.automationKeys?.srdClassKey;

    const subclassChanged =
      (char.automationKeys?.srdSubclassKey ?? "") !== subclassStateKey;
    if (
      char.automationKeys?.srdClassKey !== fullClassKey ||
      subclassChanged ||
      noClassFeaturesYet
    ) {
      if (noClassFeaturesYet) {
        // Clear the stored key so applyClasses re-processes from level 0
        updated.automationKeys = {
          ...updated.automationKeys,
          srdClassKey: undefined,
        };
      }
      updated = applyClasses(
        updated,
        char.identity.classes,
        allClassFeatureRows,
        allClassProfRows,
        char.automationKeys?.srdClassKey,
      );
      updated.automationKeys = {
        ...updated.automationKeys,
        srdClassKey: fullClassKey,
      };
      changed = true;
    }

    // 1b. Starting equipment
    if (
      allClassStartEquipRows.length > 0 &&
      char.automationKeys?.srdClassKey !== fullClassKey
    ) {
      updated = applyClassStartingEquipment(
        updated,
        char.identity.classes,
        allClassStartEquipRows,
        char.automationKeys?.srdClassKey,
      );
      changed = true;
    }

    // 2. Race traits + speed
    const currentRaceKey = char.selectionIgnores?.race
      ? "ignored"
      : fullRaceKey;
    if (char.automationKeys?.srdRaceKey !== currentRaceKey) {
      if (char.identity.race && !char.selectionIgnores?.race) {
        const matchedRace = availableRaces.find(
          (r) => r.name.toLowerCase() === char.identity.race.toLowerCase(),
        );
        if (matchedRace) {
          const raceTraits = allRaceTraitRows.filter(
            (t) => t.raceId === matchedRace.id,
          );
          const matchedSubrace = char.identity.subrace
            ? availableSubraces.find(
                (s) =>
                  s.raceId === matchedRace.id &&
                  s.name.toLowerCase() === char.identity.subrace.toLowerCase(),
              )
            : undefined;
          const subraceTraits = matchedSubrace
            ? allRaceTraitRows.filter((t) => t.subraceId === matchedSubrace.id)
            : undefined;
          updated = applyRace(
            updated,
            matchedRace,
            raceTraits,
            allRaceAsiBonusRows,
            char.raceChoices ?? [],
            char.automationKeys?.srdRaceKey,
            matchedSubrace,
            subraceTraits,
            allRaceProficiencyRows,
            allRaceLanguageChoiceRows,
          );
        }
      } else {
        updated = clearRaceAutomation(updated);
      }
      updated.automationKeys = {
        ...updated.automationKeys,
        srdRaceKey: currentRaceKey,
      };
      changed = true;
    }

    // 3. Background skill proficiencies
    const currentBgKey = char.selectionIgnores?.background ? "ignored" : bgKey;
    if (updated.automationKeys?.srdBackgroundKey !== currentBgKey) {
      if (char.identity.background && !char.selectionIgnores?.background) {
        const bgRow = availableBackgrounds.find(
          (b) =>
            b.name.toLowerCase() === char.identity.background.toLowerCase(),
        );
        if (bgRow) updated = applyBackground(updated, bgRow);
      } else {
        updated = clearBackgroundAutomation(updated);
      }
      updated.automationKeys = {
        ...updated.automationKeys,
        srdBackgroundKey: currentBgKey,
      };
      changed = true;
    }

    if (changed) {
      replaceCharacter(updated);
    }
    // srdKey captures all identity-level changes; static arrays change once at load.
    // Intentionally omitting `character` to avoid infinite loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    srdKey,
    allClassFeatureRows,
    allClassProfRows,
    allRaceTraitRows,
    availableRaces,
    availableSubraces,
    availableBackgrounds,
    allRaceAsiBonusRows,
    allClassStartEquipRows,
  ]);

  const {
    pendingChoices,
    equipmentPendingChoices,
    multiclassWarnings,
    racePendingChoices,
    raceLanguagePendingChoices,
    raceToolPendingChoices,
    raceCantripPendingChoices,
    backgroundPendingChoices,
  } = usePendingChoices(character, {
    availableRaces,
    availableSubraces,
    availableBackgrounds,
    availableRaceCantrips,
    allClassFeatureRows,
    allClassSkillChoiceRows,
    allClassStartEquipOptionRows,
    allRaceAsiOptionRows,
    allRaceSkillChoiceRows,
    allRaceLanguageChoiceRows,
  });

  function handleConfirmRaceChoice(
    choices: import("@/lib/types/character").RaceChoiceMade[],
  ) {
    if (!character) return;
    const existing = character.raceChoices ?? [];
    replaceCharacter({ ...character, raceChoices: [...existing, ...choices] });
  }

  function handleDismissClassChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedClassChoiceKeys: [
        ...(character.dismissedClassChoiceKeys ?? []),
        choiceKey,
      ],
    });
  }

  function handleDismissRaceChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedRaceChoiceKeys: [
        ...(character.dismissedRaceChoiceKeys ?? []),
        choiceKey,
      ],
    });
  }

  function handleDismissMulticlassWarning(key: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedMulticlassWarningKeys: [
        ...(character.dismissedMulticlassWarningKeys ?? []),
        key,
      ],
    });
  }

  function handleConfirmRaceLanguageChoice(
    choices: import("@/lib/types/character").LanguageChoiceMade[],
  ) {
    if (!character) return;
    const newLangChoices = [...(character.languageChoices ?? []), ...choices];
    const updated = structuredClone(character);
    updated.languageChoices = newLangChoices;
    // Eagerly re-apply race language proficiencies
    updated.otherProficiencies = updated.otherProficiencies.filter(
      (p) =>
        !(
          (p.sourceId?.startsWith("race:") ||
            p.sourceId?.startsWith("subrace:")) &&
          p.sourceId?.endsWith(":lang")
        ),
    );
    for (const c of newLangChoices) {
      if (c.sourceId.startsWith("race:") || c.sourceId.startsWith("subrace:")) {
        updated.otherProficiencies.push({
          id: crypto.randomUUID(),
          name: c.languageName,
          category: "Language",
          training: "Proficient",
          stat: null,
          override: null,
          sourceId: `${c.sourceId}:lang`,
        });
      }
    }
    replaceCharacter(updated);
  }

  function handleConfirmRaceToolChoice(
    choice: import("@/lib/types/character").RaceToolChoiceMade,
  ) {
    if (!character) return;
    replaceCharacter({
      ...character,
      raceToolChoices: [...(character.raceToolChoices ?? []), choice],
    });
  }

  function handleConfirmRaceCantripChoice(
    choice: import("@/lib/types/character").RaceCantripChoiceMade,
  ) {
    if (!character) return;
    const updated = structuredClone(character);
    updated.raceCantripChoices = [
      ...(updated.raceCantripChoices ?? []),
      choice,
    ];
    // Clear any existing cantrip entry for this source then add the new one
    updated.spells.list = updated.spells.list.filter(
      (s) => s.sourceId !== `${choice.sourceId}:cantrip`,
    );
    updated.spells.list.push({
      id: crypto.randomUUID(),
      name: choice.spellName,
      level: choice.spellLevel,
      school: choice.spellSchool,
      castingTime: choice.spellCastingTime,
      range: choice.spellRange,
      duration: choice.spellDuration,
      mode: "Plain",
      castingStat: null,
      fixedDC: null,
      saveStat: null,
      damageStack: [],
      description: choice.spellDescription,
      upcastDescription: "",
      components: choice.spellComponents,
      tags: { ...choice.spellTags, prepared: true },
      sourceId: `${choice.sourceId}:cantrip`,
    });
    replaceCharacter(updated);
  }

  function handleConfirmBackgroundAsi(
    choice: import("@/lib/types/character").BackgroundChoiceMade,
  ) {
    if (!character) return;
    const existing = character.backgroundChoices ?? [];
    replaceCharacter({
      ...character,
      backgroundChoices: [...existing, choice],
    });
  }

  function handleConfirmBackgroundLanguage(
    choices: import("@/lib/types/character").LanguageChoiceMade[],
    _backgroundId: string,
  ) {
    if (!character) return;
    const bgRow = availableBackgrounds.find(
      (b) =>
        b.name.toLowerCase() === character.identity.background.toLowerCase(),
    );
    if (!bgRow) return;
    const newLangChoices = [...(character.languageChoices ?? []), ...choices];
    const updated = structuredClone(character);
    updated.languageChoices = newLangChoices;
    // Eagerly re-apply background language proficiencies
    updated.otherProficiencies = updated.otherProficiencies.filter(
      (p) => p.sourceId !== `background:${bgRow.id}:lang`,
    );
    for (const c of newLangChoices.filter(
      (c) => c.sourceId === `background:${bgRow.id}`,
    )) {
      updated.otherProficiencies.push({
        id: crypto.randomUUID(),
        name: c.languageName,
        category: "Language",
        training: "Proficient",
        stat: null,
        override: null,
        sourceId: `background:${bgRow.id}:lang`,
      });
    }
    replaceCharacter(updated);
  }

  function handleConfirmBackgroundTool(
    choice: import("@/lib/types/character").ToolChoiceMade,
  ) {
    if (!character) return;
    const bgRow = availableBackgrounds.find(
      (b) =>
        b.name.toLowerCase() === character.identity.background.toLowerCase(),
    );
    if (!bgRow) return;

    type ToolChoiceMeta = {
      count?: number;
      category?: string;
      label: string;
      addToInventory?: boolean;
      inventoryOnly?: boolean;
      options?: { name: string }[];
    };
    const toolChoiceMeta: ToolChoiceMeta[] = bgRow.toolChoicesJson
      ? typeof bgRow.toolChoicesJson === "string"
        ? JSON.parse(bgRow.toolChoicesJson)
        : (bgRow.toolChoicesJson as unknown as ToolChoiceMeta[])
      : [];

    const newToolChoices = [...(character.toolChoices ?? []), choice];
    const updated = structuredClone(character);
    updated.toolChoices = newToolChoices;

    // Eagerly re-apply background tool proficiencies
    updated.otherProficiencies = updated.otherProficiencies.filter(
      (p) => p.sourceId !== `background:${bgRow.id}:tool`,
    );
    for (const tc of newToolChoices.filter(
      (c) => c.backgroundId === bgRow.id,
    )) {
      const meta = toolChoiceMeta[tc.choiceIndex] as ToolChoiceMeta | undefined;
      if (!meta?.inventoryOnly) {
        updated.otherProficiencies.push({
          id: crypto.randomUUID(),
          name: tc.toolName,
          category: "Tool",
          training: "Proficient",
          stat: null,
          override: null,
          sourceId: `background:${bgRow.id}:tool`,
        });
      }
    }

    // Eagerly re-apply tool-choice inventory items
    updated.inventory = updated.inventory.filter(
      (i) => i.sourceId !== `bg-tool:${bgRow.id}`,
    );
    for (const tc of newToolChoices.filter(
      (c) => c.backgroundId === bgRow.id,
    )) {
      const meta = toolChoiceMeta[tc.choiceIndex] as ToolChoiceMeta | undefined;
      if (meta?.addToInventory || meta?.inventoryOnly) {
        updated.inventory.push({
          id: crypto.randomUUID(),
          name: tc.toolName,
          quantity: meta?.count ?? 1,
          weight: 0,
          category: meta?.inventoryOnly && !meta?.category ? "Mundane" : "Tool",
          equipped: true,
          modifiers: [],
          sourceId: `bg-tool:${bgRow.id}`,
        });
      }
    }

    replaceCharacter(updated);
  }

  function handleDismissBackgroundChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedBackgroundChoiceKeys: [
        ...(character.dismissedBackgroundChoiceKeys ?? []),
        choiceKey,
      ],
    });
  }

  function handleDismissEquipmentChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedEquipmentChoiceKeys: [
        ...(character.dismissedEquipmentChoiceKeys ?? []),
        choiceKey,
      ],
    });
  }

  function handleRevertClassChoice(key: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedClassChoiceKeys: character.dismissedClassChoiceKeys?.filter(
        (k) => k !== key,
      ),
      dismissedEquipmentChoiceKeys:
        character.dismissedEquipmentChoiceKeys?.filter((k) => k !== key),
    });
  }

  function handleRevertRaceChoice(key: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedRaceChoiceKeys: character.dismissedRaceChoiceKeys?.filter(
        (k) => k !== key,
      ),
    });
  }

  function handleRevertBackgroundChoice(key: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedBackgroundChoiceKeys:
        character.dismissedBackgroundChoiceKeys?.filter((k) => k !== key),
    });
  }

  function setRaceAutomationIgnored(ignored: boolean) {
    setSelectionIgnore("race", ignored);
  }

  function setBackgroundAutomationIgnored(ignored: boolean) {
    setSelectionIgnore("background", ignored);
  }

  function handleConfirmEquipmentChoice(
    classId: string,
    choiceIndex: number,
    items: ResolvedEquipmentItem[],
  ) {
    if (!character) return;
    const existing = character.equipmentChoicesMade ?? [];
    let updated: CharacterData = {
      ...character,
      inventory: [
        ...character.inventory,
        ...items.map((item) => item.inventoryItem),
      ],
      equipmentChoicesMade: [
        ...existing,
        { id: crypto.randomUUID(), classId, choiceIndex },
      ],
    };

    for (const item of items) {
      if (item.srdItem) {
        updated = applyItemFromSrdToCharacter(
          updated,
          item.srdItem,
          item.inventoryItem.id,
        )!;
      }
    }

    replaceCharacter(updated);
  }

  function handleConfirmChoice(
    choices:
      | import("@/lib/types/character").ClassChoiceMade
      | import("@/lib/types/character").ClassChoiceMade[],
  ) {
    if (!character) return;
    const incoming = Array.isArray(choices) ? choices : [choices];
    const existing = character.classChoices ?? [];
    const newClassChoices = [...existing, ...incoming];

    if (allClassFeatureRows.length > 0 && allClassProfRows.length > 0) {
      // Apply immediately so stats/skills update without waiting for the SRD effect
      const newChoicesKey = newClassChoices
        .map((c) => `${c.id}:${c.type}:${c.featId || c.skillKey || "asi"}`)
        .join(",");
      const newFullClassKey = `${classStateKey}|${newChoicesKey}`;
      const withChoices: CharacterData = {
        ...character,
        classChoices: newClassChoices,
      };
      const applied = applyClasses(
        withChoices,
        withChoices.identity.classes,
        allClassFeatureRows,
        allClassProfRows,
        character.automationKeys?.srdClassKey,
      );
      applied.automationKeys = {
        ...applied.automationKeys,
        srdClassKey: newFullClassKey,
      };
      replaceCharacter(applied);
    } else {
      replaceCharacter({ ...character, classChoices: newClassChoices });
    }
  }

  function applyItemFromSrd(srdItem: ItemRow, invItem: InventoryItem) {
    if (!character) return;

    // Start with a character that already has the item in inventory
    const withItem: CharacterData = {
      ...character,
      inventory: [...character.inventory, invItem],
    };

    // Apply SRD-specific effects (attacks, AC modes, features, etc)
    const updated = applyItemFromSrdToCharacter(withItem, srdItem, invItem.id);
    if (updated) {
      replaceCharacter(updated);
    }
  }

  if (!character)
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ForgeHeader characterId={id} characterName="" isLoading />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      </div>
    );

  const {
    identity,
    attributes,
    saves,
    saveGlobalStack,
    skills,
    skillGlobalStack,
    passivePerception,
    jackOfAllTrades,
    jackOfAllTradesSaves,
    otherProficiencies,
    combat,
    inventory,
    actions,
    features,
    trackers,
    statBoxes,
    spells,
  } = character;
  const pb = resolvePb(character);

  function renderManualSectionToggle(section: ManualSectionId) {
    if (!manualControlsEnabled) return null;
    const visible = isManualSectionVisible(section);
    return (
      <ToggleButton
        isActive={visible}
        onClick={() => setManualSection(section, !visible)}
        data-tour-id={section === "coreStats" ? "corestat-manual-toggle" : undefined}
      >
        {visible ? "Hide manual" : "Show manual"}
      </ToggleButton>
    );
  }

  const tourRequiredSection = tourActive
    ? (TOUR_STEPS[tourStep]?.requiredSection ?? null)
    : null;

  return (
    <RuleSetProvider edition={character.edition}>
      <div className="min-h-screen flex flex-col bg-background">
        <ForgeHeader
          characterId={id}
          characterName={identity.name}
          saveStatus={saveStatus}
          manualControlsEnabled={manualControlsEnabled}
          autoSave={autoSave}
          onSave={handleSave}
          onToggleManualControls={toggleManualControls}
          onToggleAutoSave={handleToggleAutoSave}
        />

        <main className="space-y-4 p-4 flex-1">
          <ForgeSection
            title="Identity"
            className="space-y-4"
            collapsible={true}
            forceExpanded={tourRequiredSection === "Identity"}
            headerTourId="identity-section-header"
            headerAction={
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                <Button
                  variant={identityTab === "basics" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setIdentityTab("basics")}
                  className="h-7 px-2 hover:text-card-foreground"
                >
                  <User className="size-3 md:mr-1" />
                  <span className="hidden md:inline">Basics</span>
                </Button>
                <Button
                  variant={
                    identityTab === "characteristics" ? "secondary" : "ghost"
                  }
                  size="xs"
                  onClick={() => setIdentityTab("characteristics")}
                  className="h-7 px-2 hover:text-card-foreground"
                >
                  <MessageSquare className="size-3 md:mr-1" />
                  <span className="hidden md:inline">Characteristics</span>
                </Button>
                <Button
                  variant={identityTab === "bio" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setIdentityTab("bio")}
                  className="h-7 px-2 hover:text-card-foreground"
                >
                  <BookOpen className="size-3 md:mr-1" />
                  <span className="hidden md:inline">Bio & Appearance</span>
                </Button>
              </div>
            }
          >
            {identityTab === "basics" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
                  <StringField
                    label="Name"
                    value={identity.name}
                    onChange={(v) => updateIdentityField("name", v)}
                    placeholder="Character name"
                  />
                  <div className="col-span-2 space-y-2">
                    <RaceField
                      race={identity.race}
                      subrace={identity.subrace}
                      ignoreAutomation={
                        character.selectionIgnores?.race ?? false
                      }
                      onRaceChange={(v) => updateIdentityField("race", v)}
                      onSubraceChange={(v) => updateIdentityField("subrace", v)}
                      onIgnoreAutomationChange={setRaceAutomationIgnored}
                      availableRaces={availableRaces}
                      availableSubraces={availableSubraces}
                    />
                    {character.mode !== "npc" && (
                      <RaceChoicesPanel
                        pendingChoices={racePendingChoices}
                        languagePendingChoices={raceLanguagePendingChoices}
                        toolPendingChoices={raceToolPendingChoices}
                        cantripPendingChoices={raceCantripPendingChoices}
                        languages={availableLanguages}
                        tools={availableTools}
                        cantrips={availableRaceCantrips}
                        alreadyChosenLanguageIds={(
                          character.languageChoices ?? []
                        )
                          .filter(
                            (c) =>
                              c.sourceId.startsWith("race:") ||
                              c.sourceId.startsWith("subrace:"),
                          )
                          .map((c) => c.languageId)}
                        isOpen={openChoicePanel === "race"}
                        onToggle={() =>
                          setOpenChoicePanel((v) =>
                            v === "race" ? null : "race",
                          )
                        }
                        onConfirmChoice={handleConfirmRaceChoice}
                        onConfirmLanguageChoice={
                          handleConfirmRaceLanguageChoice
                        }
                        onConfirmToolChoice={handleConfirmRaceToolChoice}
                        onConfirmCantripChoice={handleConfirmRaceCantripChoice}
                        onDismissChoice={handleDismissRaceChoice}
                        raceChoices={character.raceChoices ?? []}
                        languageChoices={character.languageChoices ?? []}
                        raceToolChoices={character.raceToolChoices ?? []}
                        raceCantripChoices={character.raceCantripChoices ?? []}
                        dismissedRaceChoiceKeys={
                          character.dismissedRaceChoiceKeys ?? []
                        }
                        allRaceAsiBonusRows={allRaceAsiBonusRows}
                        allRaceProficiencyRows={allRaceProficiencyRows}
                        availableRaces={availableRaces}
                        availableSubraces={availableSubraces}
                        currentRaceId={
                          availableRaces.find(
                            (r) =>
                              r.name.toLowerCase() ===
                              identity.race.toLowerCase(),
                          )?.id
                        }
                        currentSubraceId={
                          availableSubraces.find(
                            (s) =>
                              s.name.toLowerCase() ===
                              (identity.subrace ?? "").toLowerCase(),
                          )?.id
                        }
                        gainedIsOpen={openGainedPanel === "race"}
                        onGainedToggle={() =>
                          setOpenGainedPanel((v) =>
                            v === "race" ? null : "race",
                          )
                        }
                        onRevert={handleRevertRaceChoice}
                        forceShowDismissed={tourForceShowDismissed}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <BackgroundField
                      value={identity.background}
                      ignoreAutomation={
                        character.selectionIgnores?.background ?? false
                      }
                      selectedBackground={availableBackgrounds.find(
                        (b) =>
                          b.name.toLowerCase() ===
                          identity.background.toLowerCase(),
                      )}
                      onChange={(v) => updateIdentityField("background", v)}
                      onIgnoreAutomationChange={setBackgroundAutomationIgnored}
                      availableBackgrounds={availableBackgrounds}
                    />
                    {character.mode !== "npc" && (
                      <BackgroundChoicesPanel
                        pendingChoices={backgroundPendingChoices}
                        languages={availableLanguages}
                        tools={availableTools}
                        alreadyChosenLanguageIds={(
                          character.languageChoices ?? []
                        )
                          .filter((c) => c.sourceId.startsWith("background:"))
                          .map((c) => c.languageId)}
                        isOpen={openChoicePanel === "background"}
                        onToggle={() =>
                          setOpenChoicePanel((v) =>
                            v === "background" ? null : "background",
                          )
                        }
                        onConfirmAsi={handleConfirmBackgroundAsi}
                        onConfirmLanguage={handleConfirmBackgroundLanguage}
                        onConfirmTool={handleConfirmBackgroundTool}
                        onDismissChoice={handleDismissBackgroundChoice}
                        backgroundChoices={character.backgroundChoices ?? []}
                        languageChoices={character.languageChoices ?? []}
                        toolChoices={character.toolChoices ?? []}
                        dismissedBackgroundChoiceKeys={
                          character.dismissedBackgroundChoiceKeys ?? []
                        }
                        selectedBackground={availableBackgrounds.find(
                          (b) =>
                            b.name.toLowerCase() ===
                            identity.background.toLowerCase(),
                        )}
                        charInventory={character.inventory}
                        gainedIsOpen={openGainedPanel === "background"}
                        onGainedToggle={() =>
                          setOpenGainedPanel((v) =>
                            v === "background" ? null : "background",
                          )
                        }
                        onRevert={handleRevertBackgroundChoice}
                      />
                    )}
                  </div>
                  <StringField
                    label="Deity"
                    value={identity.deity}
                    onChange={(v) => updateIdentityField("deity", v)}
                    placeholder="e.g. Tyr"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Alignment
                    </label>
                    <select
                      value={identity.alignment}
                      onChange={(e) =>
                        updateIdentityField("alignment", e.target.value)
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-card-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">—</option>
                      <option value="Lawful Good">Lawful Good</option>
                      <option value="Neutral Good">Neutral Good</option>
                      <option value="Chaotic Good">Chaotic Good</option>
                      <option value="Lawful Neutral">Lawful Neutral</option>
                      <option value="True Neutral">True Neutral</option>
                      <option value="Chaotic Neutral">Chaotic Neutral</option>
                      <option value="Lawful Evil">Lawful Evil</option>
                      <option value="Neutral Evil">Neutral Evil</option>
                      <option value="Chaotic Evil">Chaotic Evil</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-3">
                    <ClassesField
                      classes={identity.classes}
                      onChange={setClasses}
                      proficiencyBonus={pb}
                      availableClasses={availableClasses}
                      availableSubclasses={availableSubclasses}
                      onClassPicked={(dbClass) => {
                        if (
                          !spells.globalCastingStat &&
                          dbClass.spellcastingStat
                        ) {
                          setSpellCastingStat(
                            dbClass.spellcastingStat as AttributeKey,
                          );
                        }
                      }}
                    />
                    {character.mode !== "npc" && (
                      <ClassChoicesPanel
                        pendingChoices={pendingChoices}
                        equipmentPendingChoices={equipmentPendingChoices}
                        availableFeats={availableFeats}
                        onConfirmChoice={handleConfirmChoice}
                        onDismissChoice={handleDismissClassChoice}
                        onConfirmEquipmentChoice={handleConfirmEquipmentChoice}
                        onDismissEquipmentChoice={handleDismissEquipmentChoice}
                        multiclassWarnings={multiclassWarnings}
                        onDismissMulticlassWarning={
                          handleDismissMulticlassWarning
                        }
                        classChoices={character.classChoices ?? []}
                        equipmentChoicesMade={
                          character.equipmentChoicesMade ?? []
                        }
                        dismissedClassChoiceKeys={
                          character.dismissedClassChoiceKeys ?? []
                        }
                        dismissedEquipmentChoiceKeys={
                          character.dismissedEquipmentChoiceKeys ?? []
                        }
                        charInventory={character.inventory}
                        allClassProficiencyRows={allClassProfRows}
                        activeClassIds={identity.classes
                          .map((c) => c.classId)
                          .filter((id): id is string => !!id)}
                        availableClasses={availableClasses}
                        gainedIsOpen={openGainedPanel === "class"}
                        onGainedToggle={() =>
                          setOpenGainedPanel((v) =>
                            v === "class" ? null : "class",
                          )
                        }
                        onRevertChoice={handleRevertClassChoice}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {identityTab === "characteristics" && (
              <CharacteristicsBlock
                data={
                  character.characteristics || {
                    personalityTraits: "",
                    ideals: "",
                    bonds: "",
                    flaws: "",
                  }
                }
                onChange={updateCharacteristicsField}
              />
            )}

            {identityTab === "bio" && (
              <BioBlock
                characterId={id}
                bio={
                  character.bio || {
                    appearance: "",
                    backstory: "",
                    allies: "",
                    organizations: "",
                  }
                }
                identity={identity}
                portraitImage={character.portraitImage ?? null}
                onBioChange={updateBioField}
                onIdentityChange={updateIdentityField}
                onPortraitImageChange={setPortraitImage}
              />
            )}
          </ForgeSection>

          <div className="flex flex-col xl:flex-row gap-4 items-start">
            {/* Core stats + saves stacked */}
            <div className="w-full xl:w-1/4 flex flex-col gap-4">
              <ForgeSection
                title="Core Stats"
                headerAction={renderManualSectionToggle("coreStats")}
                collapsible={true}
                forceExpanded={tourRequiredSection === "Core Stats"}
              >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {ATTRIBUTE_KEYS.map((attr) => (
                    <StatBlock
                      key={attr}
                      label={ATTRIBUTE_LABELS[attr]}
                      data={attributes[attr]}
                      attrs={attributes}
                      level={identity.level}
                      pb={pb}
                      showManualControls={isManualSectionVisible("coreStats")}
                      tourId={attr === "str" ? "str" : undefined}
                      forceExpandModifiers={attr === "str" ? tourForceExpandModifiers : undefined}
                      onBaseChange={(v) => updateAttributeBase(attr, v)}
                      onStackChange={(stack: ModifierEntry[]) =>
                        setAttributeStack(attr, stack)
                      }
                      onOverrideChange={(override) =>
                        setAttributeOverride(attr, override)
                      }
                    />
                  ))}
                </div>
              </ForgeSection>

              <ForgeSection
                title="Saving Throws"
                headerAction={renderManualSectionToggle("savingThrows")}
                collapsible={true}
                forceExpanded={tourRequiredSection === "Saving Throws"}
              >
                <div className="grid grid-cols-3 gap-3">
                  {ATTRIBUTE_KEYS.map((attr) => (
                    <SaveBlock
                      key={attr}
                      label={SAVE_LABELS[attr]}
                      data={saves[attr]}
                      tourId={attr === "str" ? "str" : undefined}
                      attrMod={resolveAttributeMod(attributes[attr])}
                      proficiencyBonus={pb}
                      globalStack={saveGlobalStack}
                      attrKey={attr}
                      attrs={attributes}
                      level={identity.level}
                      showManualControls={isManualSectionVisible(
                        "savingThrows",
                      )}
                      onProficiencyChange={(p) => setSaveProficiency(attr, p)}
                      onStackChange={(stack) => setSaveStack(attr, stack)}
                      onOverrideChange={(override) =>
                        setSaveOverride(attr, override)
                      }
                    />
                  ))}
                </div>

                <GlobalSaveModifierPanel
                  stack={saveGlobalStack}
                  onChange={setGlobalSaveStack}
                  isVisible={isManualSectionVisible("savingThrows")}
                  attrs={attributes}
                  level={identity.level}
                  pb={pb}
                />
              </ForgeSection>
            </div>

            {/* Skills */}
            <ForgeSection
              title="Skills"
              className="w-full xl:w-62 shrink-0"
              headerAction={renderManualSectionToggle("skills")}
              collapsible={true}
            >
              <SkillsBlock
                skills={skills}
                attributes={attributes}
                proficiencyBonus={pb}
                level={identity.level}
                jackOfAllTrades={jackOfAllTrades}
                jackOfAllTradesSaves={jackOfAllTradesSaves}
                globalStack={skillGlobalStack}
                passivePerception={passivePerception}
                showManualControls={isManualSectionVisible("skills")}
                onStateChange={setSkillState}
                onOverrideChange={setSkillOverride}
                onJackOfAllTradesChange={setJackOfAllTrades}
                onJackOfAllTradesSavesChange={setJackOfAllTradesSaves}
                onGlobalStackChange={setGlobalSkillStack}
                onPassivePerceptionStackChange={setPassivePerceptionStack}
                onPassivePerceptionOverrideChange={setPassivePerceptionOverride}
              />
            </ForgeSection>

            {/* Other Proficiencies */}
            <ForgeSection
              title="Other Proficiencies"
              className="w-full xl:w-72 min-w-0"
              collapsible={true}
              headerAction={renderManualSectionToggle("otherProficiencies")}
            >
              <OtherProficienciesBlock
                proficiencies={otherProficiencies}
                attributes={attributes}
                proficiencyBonus={pb}
                system={character.edition === "2024" ? "dnd5e_2024" : "dnd5e"}
                showManualControls={isManualSectionVisible(
                  "otherProficiencies",
                )}
                onChange={setOtherProficiencies}
              />
            </ForgeSection>

            {/* Combat */}
            <div className="w-full xl:flex-1 min-w-0 flex flex-col gap-4">
              <ForgeSection
                title="Combat"
                headerAction={renderManualSectionToggle("combat")}
                collapsible={true}
              >
                <CombatBlock
                  data={combat}
                  attributes={attributes}
                  classes={identity.classes}
                  proficiencyBonus={pb}
                  jackOfAllTrades={jackOfAllTrades}
                  showManualControls={isManualSectionVisible("combat")}
                  onAcChange={setAc}
                  onInitiativeChange={setInitiative}
                  onSpeedChange={setSpeed}
                  onHpChange={setHp}
                />
              </ForgeSection>

              <ForgeSection
                title="Attacks & Actions"
                collapsible={true}
                headerAction={renderManualSectionToggle("actions")}
              >
                <ActionsBlock
                  actions={actions}
                  castingStat={spells.globalCastingStat}
                  attributes={attributes}
                  proficiencyBonus={pb}
                  attackStack={spells.attackStack}
                  dcStack={spells.dcStack}
                  showManualControls={isManualSectionVisible("actions")}
                  onChange={setActions}
                  onCastingStatChange={setSpellCastingStat}
                />
              </ForgeSection>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ForgeSection
              title="Features & Traits"
              className="flex-1 min-w-0"
              collapsible={true}
            >
              <FeaturesBlock features={features} onChange={setFeatures} />
            </ForgeSection>

            <ForgeSection
              title="Trackers"
              className="flex-1 min-w-0"
              headerAction={renderManualSectionToggle("trackers")}
              collapsible={true}
            >
              <TrackersBlock
                trackers={trackers}
                showManualControls={isManualSectionVisible("trackers")}
                attributes={attributes}
                level={identity.level}
                pb={pb}
                onChange={setTrackers}
              />
            </ForgeSection>

            <ForgeSection
              title="Custom Stats"
              className="w-full md:w-72 shrink-0"
              collapsible={true}
            >
              <StatBoxesBlock
                statBoxes={statBoxes ?? []}
                onChange={setStatBoxes}
              />
            </ForgeSection>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ForgeSection
              title="Inventory"
              className="w-full md:w-1/3"
              collapsible={true}
            >
              <InventoryBlock
                inventory={inventory}
                onChange={setInventory}
                onSrdItemSelected={applyItemFromSrd}
              />
            </ForgeSection>

            <ForgeSection
              title="Spellcasting"
              className="w-full md:w-2/3"
              headerAction={renderManualSectionToggle("spells")}
              collapsible={true}
            >
              <SpellsBlock
                slots={spells.slots}
                list={spells.list}
                castingStat={spells.globalCastingStat}
                attributes={attributes}
                proficiencyBonus={pb}
                attackStack={spells.attackStack}
                dcStack={spells.dcStack}
                availableClasses={availableClasses}
                characterClasses={identity.classes}
                showManualControls={isManualSectionVisible("spells")}
                onSlotsChange={setSpellSlots}
                onListChange={setSpellList}
                onAddToAttacks={(action) => setActions([...actions, action])}
              />
            </ForgeSection>
          </div>
        </main>
      </div>
      <Suspense fallback={null}>
        <TourInitializer characterId={id} />
      </Suspense>
      <TourOverlay />
    </RuleSetProvider>
  );
}
