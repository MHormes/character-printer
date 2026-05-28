"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
import { useCharacterStore } from "@/lib/store/character-store";
import { loadCharacter, saveCharacter } from "@/lib/actions/character";
import {
  getClasses,
  getClassSpellSlots,
  getRaces,
  getSubraces,
  getSubclasses,
  getBackgrounds,
  getAllClassFeatures,
  getAllClassProficiencies,
  getAllRaceTraits,
  getAllClassSkillChoices,
  getAllRaceAbilityBonuses,
  getAllRaceAbilityBonusOptions,
  getAllRaceSkillChoices,
  getAllRaceLanguageChoices,
  getAllRaceProficiencies,
  getLanguages,
  getTools,
  getCantripsByClass,
  searchFeats,
  getAllClassStartingEquipment,
  getAllClassStartingEquipmentOptions,
} from "@/lib/actions/5e-data";
import type {
  ClassRow,
  RaceRow,
  SubraceRow,
  SubclassRow,
  BackgroundRow,
  SpellSlotRow,
  ItemRow,
  SpellRow,
  ClassFeatureRow,
  ClassProficiencyRow,
  RaceTraitRow,
  ClassSkillChoiceRow,
  FeatRow,
  RaceAbilityBonusRow,
  RaceAbilityBonusOptionRow,
  RaceSkillChoiceRow,
  RaceLanguageChoiceRow,
  RaceProficiencyRow,
  LanguageRow,
  ClassStartingEquipmentRow,
  ClassStartingEquipmentOptionRow,
} from "@/lib/actions/5e-data";
import { ClassChoicesPanel } from "@/components/forge/class-choices-panel";
import type { ResolvedEquipmentItem } from "@/components/forge/class-choices-panel";
import { RaceChoicesPanel } from "@/components/forge/race-choices-panel";
import { BackgroundChoicesPanel } from "@/components/forge/background-choices-panel";
import {
  derivePendingChoices,
  deriveRacePendingChoices,
  deriveRaceLanguagePendingChoices,
  deriveRaceToolPendingChoices,
  deriveRaceCantripPendingChoices,
  deriveEquipmentPendingChoices,
  deriveBackgroundPendingChoices,
  type PendingChoice,
  type RacePendingChoice,
  type RaceLanguagePendingChoice,
  type RaceToolPendingChoice,
  type RaceCantripPendingChoice,
  type EquipmentPendingChoice,
  type BackgroundPendingChoice,
} from "@/lib/character/derive-pending-choices";
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
import { DynamicValueInput } from "@/components/forge/dynamic-value-input";
import { StatBoxesBlock } from "@/components/forge/stat-boxes-block";
import { SpellsBlock } from "@/components/forge/spells-block";
import { CharacteristicsBlock } from "@/components/forge/characteristics-block";
import { BioBlock } from "@/components/forge/bio-block";
import { ForgeSection } from "@/components/forge/forge-section";
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  Circle,
  X,
  Plus,
  Lock,
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Layout,
  User,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToggleButton } from "@/components/ui/toggle-button";
import Link from "next/link";
import type {
  AttributeKey,
  CharacterData,
  ModifierEntry,
  ActionEntry,
  DamageEntry,
  DieType,
  FeatureEntry,
  TrackerEntry,
  InventoryItem,
  Characteristics,
  Bio,
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
  clearRaceAutomation,
  clearBackgroundAutomation,
} from "@/lib/character/apply-srd";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];
const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};
const SAVE_LABELS: Record<AttributeKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

type ManualSectionId =
  | "coreStats"
  | "savingThrows"
  | "skills"
  | "combat"
  | "trackers"
  | "spells";

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
  },
};

function getManualUiStorageKey(id: string) {
  return `character-printer:forge-ui:${id}`;
}

export default function ForgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [globalSaveExpanded, setGlobalSaveExpanded] = useState(false);
  const [manualUiPrefs, setManualUiPrefs] = useState<ForgeManualUiPrefs>(
    DEFAULT_MANUAL_UI_PREFS,
  );
  const [manualUiLoadedForId, setManualUiLoadedForId] = useState<string | null>(
    null,
  );
  const [availableClasses, setAvailableClasses] = useState<ClassRow[]>([]);
  const [availableSpellSlotRows, setAvailableSpellSlotRows] = useState<
    SpellSlotRow[]
  >([]);
  const [availableRaces, setAvailableRaces] = useState<RaceRow[]>([]);
  const [availableSubraces, setAvailableSubraces] = useState<SubraceRow[]>([]);
  const [availableSubclasses, setAvailableSubclasses] = useState<SubclassRow[]>(
    [],
  );
  const [availableBackgrounds, setAvailableBackgrounds] = useState<
    BackgroundRow[]
  >([]);
  const [allClassFeatureRows, setAllClassFeatureRows] = useState<
    ClassFeatureRow[]
  >([]);
  const [allClassProfRows, setAllClassProfRows] = useState<
    ClassProficiencyRow[]
  >([]);
  const [allRaceTraitRows, setAllRaceTraitRows] = useState<RaceTraitRow[]>([]);
  const [allClassSkillChoiceRows, setAllClassSkillChoiceRows] = useState<
    ClassSkillChoiceRow[]
  >([]);
  const [allRaceAsiBonusRows, setAllRaceAsiBonusRows] = useState<
    RaceAbilityBonusRow[]
  >([]);
  const [allRaceAsiOptionRows, setAllRaceAsiOptionRows] = useState<
    RaceAbilityBonusOptionRow[]
  >([]);
  const [allRaceSkillChoiceRows, setAllRaceSkillChoiceRows] = useState<
    RaceSkillChoiceRow[]
  >([]);
  const [allRaceLanguageChoiceRows, setAllRaceLanguageChoiceRows] = useState<
    RaceLanguageChoiceRow[]
  >([]);
  const [allRaceProficiencyRows, setAllRaceProficiencyRows] = useState<
    RaceProficiencyRow[]
  >([]);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageRow[]>([]);
  const [availableTools, setAvailableTools] = useState<ItemRow[]>([]);
  const [availableFeats, setAvailableFeats] = useState<FeatRow[]>([]);
  const [allClassStartEquipRows, setAllClassStartEquipRows] = useState<
    ClassStartingEquipmentRow[]
  >([]);
  const [allClassStartEquipOptionRows, setAllClassStartEquipOptionRows] =
    useState<ClassStartingEquipmentOptionRow[]>([]);
  const [availableRaceCantrips, setAvailableRaceCantrips] = useState<SpellRow[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [identityTab, setIdentityTab] = useState<
    "basics" | "characteristics" | "bio"
  >("basics");
  const [openChoicePanel, setOpenChoicePanel] = useState<"race" | "background" | null>(null);

  const srdSystem = character ? getRuleSet(character.edition).srdSystem : null;

  useEffect(() => {
    clearCharacter();
    loadCharacter(id).then((res) => {
      if (res) setCharacter(res.data, res.autoSave);
    });
  }, [id, clearCharacter, setCharacter]);

  useEffect(() => {
    Promise.resolve().then(() => {
      const raw = window.localStorage.getItem(getManualUiStorageKey(id));
      if (!raw) {
        setManualUiPrefs(DEFAULT_MANUAL_UI_PREFS);
        setManualUiLoadedForId(id);
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
      setManualUiLoadedForId(id);
    });
  }, [id]);

  useEffect(() => {
    if (manualUiLoadedForId !== id) return;
    window.localStorage.setItem(
      getManualUiStorageKey(id),
      JSON.stringify(manualUiPrefs),
    );
  }, [id, manualUiLoadedForId, manualUiPrefs]);

  useEffect(() => {
    if (!srdSystem) return;
    getClasses(srdSystem).then(setAvailableClasses);
    getClassSpellSlots(srdSystem).then(setAvailableSpellSlotRows);
    getRaces(srdSystem).then(setAvailableRaces);
    getSubraces(undefined, srdSystem).then(setAvailableSubraces);
    getSubclasses(undefined, srdSystem).then(setAvailableSubclasses);
    getBackgrounds(srdSystem).then(setAvailableBackgrounds);
    getAllClassFeatures(srdSystem).then(setAllClassFeatureRows);
    getAllClassProficiencies(srdSystem).then(setAllClassProfRows);
    getAllRaceTraits(srdSystem).then(setAllRaceTraitRows);
    getAllClassSkillChoices(srdSystem).then(setAllClassSkillChoiceRows);
    getAllRaceAbilityBonuses(srdSystem).then(setAllRaceAsiBonusRows);
    getAllRaceAbilityBonusOptions(srdSystem).then(setAllRaceAsiOptionRows);
    getAllRaceSkillChoices(srdSystem).then(setAllRaceSkillChoiceRows);
    getAllRaceLanguageChoices(srdSystem).then(setAllRaceLanguageChoiceRows);
    getAllRaceProficiencies(srdSystem).then(setAllRaceProficiencyRows);
    getLanguages(srdSystem).then(setAvailableLanguages);
    getTools(srdSystem).then(setAvailableTools);
    searchFeats(undefined, srdSystem).then(setAvailableFeats);
    getAllClassStartingEquipment(srdSystem).then(setAllClassStartEquipRows);
    getAllClassStartingEquipmentOptions(srdSystem).then(
      setAllClassStartEquipOptionRows,
    );
  }, [srdSystem]);

  // Auto-save on change with 1.5s debounce
  useEffect(() => {
    if (!character || !isDirty || !autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      const saveData = structuredClone(character);
      materializeDynamicModifiers(saveData);
      await saveCharacter(id, saveData, autoSave);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [character, isDirty, autoSave, id]);

  async function handleSave() {
    if (!character) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    const saveData = structuredClone(character);
    materializeDynamicModifiers(saveData);
    await saveCharacter(id, saveData, autoSave);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handleToggleAutoSave(checked: boolean) {
    setAutoSave(checked);
    if (character) {
      const saveData = structuredClone(character);
      materializeDynamicModifiers(saveData);
      await saveCharacter(id, saveData, checked);
    }
  }

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
  characterRef.current = character;

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

  const pendingChoices = useMemo<PendingChoice[]>(() => {
    if (!character || allClassFeatureRows.length === 0 || allClassSkillChoiceRows.length === 0) return [];
    return derivePendingChoices(character, character.identity.classes, allClassFeatureRows, allClassSkillChoiceRows);
  }, [character, allClassFeatureRows, allClassSkillChoiceRows]);

  const equipmentPendingChoices = useMemo<EquipmentPendingChoice[]>(() => {
    if (!character || allClassStartEquipOptionRows.length === 0) return [];
    return deriveEquipmentPendingChoices(character, character.identity.classes, allClassStartEquipOptionRows);
  }, [character, allClassStartEquipOptionRows]);

  const racePendingChoices = useMemo<RacePendingChoice[]>(() => {
    if (!character || availableRaces.length === 0) return [];
    const matchedRace = character.identity.race
      ? availableRaces.find((r) => r.name.toLowerCase() === character.identity.race.toLowerCase())
      : undefined;
    return deriveRacePendingChoices(character, matchedRace, allRaceAsiOptionRows, allRaceSkillChoiceRows);
  }, [character, availableRaces, allRaceAsiOptionRows, allRaceSkillChoiceRows]);

  const raceLanguagePendingChoices = useMemo<RaceLanguagePendingChoice[]>(() => {
    if (!character || availableRaces.length === 0) return [];
    const matchedRace = character.identity.race
      ? availableRaces.find((r) => r.name.toLowerCase() === character.identity.race.toLowerCase())
      : undefined;
    const matchedSubrace = character.identity.subrace && availableSubraces.length > 0
      ? availableSubraces.find((s) => s.name.toLowerCase() === character.identity.subrace.toLowerCase())
      : undefined;
    return deriveRaceLanguagePendingChoices(character, matchedRace, matchedSubrace, allRaceLanguageChoiceRows);
  }, [character, availableRaces, availableSubraces, allRaceLanguageChoiceRows]);

  const raceToolPendingChoices = useMemo<RaceToolPendingChoice[]>(() => {
    if (!character || availableRaces.length === 0) return [];
    const matchedRace = character.identity.race
      ? availableRaces.find((r) => r.name.toLowerCase() === character.identity.race.toLowerCase())
      : undefined;
    const matchedSubrace = character.identity.subrace && availableSubraces.length > 0
      ? availableSubraces.find((s) => s.name.toLowerCase() === character.identity.subrace.toLowerCase())
      : undefined;
    return deriveRaceToolPendingChoices(character, matchedRace, matchedSubrace);
  }, [character, availableRaces, availableSubraces]);

  const raceCantripPendingChoices = useMemo<RaceCantripPendingChoice[]>(() => {
    if (!character || availableRaces.length === 0) return [];
    const matchedRace = character.identity.race
      ? availableRaces.find((r) => r.name.toLowerCase() === character.identity.race.toLowerCase())
      : undefined;
    const matchedSubrace = character.identity.subrace && availableSubraces.length > 0
      ? availableSubraces.find((s) => s.name.toLowerCase() === character.identity.subrace.toLowerCase())
      : undefined;
    return deriveRaceCantripPendingChoices(character, matchedRace, matchedSubrace, availableRaceCantrips);
  }, [character, availableRaces, availableSubraces, availableRaceCantrips]);

  // Fetch cantrips when the selected race/subrace has a cantrip choice.
  useEffect(() => {
    if (availableRaces.length === 0) return;
    const matchedRace = character?.identity.race
      ? availableRaces.find((r) => r.name.toLowerCase() === character.identity.race.toLowerCase())
      : undefined;
    const matchedSubrace = character?.identity.subrace && availableSubraces.length > 0
      ? availableSubraces.find((s) => s.name.toLowerCase() === character.identity.subrace.toLowerCase())
      : undefined;
    const needsCantrips = !!(matchedRace?.cantripChoicesJson || matchedSubrace?.cantripChoicesJson);
    if (!needsCantrips) { Promise.resolve().then(() => setAvailableRaceCantrips([])); return; }
    // Parse classId from the first cantrip choice entry (default wizard)
    const json = matchedSubrace?.cantripChoicesJson ?? matchedRace?.cantripChoicesJson;
    let classId = "dnd5e:wizard";
    try { const parsed = JSON.parse(json!); if (parsed[0]?.classId) classId = parsed[0].classId; } catch { /* ignore */ }
    getCantripsByClass(classId).then(setAvailableRaceCantrips);
  }, [character?.identity.race, character?.identity.subrace, availableRaces, availableSubraces]);

  const backgroundPendingChoices = useMemo<BackgroundPendingChoice[]>(() => {
    if (!character || availableBackgrounds.length === 0) return [];
    const matchedBg = character.identity.background
      ? availableBackgrounds.find((b) => b.name.toLowerCase() === character.identity.background.toLowerCase())
      : undefined;
    return deriveBackgroundPendingChoices(character, matchedBg);
  }, [character, availableBackgrounds]);

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

  function handleConfirmRaceLanguageChoice(
    choices: import("@/lib/types/character").LanguageChoiceMade[],
  ) {
    if (!character) return;
    const newLangChoices = [...(character.languageChoices ?? []), ...choices];
    const updated = structuredClone(character);
    updated.languageChoices = newLangChoices;
    // Eagerly re-apply race language proficiencies
    updated.otherProficiencies = updated.otherProficiencies.filter(
      (p) => !((p.sourceId?.startsWith("race:") || p.sourceId?.startsWith("subrace:")) && p.sourceId?.endsWith(":lang")),
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
    updated.raceCantripChoices = [...(updated.raceCantripChoices ?? []), choice];
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
    replaceCharacter({ ...character, backgroundChoices: [...existing, choice] });
  }

  function handleConfirmBackgroundLanguage(
    choices: import("@/lib/types/character").LanguageChoiceMade[],
    _backgroundId: string,
  ) {
    if (!character) return;
    const bgRow = availableBackgrounds.find(
      (b) => b.name.toLowerCase() === character.identity.background.toLowerCase(),
    );
    if (!bgRow) return;
    const newLangChoices = [...(character.languageChoices ?? []), ...choices];
    const updated = structuredClone(character);
    updated.languageChoices = newLangChoices;
    // Eagerly re-apply background language proficiencies
    updated.otherProficiencies = updated.otherProficiencies.filter(
      (p) => p.sourceId !== `background:${bgRow.id}:lang`,
    );
    for (const c of newLangChoices.filter((c) => c.sourceId === `background:${bgRow.id}`)) {
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
      (b) => b.name.toLowerCase() === character.identity.background.toLowerCase(),
    );
    if (!bgRow) return;

    type ToolChoiceMeta = { count?: number; category?: string; label: string; addToInventory?: boolean; inventoryOnly?: boolean; options?: { name: string }[] };
    const toolChoiceMeta: ToolChoiceMeta[] = bgRow.toolChoicesJson
      ? (typeof bgRow.toolChoicesJson === "string" ? JSON.parse(bgRow.toolChoicesJson) : bgRow.toolChoicesJson as unknown as ToolChoiceMeta[])
      : [];

    const newToolChoices = [...(character.toolChoices ?? []), choice];
    const updated = structuredClone(character);
    updated.toolChoices = newToolChoices;

    // Eagerly re-apply background tool proficiencies
    updated.otherProficiencies = updated.otherProficiencies.filter(
      (p) => p.sourceId !== `background:${bgRow.id}:tool`,
    );
    for (const tc of newToolChoices.filter((c) => c.backgroundId === bgRow.id)) {
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
    updated.inventory = updated.inventory.filter((i) => i.sourceId !== `bg-tool:${bgRow.id}`);
    for (const tc of newToolChoices.filter((c) => c.backgroundId === bgRow.id)) {
      const meta = toolChoiceMeta[tc.choiceIndex] as ToolChoiceMeta | undefined;
      if (meta?.addToInventory || meta?.inventoryOnly) {
        updated.inventory.push({
          id: crypto.randomUUID(),
          name: tc.toolName,
          quantity: meta?.count ?? 1,
          weight: 0,
          category: meta?.inventoryOnly ? "Mundane" : "Tool",
          equipped: false,
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

  function setRaceAutomationIgnored(ignored: boolean) {
    setSelectionIgnore("race", ignored);
  }

  function setBackgroundAutomationIgnored(ignored: boolean) {
    setSelectionIgnore("background", ignored);
  }

  function applyItemFromSrdToCharacter(
    baseCharacter: typeof character,
    srdItem: ItemRow,
  ) {
    if (!baseCharacter) return baseCharacter;

    const next = structuredClone(baseCharacter);
    const isWeapon = srdItem.equipmentCategory === "Weapon";
    const isArmor =
      srdItem.armorCategory !== null && srdItem.armorCategory !== "Shield";

    if (isWeapon && srdItem.damageDiceCount && srdItem.damageDieType) {
      const rawProperties = srdItem.properties;
      const props: string[] = rawProperties ? JSON.parse(rawProperties) : [];
      const isFinesse = props.includes("Finesse");
      const isRanged = srdItem.weaponRange === "Ranged";
      const atkStat: ActionEntry["attackStat"] = isRanged ? "dex" : "str";

      const primaryDmg: DamageEntry = {
        diceCount: srdItem.damageDiceCount!,
        dieType: srdItem.damageDieType as DieType,
        stat: isFinesse || isRanged ? "dex" : "str",
        flatBonus: 0,
        type: srdItem.damageType ?? "Bludgeoning",
        active: true,
      };

      const damageStack: DamageEntry[] = [primaryDmg];

      if (srdItem.twoHandedDiceCount && srdItem.twoHandedDieType) {
        damageStack.push({
          diceCount: srdItem.twoHandedDiceCount!,
          dieType: srdItem.twoHandedDieType as DieType,
          stat: "str",
          flatBonus: 0,
          type: srdItem.twoHandedDamageType ?? primaryDmg.type,
          active: false,
        });
      }

      const rangePart = srdItem.rangeNormal
        ? `Range ${srdItem.rangeNormal}${srdItem.rangeLong ? `/${srdItem.rangeLong}` : ""} ft`
        : "";
      const propPart = props.filter((p) => p !== "Versatile").join(", ");
      const notes = [rangePart, propPart].filter(Boolean).join(" · ");

      next.actions.push({
        id: crypto.randomUUID(),
        name: srdItem.name,
        mode: "Attack",
        attackStat: atkStat,
        attackProficient: true,
        attackBonus: 0,
        fixedDC: null,
        damageStack,
        notes,
      });
    }

    if (srdItem.description) {
      next.features.push({
        id: crypto.randomUUID(),
        name: srdItem.name,
        source: srdItem.equipmentCategory,
        description: srdItem.description,
      });

      const chargeMatch = srdItem.description.match(/(\d+)\s+charges?/i);
      if (chargeMatch) {
        const maxCharges = parseInt(chargeMatch[1], 10);
        const desc = srdItem.description.toLowerCase();
        const reset: TrackerEntry["reset"] = desc.includes("dawn")
          ? "Dawn"
          : desc.includes("long rest")
            ? "Long Rest"
            : desc.includes("short rest")
              ? "Short Rest"
              : "Special";

        next.trackers.push({
          id: crypto.randomUUID(),
          name: srdItem.name,
          base: maxCharges,
          baseSource: { kind: "fixed" },
          stack: [],
          reset,
          override: null,
          valueLabel: "charges",
        });
      }
    }

    return next;
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
        updated = applyItemFromSrdToCharacter(updated, item.srdItem)!;
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
    const updated = applyItemFromSrdToCharacter(withItem, srdItem);
    if (updated) {
      replaceCharacter(updated);
    }
  }

  if (!character)
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
              Forge
            </span>
          </div>
        </header>
        <div className="border-b border-border bg-section px-8 py-2" />
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
  const manualControlsEnabled = manualUiPrefs.manualControlsEnabled;

  function toggleManualControls() {
    setManualUiPrefs((current) => ({
      ...current,
      manualControlsEnabled: !current.manualControlsEnabled,
    }));
  }

  function setManualSection(section: ManualSectionId, visible: boolean) {
    setManualUiPrefs((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: visible,
      },
    }));
  }

  function isManualSectionVisible(section: ManualSectionId) {
    return manualControlsEnabled && manualUiPrefs.sections[section];
  }

  function renderManualSectionToggle(section: ManualSectionId) {
    if (!manualControlsEnabled) return null;

    const visible = manualUiPrefs.sections[section];
    return (
      <ToggleButton
        isActive={visible}
        onClick={() => setManualSection(section, !visible)}
      >
        {visible ? "Hide manual" : "Show manual"}
      </ToggleButton>
    );
  }

  return (
    <RuleSetProvider edition={character.edition}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Primary nav bar */}
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
              {identity.name || "Forge"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/canvas/${id}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Layout className="size-4" />
              Canvas
            </Link>
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
        <div className="flex items-center justify-between border-b border-border bg-section px-8 py-2 shrink-0">
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
              onClick={toggleManualControls}
            >
              {manualControlsEnabled ? "Manual on" : "Manual off"}
            </ToggleButton>
            <ToggleButton
              isActive={autoSave}
              onClick={() => handleToggleAutoSave(!autoSave)}
            >
              Auto-save {autoSave ? "on" : "off"}
            </ToggleButton>
          </div>
        </div>

        <main className="space-y-4 p-4 flex-1">
          <ForgeSection
            title="Identity"
            className="space-y-4"
            collapsible={true}
            headerAction={
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                <Button
                  variant={identityTab === "basics" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setIdentityTab("basics")}
                  className="h-7 px-2 hover:text-card-foreground"
                >
                  <User className="size-3 mr-1" />
                  Basics
                </Button>
                <Button
                  variant={
                    identityTab === "characteristics" ? "secondary" : "ghost"
                  }
                  size="xs"
                  onClick={() => setIdentityTab("characteristics")}
                  className="h-7 px-2 hover:text-card-foreground"
                >
                  <MessageSquare className="size-3 mr-1" />
                  Characteristics
                </Button>
                <Button
                  variant={identityTab === "bio" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setIdentityTab("bio")}
                  className="h-7 px-2 hover:text-card-foreground"
                >
                  <BookOpen className="size-3 mr-1" />
                  Bio & Appearance
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
                      ignoreAutomation={character.selectionIgnores?.race ?? false}
                      onRaceChange={(v) => updateIdentityField("race", v)}
                      onSubraceChange={(v) => updateIdentityField("subrace", v)}
                      onIgnoreAutomationChange={setRaceAutomationIgnored}
                      availableRaces={availableRaces}
                      availableSubraces={availableSubraces}
                    />
                    <RaceChoicesPanel
                      pendingChoices={racePendingChoices}
                      languagePendingChoices={raceLanguagePendingChoices}
                      toolPendingChoices={raceToolPendingChoices}
                      cantripPendingChoices={raceCantripPendingChoices}
                      languages={availableLanguages}
                      tools={availableTools}
                      cantrips={availableRaceCantrips}
                      alreadyChosenLanguageIds={(character.languageChoices ?? [])
                        .filter((c) => c.sourceId.startsWith("race:") || c.sourceId.startsWith("subrace:"))
                        .map((c) => c.languageId)}
                      isOpen={openChoicePanel === "race"}
                      onToggle={() => setOpenChoicePanel((v) => v === "race" ? null : "race")}
                      onConfirmChoice={handleConfirmRaceChoice}
                      onConfirmLanguageChoice={handleConfirmRaceLanguageChoice}
                      onConfirmToolChoice={handleConfirmRaceToolChoice}
                      onConfirmCantripChoice={handleConfirmRaceCantripChoice}
                      onDismissChoice={handleDismissRaceChoice}
                    />
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
                    <BackgroundChoicesPanel
                      pendingChoices={backgroundPendingChoices}
                      languages={availableLanguages}
                      tools={availableTools}
                      alreadyChosenLanguageIds={(character.languageChoices ?? [])
                        .filter((c) => c.sourceId.startsWith("background:"))
                        .map((c) => c.languageId)}
                      isOpen={openChoicePanel === "background"}
                      onToggle={() => setOpenChoicePanel((v) => v === "background" ? null : "background")}
                      onConfirmAsi={handleConfirmBackgroundAsi}
                      onConfirmLanguage={handleConfirmBackgroundLanguage}
                      onConfirmTool={handleConfirmBackgroundTool}
                      onDismissChoice={handleDismissBackgroundChoice}
                    />
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
                    <ClassChoicesPanel
                      pendingChoices={pendingChoices}
                      equipmentPendingChoices={equipmentPendingChoices}
                      availableFeats={availableFeats}
                      onConfirmChoice={handleConfirmChoice}
                      onDismissChoice={handleDismissClassChoice}
                      onConfirmEquipmentChoice={handleConfirmEquipmentChoice}
                      onDismissEquipmentChoice={handleDismissEquipmentChoice}
                    />
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
              >
                <div className="grid grid-cols-3 gap-3">
                  {ATTRIBUTE_KEYS.map((attr) => (
                    <StatBlock
                      key={attr}
                      label={ATTRIBUTE_LABELS[attr]}
                      data={attributes[attr]}
                      attrs={attributes}
                      level={identity.level}
                      pb={pb}
                      showManualControls={isManualSectionVisible("coreStats")}
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
              >
                <div className="grid grid-cols-3 gap-3">
                  {ATTRIBUTE_KEYS.map((attr) => (
                    <SaveBlock
                      key={attr}
                      label={SAVE_LABELS[attr]}
                      data={saves[attr]}
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

                {/* Global save modifier */}
                {isManualSectionVisible("savingThrows") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setGlobalSaveExpanded((v) => !v)}
                      className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {globalSaveExpanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronUp className="size-3" />
                      )}
                      Global modifier
                      {!globalSaveExpanded && saveGlobalStack.length > 0 && (
                        <span className="ml-auto tabular-nums">
                          {saveGlobalStack
                            .filter((m) => m.isActive)
                            .reduce((s, m) => s + m.value, 0) >= 0
                            ? `+${saveGlobalStack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)}`
                            : saveGlobalStack
                                .filter((m) => m.isActive)
                                .reduce((s, m) => s + m.value, 0)}
                        </span>
                      )}
                    </button>
                    {globalSaveExpanded && (
                      <div className="flex flex-col gap-1.5">
                        {saveGlobalStack.map((mod) =>
                          mod.sourceId ? (
                            <div
                              key={mod.id}
                              className={`flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5${!mod.isActive ? " opacity-40" : ""}`}
                            >
                              <Lock className="size-2.5 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                                {mod.source}
                              </span>
                              <span className="shrink-0 tabular-nums text-xs text-foreground">
                                {mod.value >= 0 ? `+${mod.value}` : mod.value}
                              </span>
                              {mod.isActive ? (
                                <CircleDot className="size-2.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <Circle className="size-2.5 shrink-0 text-muted-foreground" />
                              )}
                            </div>
                          ) : (
                            <div
                              key={mod.id}
                              className="flex items-start gap-1"
                            >
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <Input
                                  type="text"
                                  value={mod.source}
                                  placeholder="Source"
                                  className="h-6 text-xs"
                                  onChange={(e) =>
                                    setGlobalSaveStack(
                                      saveGlobalStack.map((m) =>
                                        m.id === mod.id
                                          ? { ...m, source: e.target.value }
                                          : m,
                                      ),
                                    )
                                  }
                                />
                                <DynamicValueInput
                                  value={mod.value}
                                  valueSource={mod.valueSource}
                                  valueMultiplier={mod.valueMultiplier}
                                  valueOffset={mod.valueOffset}
                                  attrs={attributes}
                                  level={identity.level}
                                  pb={pb}
                                  onChange={(v, vs, vm, vo) =>
                                    setGlobalSaveStack(
                                      saveGlobalStack.map((m) =>
                                        m.id === mod.id
                                          ? {
                                              ...m,
                                              value: v,
                                              valueSource: vs,
                                              valueMultiplier: vm,
                                              valueOffset: vo,
                                            }
                                          : m,
                                      ),
                                    )
                                  }
                                />
                              </div>
                              <div className="mt-0.5 flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGlobalSaveStack(
                                      saveGlobalStack.filter(
                                        (m) => m.id !== mod.id,
                                      ),
                                    )
                                  }
                                  className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="size-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGlobalSaveStack(
                                      saveGlobalStack.map((m) =>
                                        m.id === mod.id
                                          ? { ...m, isActive: !m.isActive }
                                          : m,
                                      ),
                                    )
                                  }
                                  className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {mod.isActive ? (
                                    <CircleDot className="size-2.5" />
                                  ) : (
                                    <Circle className="size-2.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalSaveStack([
                              ...saveGlobalStack,
                              {
                                id: crypto.randomUUID(),
                                source: "",
                                value: 0,
                                isActive: true,
                              },
                            ])
                          }
                          className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Plus className="size-3" />
                          Add modifier
                        </button>
                      </div>
                    )}
                  </>
                )}
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
            >
              <OtherProficienciesBlock
                proficiencies={otherProficiencies}
                attributes={attributes}
                proficiencyBonus={pb}
                system={character.edition === "2024" ? "dnd5e_2024" : "dnd5e"}
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

              <ForgeSection title="Attacks & Actions" collapsible={true}>
                <ActionsBlock
                  actions={actions}
                  castingStat={spells.globalCastingStat}
                  attributes={attributes}
                  proficiencyBonus={pb}
                  attackStack={spells.attackStack}
                  dcStack={spells.dcStack}
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
              />
            </ForgeSection>
          </div>
        </main>
      </div>
    </RuleSetProvider>
  );
}
