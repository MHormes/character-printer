import type {
  CharacterClassEntry,
  SpellSlotProgression,
} from "@/lib/types/character";

export type SpellSlotRowLike = {
  classId: string;
  level: number;
  slot1: number;
  slot2: number;
  slot3: number;
  slot4: number;
  slot5: number;
  slot6: number;
  slot7: number;
  slot8: number;
  slot9: number;
};

export type SpellSlotClassLike = {
  id: string;
  name: string;
  spellSlotProgression: SpellSlotProgression | null;
};

export type SpellSlotBaseMap = Record<string, number>;

const SLOT_LEVELS = Array.from({ length: 9 }, (_, i) => String(i + 1));

export function createEmptySpellSlotBaseMap(): SpellSlotBaseMap {
  return Object.fromEntries(SLOT_LEVELS.map((level) => [level, 0]));
}

function classMatchesEntry(
  entry: CharacterClassEntry,
  dbClass: SpellSlotClassLike,
): boolean {
  if (entry.classId) return entry.classId === dbClass.id;
  return entry.name.trim().toLowerCase() === dbClass.name.trim().toLowerCase();
}

function resolveClassMeta(
  entry: CharacterClassEntry,
  availableClasses: SpellSlotClassLike[],
): SpellSlotClassLike | null {
  return availableClasses.find((dbClass) => classMatchesEntry(entry, dbClass)) ?? null;
}

function rowToBaseMap(row: SpellSlotRowLike | null | undefined): SpellSlotBaseMap {
  if (!row) return createEmptySpellSlotBaseMap();

  return {
    "1": row.slot1,
    "2": row.slot2,
    "3": row.slot3,
    "4": row.slot4,
    "5": row.slot5,
    "6": row.slot6,
    "7": row.slot7,
    "8": row.slot8,
    "9": row.slot9,
  };
}

function slotLookupKey(classId: string, level: number): string {
  return `${classId}:${level}`;
}

export function buildSpellSlotLookup(
  rows: SpellSlotRowLike[],
): Map<string, SpellSlotRowLike> {
  return new Map(rows.map((row) => [slotLookupKey(row.classId, row.level), row]));
}

function getClassSlots(
  classId: string,
  level: number,
  slotLookup: Map<string, SpellSlotRowLike>,
): SpellSlotBaseMap {
  return rowToBaseMap(slotLookup.get(slotLookupKey(classId, level)));
}

function resolveProgressionContribution(
  progression: SpellSlotProgression | null,
  level: number,
): number {
  if (progression === "full") return level;
  if (progression === "half") return Math.floor(level / 2);
  return 0;
}

export function deriveSpellSlotBases(args: {
  classes: CharacterClassEntry[];
  availableClasses: SpellSlotClassLike[];
  slotRows: SpellSlotRowLike[];
}): SpellSlotBaseMap {
  const { classes, availableClasses, slotRows } = args;
  const slotLookup = buildSpellSlotLookup(slotRows);

  const resolvedClasses = classes
    .map((entry) => ({
      entry,
      dbClass: resolveClassMeta(entry, availableClasses),
    }))
    .filter(
      (
        value,
      ): value is { entry: CharacterClassEntry; dbClass: SpellSlotClassLike } =>
        Boolean(value.dbClass),
    );

  const spellcastingClasses = resolvedClasses.filter(
    ({ entry, dbClass }) =>
      dbClass.spellSlotProgression &&
      dbClass.spellSlotProgression !== "none" &&
      slotLookup.has(slotLookupKey(dbClass.id, entry.level)),
  );

  if (spellcastingClasses.length === 0) return createEmptySpellSlotBaseMap();

  if (spellcastingClasses.length === 1) {
    const [{ entry, dbClass }] = spellcastingClasses;
    return getClassSlots(dbClass.id, entry.level, slotLookup);
  }

  const effectiveCasterLevel = Math.min(
    20,
    spellcastingClasses.reduce(
      (sum, { entry, dbClass }) =>
        sum + resolveProgressionContribution(dbClass.spellSlotProgression, entry.level),
      0,
    ),
  );

  if (effectiveCasterLevel < 1) return createEmptySpellSlotBaseMap();

  const multiclassTableClass = availableClasses.find(
    (dbClass) => dbClass.spellSlotProgression === "full",
  );
  if (!multiclassTableClass) return createEmptySpellSlotBaseMap();

  return getClassSlots(multiclassTableClass.id, effectiveCasterLevel, slotLookup);
}

export function spellSlotBasesEqual(
  left: SpellSlotBaseMap,
  right: SpellSlotBaseMap,
): boolean {
  return SLOT_LEVELS.every((level) => left[level] === right[level]);
}
