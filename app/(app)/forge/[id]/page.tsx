"use client";

import { use, useState, useEffect, useRef } from "react";
import { useCharacterStore } from "@/lib/store/character-store";
import { loadCharacter, saveCharacter } from "@/lib/actions/character";
import {
  getClasses,
  getClassSpellSlots,
  getRaces,
  getSubraces,
  getBackgrounds,
  getAllClassFeatures,
  getAllClassProficiencies,
  getAllRaceTraits,
  getAllClassSkillChoices,
  getAllRaceAbilityBonuses,
  getAllRaceAbilityBonusOptions,
  getAllRaceSkillChoices,
  searchFeats,
  getAllClassStartingEquipment,
  getAllClassStartingEquipmentOptions,
} from "@/lib/actions/5e-data";
import type { ClassRow, RaceRow, SubraceRow, BackgroundRow, SpellSlotRow, ItemRow, ClassFeatureRow, ClassProficiencyRow, RaceTraitRow, ClassSkillChoiceRow, FeatRow, RaceAbilityBonusRow, RaceAbilityBonusOptionRow, RaceSkillChoiceRow, ClassStartingEquipmentRow, ClassStartingEquipmentOptionRow } from "@/lib/actions/5e-data";
import { ClassChoicesPanel } from "@/components/forge/class-choices-panel";
import type { ResolvedEquipmentItem } from "@/components/forge/class-choices-panel";
import { RaceChoicesPanel } from "@/components/forge/race-choices-panel";
import { derivePendingChoices, deriveRacePendingChoices, deriveEquipmentPendingChoices, type PendingChoice, type RacePendingChoice, type EquipmentPendingChoice } from "@/lib/character/derive-pending-choices";
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
import { SpellsBlock } from "@/components/forge/spells-block";
import { ForgeSection } from "@/components/forge/forge-section";
import {
  ChevronDown,
  ChevronRight,
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
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
} from "@/lib/types/character";

import {
  resolvePb,
  resolveAttributeMod,
} from "@/lib/character/calculations";
import {
  deriveSpellSlotBases,
  spellSlotBasesEqual,
  type SpellSlotBaseMap,
  type SpellSlotClassLike,
} from "@/lib/character/spell-slots";
import { applyRace, applyClasses, applyBackground, applyClassStartingEquipment, clearRaceAutomation, clearBackgroundAutomation } from "@/lib/character/apply-srd";

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
  const [manualUiLoadedForId, setManualUiLoadedForId] = useState<string | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassRow[]>([]);
  const [availableSpellSlotRows, setAvailableSpellSlotRows] = useState<SpellSlotRow[]>([]);
  const [availableRaces, setAvailableRaces] = useState<RaceRow[]>([]);
  const [availableSubraces, setAvailableSubraces] = useState<SubraceRow[]>([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundRow[]>([]);
  const [allClassFeatureRows, setAllClassFeatureRows] = useState<ClassFeatureRow[]>([]);
  const [allClassProfRows, setAllClassProfRows] = useState<ClassProficiencyRow[]>([]);
  const [allRaceTraitRows, setAllRaceTraitRows] = useState<RaceTraitRow[]>([]);
  const [allClassSkillChoiceRows, setAllClassSkillChoiceRows] = useState<ClassSkillChoiceRow[]>([]);
  const [allRaceAsiBonusRows, setAllRaceAsiBonusRows] = useState<RaceAbilityBonusRow[]>([]);
  const [allRaceAsiOptionRows, setAllRaceAsiOptionRows] = useState<RaceAbilityBonusOptionRow[]>([]);
  const [allRaceSkillChoiceRows, setAllRaceSkillChoiceRows] = useState<RaceSkillChoiceRow[]>([]);
  const [availableFeats, setAvailableFeats] = useState<FeatRow[]>([]);
  const [allClassStartEquipRows, setAllClassStartEquipRows] = useState<ClassStartingEquipmentRow[]>([]);
  const [allClassStartEquipOptionRows, setAllClassStartEquipOptionRows] = useState<ClassStartingEquipmentOptionRow[]>([]);
  const [pendingChoices, setPendingChoices] = useState<PendingChoice[]>([]);
  const [racePendingChoices, setRacePendingChoices] = useState<RacePendingChoice[]>([]);
  const [equipmentPendingChoices, setEquipmentPendingChoices] = useState<EquipmentPendingChoice[]>([]);
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
  const replaceCharacter = useCharacterStore((s) => s.replaceCharacter);

  useEffect(() => {
    clearCharacter();
    loadCharacter(id).then((res) => {
      if (res) setCharacter(res.data, res.autoSave);
    });
  }, [id, clearCharacter, setCharacter]);

  useEffect(() => {
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
        sections: {
          ...DEFAULT_MANUAL_UI_PREFS.sections,
          ...(parsed.sections ?? {}),
        },
      });
    } catch {
      setManualUiPrefs(DEFAULT_MANUAL_UI_PREFS);
    }
    setManualUiLoadedForId(id);
  }, [id]);

  useEffect(() => {
    if (manualUiLoadedForId !== id) return;
    window.localStorage.setItem(
      getManualUiStorageKey(id),
      JSON.stringify(manualUiPrefs),
    );
  }, [id, manualUiLoadedForId, manualUiPrefs]);

  useEffect(() => {
    getClasses().then(setAvailableClasses);
    getClassSpellSlots().then(setAvailableSpellSlotRows);
    getRaces().then(setAvailableRaces);
    getSubraces().then(setAvailableSubraces);
    getBackgrounds().then(setAvailableBackgrounds);
    getAllClassFeatures().then(setAllClassFeatureRows);
    getAllClassProficiencies().then(setAllClassProfRows);
    getAllRaceTraits().then(setAllRaceTraitRows);
    getAllClassSkillChoices().then(setAllClassSkillChoiceRows);
    getAllRaceAbilityBonuses().then(setAllRaceAsiBonusRows);
    getAllRaceAbilityBonusOptions().then(setAllRaceAsiOptionRows);
    getAllRaceSkillChoices().then(setAllRaceSkillChoiceRows);
    searchFeats().then(setAvailableFeats);
    getAllClassStartingEquipment().then(setAllClassStartEquipRows);
    getAllClassStartingEquipmentOptions().then(setAllClassStartEquipOptionRows);
  }, []);

  // Auto-save on change with 1.5s debounce
  useEffect(() => {
    if (!character || !isDirty || !autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      await saveCharacter(id, character, autoSave);
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
    await saveCharacter(id, character, autoSave);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handleToggleAutoSave(checked: boolean) {
    setAutoSave(checked);
    // Persist immediately when toggling
    if (character) {
      await saveCharacter(id, character, checked);
    }
  }

  useEffect(() => {
    if (!character || availableClasses.length === 0 || availableSpellSlotRows.length === 0) {
      return;
    }

    const derivedBases = deriveSpellSlotBases({
      classes: character.identity.classes,
      availableClasses: availableClasses as SpellSlotClassLike[],
      slotRows: availableSpellSlotRows,
    });
    const currentBases = Object.fromEntries(
      Object.entries(character.spells.slots).map(([level, slot]) => [level, slot.base]),
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
  }, [
    availableClasses,
    availableSpellSlotRows,
    character,
    setSpellSlots,
  ]);

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
  const raceKey = `${character?.identity.race ?? ""}::${character?.identity.subrace ?? ""}`;
  const bgKey = character?.identity.background ?? "";
  const raceChoicesKey = (character?.raceChoices ?? []).map((c) => c.id).join(",");
  const ignoreKey = `${character?.selectionIgnores?.race ? "race-off" : "race-on"}|${character?.selectionIgnores?.background ? "bg-off" : "bg-on"}`;
  const srdKey = `${classStateKey}|${raceKey}|${bgKey}|${raceChoicesKey}|${ignoreKey}`;

  useEffect(() => {
    const char = characterRef.current;
    // Wait until all static data has loaded and character is available.
    if (
      !char ||
      allClassFeatureRows.length === 0 ||
      allRaceTraitRows.length === 0 ||
      availableRaces.length === 0 ||
      availableBackgrounds.length === 0 ||
      allRaceAsiBonusRows.length === 0
    ) return;

    let updated = char;

    // 1. Class features + primary-class saving throw proficiencies
    updated = applyClasses(updated, char.identity.classes, allClassFeatureRows, allClassProfRows);

    // 1b. Starting equipment (fixed grants, clears stale items on class change)
    if (allClassStartEquipRows.length > 0) {
      updated = applyClassStartingEquipment(updated, char.identity.classes, allClassStartEquipRows);
    }

    // 2. Race traits + speed
    if (char.identity.race && !char.selectionIgnores?.race) {
      const matchedRace = availableRaces.find(
        (r) => r.name.toLowerCase() === char.identity.race.toLowerCase(),
      );
      if (matchedRace) {
        const raceTraits = allRaceTraitRows.filter((t) => t.raceId === matchedRace.id);
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
        updated = applyRace(updated, matchedRace, raceTraits, allRaceAsiBonusRows, char.raceChoices ?? [], matchedSubrace, subraceTraits);
      }
    } else {
      updated = clearRaceAutomation(updated);
    }

    // 3. Background skill proficiencies
    if (char.identity.background && !char.selectionIgnores?.background) {
      const bgRow = availableBackgrounds.find(
        (b) => b.name.toLowerCase() === char.identity.background.toLowerCase(),
      );
      if (bgRow) updated = applyBackground(updated, bgRow);
    } else {
      updated = clearBackgroundAutomation(updated);
    }

    replaceCharacter(updated);
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

  // Derive pending choices whenever character or static data changes.
  useEffect(() => {
    if (!character || allClassFeatureRows.length === 0 || allClassSkillChoiceRows.length === 0) {
      setPendingChoices([]);
      return;
    }
    setPendingChoices(
      derivePendingChoices(
        character,
        character.identity.classes,
        allClassFeatureRows,
        allClassSkillChoiceRows,
      ),
    );
  }, [character, allClassFeatureRows, allClassSkillChoiceRows]);

  // Derive equipment pending choices.
  useEffect(() => {
    if (!character || allClassStartEquipOptionRows.length === 0) {
      setEquipmentPendingChoices([]);
      return;
    }
    setEquipmentPendingChoices(
      deriveEquipmentPendingChoices(
        character,
        character.identity.classes,
        allClassStartEquipOptionRows,
      ),
    );
  }, [character, allClassStartEquipOptionRows]);

  // Derive race pending choices.
  useEffect(() => {
    if (!character || availableRaces.length === 0) {
      setRacePendingChoices([]);
      return;
    }
    const matchedRace = character.identity.race
      ? availableRaces.find((r) => r.name.toLowerCase() === character.identity.race.toLowerCase())
      : undefined;
    setRacePendingChoices(
      deriveRacePendingChoices(character, matchedRace, allRaceAsiOptionRows, allRaceSkillChoiceRows),
    );
  }, [character, availableRaces, allRaceAsiOptionRows, allRaceSkillChoiceRows]);

  function handleConfirmRaceChoice(choices: import("@/lib/types/character").RaceChoiceMade[]) {
    if (!character) return;
    const existing = character.raceChoices ?? [];
    const matchedRace = availableRaces.find(
      (r) => r.name.toLowerCase() === character.identity.race.toLowerCase(),
    );
    const withChoices = { ...character, raceChoices: [...existing, ...choices] };
    if (matchedRace) {
      const raceTraits = allRaceTraitRows.filter((t) => t.raceId === matchedRace.id);
      const matchedSubrace = character.identity.subrace
        ? availableSubraces.find(
            (s) =>
              s.raceId === matchedRace.id &&
              s.name.toLowerCase() === character.identity.subrace.toLowerCase(),
          )
        : undefined;
      const subraceTraits = matchedSubrace
        ? allRaceTraitRows.filter((t) => t.subraceId === matchedSubrace.id)
        : undefined;
      const applied = applyRace(
        withChoices,
        matchedRace,
        raceTraits,
        allRaceAsiBonusRows,
        withChoices.raceChoices ?? [],
        matchedSubrace,
        subraceTraits,
      );
      replaceCharacter(applied);
    } else {
      replaceCharacter(withChoices);
    }
  }

  function handleDismissClassChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedClassChoiceKeys: [...(character.dismissedClassChoiceKeys ?? []), choiceKey],
    });
  }

  function handleDismissRaceChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedRaceChoiceKeys: [...(character.dismissedRaceChoiceKeys ?? []), choiceKey],
    });
  }

  function handleDismissEquipmentChoice(choiceKey: string) {
    if (!character) return;
    replaceCharacter({
      ...character,
      dismissedEquipmentChoiceKeys: [...(character.dismissedEquipmentChoiceKeys ?? []), choiceKey],
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
    const isArmor = srdItem.armorCategory !== null && srdItem.armorCategory !== "Shield";

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

      next.actions.unshift({
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

    if (isArmor && srdItem.acBase !== null) {
      const acCategory = srdItem.armorCategory!;
      const addsDex = acCategory !== "Heavy";
      next.combat.ac = {
        ...next.combat.ac,
        mode: "Formula",
        base: srdItem.acBase!,
        statA: addsDex ? "dex" : null,
        statB: null,
      };
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
      inventory: [...character.inventory, ...items.map((item) => item.inventoryItem)],
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

  function handleConfirmChoice(choices: import("@/lib/types/character").ClassChoiceMade | import("@/lib/types/character").ClassChoiceMade[]) {
    if (!character) return;
    const incoming = Array.isArray(choices) ? choices : [choices];
    const existing = character.classChoices ?? [];
    const withChoices = { ...character, classChoices: [...existing, ...incoming] };
    const applied = applyClasses(withChoices, withChoices.identity.classes, allClassFeatureRows, allClassProfRows);
    replaceCharacter(applied);
  }

  function applyItemFromSrd(srdItem: ItemRow, invItem: InventoryItem) {
    void invItem;
    if (!character) return;
    replaceCharacter(applyItemFromSrdToCharacter(character, srdItem)!);
    return;
    const currentCharacter = character;

    const isWeapon = srdItem.equipmentCategory === "Weapon"
    const isArmor = srdItem.armorCategory !== null && srdItem.armorCategory !== "Shield"

    // Weapon → create ActionEntry
    if (isWeapon && srdItem.damageDiceCount && srdItem.damageDieType) {
      const props: string[] = srdItem.properties ? JSON.parse(srdItem.properties!) : []
      const isFinesse = props.includes("Finesse")
      const isRanged = srdItem.weaponRange === "Ranged"
      const atkStat: ActionEntry["attackStat"] = isRanged ? "dex" : "str"

      const primaryDmg: DamageEntry = {
        diceCount: srdItem.damageDiceCount!,
        dieType: srdItem.damageDieType as DieType,
        stat: isFinesse || isRanged ? "dex" : "str",
        flatBonus: 0,
        type: srdItem.damageType ?? "Bludgeoning",
        active: true,
      }

      const damageStack: DamageEntry[] = [primaryDmg]

      // Versatile second entry (inactive by default)
      if (srdItem.twoHandedDiceCount && srdItem.twoHandedDieType) {
        damageStack.push({
          diceCount: srdItem.twoHandedDiceCount!,
          dieType: srdItem.twoHandedDieType as DieType,
          stat: "str",
          flatBonus: 0,
          type: srdItem.twoHandedDamageType ?? primaryDmg.type,
          active: false,
        })
      }

      const rangePart = srdItem.rangeNormal
        ? `Range ${srdItem.rangeNormal}${srdItem.rangeLong ? `/${srdItem.rangeLong}` : ""} ft`
        : ""
      const propPart = props.filter((p) => p !== "Versatile").join(", ")
      const notes = [rangePart, propPart].filter(Boolean).join(" · ")

      const action: ActionEntry = {
        id: crypto.randomUUID(),
        name: srdItem.name,
        mode: "Attack",
        attackStat: atkStat,
        attackProficient: true,
        attackBonus: 0,
        fixedDC: null,
        damageStack,
        notes,
      }

      if (currentCharacter) setActions([action, ...currentCharacter!.actions])
    }

    // Armor (non-shield) → configure AC formula
    if (isArmor && srdItem.acBase !== null && currentCharacter) {
      const acCategory = srdItem.armorCategory! // "Light" | "Medium" | "Heavy"
      const addsDex = acCategory !== "Heavy"
      setAc({
        ...currentCharacter!.combat.ac,
        mode: "Formula",
        base: srdItem.acBase!,
        statA: addsDex ? "dex" : null,
        statB: null,
      })
    }

    // Description → FeatureEntry
    if (srdItem.description && currentCharacter) {
      const feature: FeatureEntry = {
        id: crypto.randomUUID(),
        name: srdItem.name,
        source: srdItem.equipmentCategory,
        description: srdItem.description!,
      }
      setFeatures([...currentCharacter!.features, feature])
    }

    // Charges in description → TrackerEntry
    if (srdItem.description && currentCharacter) {
      const chargeMatch = srdItem.description!.match(/(\d+)\s+charges?/i)
      if (chargeMatch) {
        const maxCharges = parseInt(chargeMatch![1], 10)
        const desc = srdItem.description!.toLowerCase()
        const reset: TrackerEntry["reset"] = desc.includes("dawn")
          ? "Dawn"
          : desc.includes("long rest")
          ? "Long Rest"
          : desc.includes("short rest")
          ? "Short Rest"
          : "Special"

        const tracker: TrackerEntry = {
          id: crypto.randomUUID(),
          name: srdItem.name,
          base: maxCharges,
          baseSource: { kind: "fixed" },
          stack: [],
          reset,
          override: null,
          valueLabel: "charges",
        }
        setTrackers([...currentCharacter!.trackers, tracker])
      }
    }
  }

  if (!character)
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
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
      <Button
        type="button"
        size="xs"
        variant={visible ? "secondary" : "outline"}
        onClick={() => setManualSection(section, !visible)}
      >
        {visible ? "Hide manual" : "Show manual"}
      </Button>
    );
  }

  return (
    <main className="space-y-10 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/characters"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Characters
          </Link>
          <h1 className="text-lg font-semibold">Forge</h1>
          <Link
            href={`/canvas/${id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Layout className="size-4" />
            Open Canvas
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant={manualControlsEnabled ? "secondary" : "outline"}
            onClick={toggleManualControls}
          >
            {manualControlsEnabled ? "Manual controls on" : "Manual controls off"}
          </Button>
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
            <Save />
            Save
          </Button>
        </div>
      </div>

      <ForgeSection title="Identity" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          <StringField
            label="Name"
            value={identity.name}
            onChange={(v) => updateIdentityField("name", v)}
            placeholder="Character name"
          />
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
          <BackgroundField
            value={identity.background}
            ignoreAutomation={character.selectionIgnores?.background ?? false}
            onChange={(v) => updateIdentityField("background", v)}
            onIgnoreAutomationChange={setBackgroundAutomationIgnored}
            availableBackgrounds={availableBackgrounds}
          />
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
              onChange={(e) => updateIdentityField("alignment", e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              onClassPicked={(dbClass) => {
                if (!spells.globalCastingStat && dbClass.spellcastingStat) {
                  setSpellCastingStat(dbClass.spellcastingStat as AttributeKey);
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
        <RaceChoicesPanel
          pendingChoices={racePendingChoices}
          onConfirmChoice={handleConfirmRaceChoice}
          onDismissChoice={handleDismissRaceChoice}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          <StringField
            label="Age"
            value={identity.age}
            onChange={(v) => updateIdentityField("age", v)}
            placeholder="e.g. 25"
          />
          <StringField
            label="Gender"
            value={identity.gender}
            onChange={(v) => updateIdentityField("gender", v)}
            placeholder="e.g. Male"
          />
          <StringField
            label="Height"
            value={identity.height}
            onChange={(v) => updateIdentityField("height", v)}
            placeholder="e.g. 5'10&quot;"
          />
          <StringField
            label="Weight"
            value={identity.weight}
            onChange={(v) => updateIdentityField("weight", v)}
            placeholder="e.g. 160 lbs"
          />
          <StringField
            label="Eyes"
            value={identity.eyes}
            onChange={(v) => updateIdentityField("eyes", v)}
            placeholder="e.g. Blue"
          />
          <StringField
            label="Hair"
            value={identity.hair}
            onChange={(v) => updateIdentityField("hair", v)}
            placeholder="e.g. Brown"
          />
          <StringField
            label="Skin"
            value={identity.skin}
            onChange={(v) => updateIdentityField("skin", v)}
            placeholder="e.g. Tanned"
          />
        </div>
      </ForgeSection>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Core stats + saves stacked */}
        <div className="w-full xl:w-1/4 flex flex-col gap-4">
          <ForgeSection
            title="Core Stats"
            headerAction={renderManualSectionToggle("coreStats")}
          >
            <div className="grid grid-cols-3 gap-3">
              {ATTRIBUTE_KEYS.map((attr) => (
                <StatBlock
                  key={attr}
                  label={ATTRIBUTE_LABELS[attr]}
                  data={attributes[attr]}
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
                  showManualControls={isManualSectionVisible("savingThrows")}
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
                    <ChevronRight className="size-3" />
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
                    <div key={mod.id} className="flex items-start gap-1">
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
                        <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                          <span className="select-none pl-2 text-xs text-muted-foreground">
                            +
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={mod.value === 0 ? "" : String(mod.value)}
                            placeholder="0"
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setGlobalSaveStack(
                                  saveGlobalStack.map((m) =>
                                    m.id === mod.id ? { ...m, value: 0 } : m,
                                  ),
                                );
                                return;
                              }
                              if (raw === "-") return;
                              const n = parseInt(raw, 10);
                              if (!isNaN(n))
                                setGlobalSaveStack(
                                  saveGlobalStack.map((m) =>
                                    m.id === mod.id ? { ...m, value: n } : m,
                                  ),
                                );
                            }}
                            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalSaveStack(
                              saveGlobalStack.filter((m) => m.id !== mod.id),
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
        >
          <SkillsBlock
            skills={skills}
            attributes={attributes}
            proficiencyBonus={pb}
            jackOfAllTrades={jackOfAllTrades}
            globalStack={skillGlobalStack}
            passivePerception={passivePerception}
            showManualControls={isManualSectionVisible("skills")}
            onStateChange={setSkillState}
            onOverrideChange={setSkillOverride}
            onJackOfAllTradesChange={setJackOfAllTrades}
            onGlobalStackChange={setGlobalSkillStack}
            onPassivePerceptionStackChange={setPassivePerceptionStack}
            onPassivePerceptionOverrideChange={setPassivePerceptionOverride}
          />
        </ForgeSection>

        {/* Other Proficiencies */}
        <ForgeSection
          title="Other Proficiencies"
          className="w-full xl:w-72 min-w-0"
        >
          <OtherProficienciesBlock
            proficiencies={otherProficiencies}
            attributes={attributes}
            proficiencyBonus={pb}
            onChange={setOtherProficiencies}
          />
        </ForgeSection>

        {/* Combat */}
        <div className="w-full xl:flex-1 min-w-0 flex flex-col gap-4">
          <ForgeSection
            title="Combat"
            headerAction={renderManualSectionToggle("combat")}
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

          <ForgeSection title="Attacks & Actions">
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

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <ForgeSection title="Features & Traits" className="flex-1 min-w-0">
          <FeaturesBlock features={features} onChange={setFeatures} />
        </ForgeSection>

        <ForgeSection
          title="Trackers"
          className="flex-1 min-w-0"
          headerAction={renderManualSectionToggle("trackers")}
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

        <ForgeSection title="Custom Stats" className="w-full md:w-72 shrink-0">
          <StatBoxesBlock statBoxes={statBoxes ?? []} onChange={setStatBoxes} />
        </ForgeSection>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <ForgeSection title="Inventory" className="w-full md:w-1/3">
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
  );
}
