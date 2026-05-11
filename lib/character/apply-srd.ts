import type { CharacterData, AttributeKey, FeatureEntry, ClassChoiceMade, RaceChoiceMade } from "@/lib/types/character"
import type {
  RaceRow,
  SubraceRow,
  RaceTraitRow,
  ClassFeatureRow,
  ClassProficiencyRow,
  BackgroundRow,
  RaceAbilityBonusRow,
} from "@/lib/actions/5e-data"
import type { CharacterClassEntry } from "@/lib/types/character"

const SAVE_PROF_NAME_TO_KEY: Record<string, AttributeKey> = {
  "Saving Throw: STR": "str",
  "Saving Throw: DEX": "dex",
  "Saving Throw: CON": "con",
  "Saving Throw: INT": "int",
  "Saving Throw: WIS": "wis",
  "Saving Throw: CHA": "cha",
}

function clearRaceModifiers(next: CharacterData): void {
  const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
  for (const key of ATTR_KEYS) {
    next.attributes[key].stack = next.attributes[key].stack.filter(
      (m) => !m.sourceId?.startsWith("race:") && !m.sourceId?.startsWith("subrace:"),
    )
  }
  for (const key of Object.keys(next.skills)) {
    next.skills[key].stack = next.skills[key].stack.filter(
      (m) => !m.sourceId?.startsWith("race:"),
    )
  }
}

export function applyRace(
  char: CharacterData,
  raceRow: RaceRow,
  raceTraits: RaceTraitRow[],
  allAsiBonuses: RaceAbilityBonusRow[],
  raceChoices: RaceChoiceMade[],
  subraceRow?: SubraceRow,
  subraceTraits?: RaceTraitRow[],
): CharacterData {
  const next = structuredClone(char)

  // ── Clear old race features + modifiers ──────────────────────────────────
  next.features = next.features.filter(
    (f) => !f.sourceId?.startsWith("race:") && !f.sourceId?.startsWith("subrace:"),
  )
  clearRaceModifiers(next)

  // ── Race traits ───────────────────────────────────────────────────────────
  for (const trait of raceTraits) {
    next.features.push({
      id: crypto.randomUUID(),
      name: trait.name,
      source: raceRow.name,
      sourceId: `race:${raceRow.id}`,
      description: trait.description ?? "",
    } satisfies FeatureEntry)
  }

  if (subraceRow && subraceTraits) {
    for (const trait of subraceTraits) {
      next.features.push({
        id: crypto.randomUUID(),
        name: trait.name,
        source: subraceRow.name,
        sourceId: `subrace:${subraceRow.id}`,
        description: trait.description ?? "",
      } satisfies FeatureEntry)
    }
  }

  if (raceRow.speed) {
    next.combat.speed.base = raceRow.speed
  }

  // ── Fixed ASI bonuses (race) ──────────────────────────────────────────────
  const newRaceAsiBonuses: NonNullable<CharacterData["srdGrants"]>["raceAsiBonuses"] = []
  const fixedRaceBonuses = allAsiBonuses.filter((b) => b.raceId === raceRow.id && !b.subraceId)
  for (const bonus of fixedRaceBonuses) {
    const attrKey = bonus.abilityScore as AttributeKey
    if (!next.attributes[attrKey]) continue
    const sourceId = `race:${raceRow.id}:asi`
    next.attributes[attrKey].stack.push({
      id: crypto.randomUUID(),
      source: raceRow.name,
      sourceId,
      value: bonus.bonus,
      isActive: true,
    })
    newRaceAsiBonuses.push({ abilityScore: attrKey, bonus: bonus.bonus, sourceId })
  }

  // ── Fixed ASI bonuses (subrace) ───────────────────────────────────────────
  if (subraceRow) {
    const fixedSubraceBonuses = allAsiBonuses.filter((b) => b.subraceId === subraceRow.id)
    for (const bonus of fixedSubraceBonuses) {
      const attrKey = bonus.abilityScore as AttributeKey
      if (!next.attributes[attrKey]) continue
      const sourceId = `subrace:${subraceRow.id}:asi`
      next.attributes[attrKey].stack.push({
        id: crypto.randomUUID(),
        source: subraceRow.name,
        sourceId,
        value: bonus.bonus,
        isActive: true,
      })
      newRaceAsiBonuses.push({ abilityScore: attrKey, bonus: bonus.bonus, sourceId })
    }
  }

  next.srdGrants = {
    saveProficiencies: next.srdGrants?.saveProficiencies ?? [],
    skillProficiencies: next.srdGrants?.skillProficiencies ?? [],
    raceAsiBonuses: newRaceAsiBonuses,
  }

  // ── Prune stale race choices (race changed) ───────────────────────────────
  const validRaceChoices = raceChoices.filter((c) => c.raceId === raceRow.id)
  next.raceChoices = validRaceChoices

  // ── Apply choosable ASI choices ───────────────────────────────────────────
  for (const choice of validRaceChoices) {
    if (choice.type === "asi" && choice.abilityScore && choice.bonus !== undefined) {
      const attrKey = choice.abilityScore
      if (!next.attributes[attrKey]) continue
      next.attributes[attrKey].stack.push({
        id: crypto.randomUUID(),
        source: raceRow.name,
        sourceId: `race:${raceRow.id}:asi:choice`,
        value: choice.bonus,
        isActive: true,
      })
    }

    if (choice.type === "skill" && choice.skillKey) {
      if (next.skills[choice.skillKey]) {
        next.skills[choice.skillKey].state = "Proficient"
      }
    }
  }

  return next
}

function clearClassChoiceModifiers(next: CharacterData): void {
  const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
  for (const key of ATTR_KEYS) {
    next.attributes[key].stack = next.attributes[key].stack.filter(
      (m) => !m.sourceId?.startsWith("class:") || !m.sourceId.includes(":asi:"),
    )
  }
}

export function applyClasses(
  char: CharacterData,
  classes: CharacterClassEntry[],
  allFeatureRows: ClassFeatureRow[],
  allProfRows: ClassProficiencyRow[],
): CharacterData {
  const next = structuredClone(char)

  // ── Deterministic features ────────────────────────────────────────────────
  next.features = next.features.filter((f) => !f.sourceId?.startsWith("class:"))

  const oldSaveGrants = next.srdGrants?.saveProficiencies ?? []
  for (const key of oldSaveGrants) {
    const attrKey = key as AttributeKey
    if (next.saves[attrKey]) next.saves[attrKey].proficient = false
  }

  const newSaveGrants: string[] = []
  const activeClasses = classes.filter((c) => c.classId)

  for (const cls of activeClasses) {
    const features = allFeatureRows.filter(
      (f) => f.classId === cls.classId && f.level <= cls.level,
    )
    for (const feat of features) {
      next.features.push({
        id: crypto.randomUUID(),
        name: feat.name,
        source: cls.name,
        sourceId: `class:${cls.classId}`,
        description: feat.description ?? "",
      } satisfies FeatureEntry)
    }
  }

  const primaryClass = activeClasses[0]
  if (primaryClass) {
    const profs = allProfRows.filter(
      (p) => p.classId === primaryClass.classId && p.profType === "Saving Throws",
    )
    for (const prof of profs) {
      const attrKey = SAVE_PROF_NAME_TO_KEY[prof.name]
      if (attrKey && !newSaveGrants.includes(attrKey)) {
        newSaveGrants.push(attrKey)
        next.saves[attrKey].proficient = true
      }
    }
  }

  next.srdGrants = {
    saveProficiencies: newSaveGrants,
    skillProficiencies: next.srdGrants?.skillProficiencies ?? [],
  }

  // ── Choice-based grants ───────────────────────────────────────────────────
  // Prune stale choices (class removed or level dropped below atLevel)
  const levelByClassId = new Map(activeClasses.map((c) => [c.classId!, c.level]))
  const validChoices: ClassChoiceMade[] = (next.classChoices ?? []).filter(
    (c) => levelByClassId.has(c.classId) && c.atLevel <= levelByClassId.get(c.classId)!,
  )
  next.classChoices = validChoices

  // Clear old ASI modifier entries before re-applying
  clearClassChoiceModifiers(next)

  // Apply surviving choices
  for (const choice of validChoices) {
    const cls = activeClasses.find((c) => c.classId === choice.classId)
    if (!cls) continue

    if (choice.type === "asi" && choice.improvements) {
      for (const imp of choice.improvements) {
        next.attributes[imp.attr].stack.push({
          id: crypto.randomUUID(),
          source: cls.name,
          sourceId: `class:${choice.classId}:asi:${choice.atLevel}`,
          value: imp.bonus,
          isActive: true,
        })
      }
    }

    if (choice.type === "skill" && choice.skillKey) {
      if (next.skills[choice.skillKey]) {
        next.skills[choice.skillKey].state = "Proficient"
      }
    }

    if (choice.type === "feat") {
      // Feat features are already added as class: features via the SRD feature list
      // if the feat grants no modifier stack — just ensure the feature entry exists
      const featSourceId = `class:${choice.classId}:feat:${choice.atLevel}`
      const exists = next.features.some((f) => f.sourceId === featSourceId)
      if (!exists && choice.featName) {
        next.features.push({
          id: crypto.randomUUID(),
          name: choice.featName,
          source: cls.name,
          sourceId: featSourceId,
          description: choice.featDescription ?? "",
        } satisfies FeatureEntry)
      }
    }
  }

  return next
}

export function applyBackground(
  char: CharacterData,
  bgRow: BackgroundRow,
): CharacterData {
  const next = structuredClone(char)

  const oldSkillGrants = next.srdGrants?.skillProficiencies ?? []
  for (const key of oldSkillGrants) {
    if (next.skills[key]) next.skills[key].state = "None"
  }

  const skillGrants: string[] = bgRow.skillGrants ? JSON.parse(bgRow.skillGrants) : []
  for (const key of skillGrants) {
    if (next.skills[key]) next.skills[key].state = "Proficient"
  }

  next.srdGrants = {
    saveProficiencies: next.srdGrants?.saveProficiencies ?? [],
    skillProficiencies: skillGrants,
  }

  return next
}
