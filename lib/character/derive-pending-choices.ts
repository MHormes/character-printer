import type { CharacterData, AttributeKey } from "@/lib/types/character"
import type {
  ClassFeatureRow,
  ClassSkillChoiceRow,
  RaceAbilityBonusOptionRow,
  RaceSkillChoiceRow,
  RaceLanguageChoiceRow,
  RaceRow,
  SubraceRow,
  BackgroundRow,
  ClassStartingEquipmentOptionRow,
} from "@/lib/actions/5e-data"
import type { CharacterClassEntry } from "@/lib/types/character"

// ─── Starting equipment option types (stored as JSON in DB) ──────────────────

export type StartingEquipAlternative =
  | { type: "items"; label: string; items: { itemId: string; name: string; quantity: number }[] }
  | { type: "category"; label: string; category: string; count: number }
  | { type: "bundle"; label: string; fixedItems: { itemId: string; name: string; quantity: number }[]; categoryPick: { category: string; count: number } }

export type EquipmentPendingChoice = {
  classId: string
  className: string
  choiceIndex: number
  description: string
  chooseCount: number
  options: StartingEquipAlternative[]
}

export type PendingChoice = {
  classId: string
  className: string
  atLevel: number
  type: "asi" | "skill"
  // skill only
  skillOptions?: string[]
  skillsNeeded?: number
}

export type RacePendingChoice = {
  raceId: string
  raceName: string
  type: "asi" | "skill"
  // asi: pick from pool
  asiOptions?: { abilityScore: AttributeKey; bonus: number }[]
  asiChooseCount?: number
  // skill
  skillOptions?: string[]
  skillsNeeded?: number
}

export function getClassPendingChoiceKey(choice: Pick<PendingChoice, "classId" | "type" | "atLevel">): string {
  return `${choice.classId}:${choice.type}:${choice.atLevel}`
}

export function getRacePendingChoiceKey(choice: Pick<RacePendingChoice, "raceId" | "type">): string {
  return `${choice.raceId}:${choice.type}`
}

export function getEquipmentPendingChoiceKey(choice: Pick<EquipmentPendingChoice, "classId" | "choiceIndex">): string {
  return `${choice.classId}:equip:${choice.choiceIndex}`
}

export type BackgroundToolChoiceOption = {
  count: number;
  category: string;
  label: string;
}

export type BackgroundPendingChoice =
  | {
      type: "asi";
      backgroundId: string;
      backgroundName: string;
      asiPool: AttributeKey[];
    }
  | {
      type: "language";
      backgroundId: string;
      backgroundName: string;
      chooseCount: number;
    }
  | {
      type: "tool";
      backgroundId: string;
      backgroundName: string;
      choiceIndex: number;
      count: number;
      category: string;
      label: string;
    }

export type RaceLanguagePendingChoice = {
  sourceId: string;  // "race:<id>" or "subrace:<id>"
  sourceName: string;
  chooseCount: number;
}

export function getBackgroundPendingChoiceKey(choice: Pick<BackgroundPendingChoice, "backgroundId" | "type"> & { choiceIndex?: number }): string {
  if (choice.type === "tool") return `${choice.backgroundId}:tool:${choice.choiceIndex}`
  return `${choice.backgroundId}:${choice.type}`
}

export function getRaceLanguagePendingChoiceKey(choice: Pick<RaceLanguagePendingChoice, "sourceId">): string {
  return `${choice.sourceId}:language`
}

export function deriveBackgroundPendingChoices(
  char: CharacterData,
  bgRow: BackgroundRow | null | undefined,
): BackgroundPendingChoice[] {
  if (!bgRow) return []
  const dismissed = new Set(char.dismissedBackgroundChoiceKeys ?? [])
  const pending: BackgroundPendingChoice[] = []

  // ── ASI choices (2024 backgrounds) ───────────────────────────────────────
  if (bgRow.asiGrants) {
    const asiPool: string[] = typeof bgRow.asiGrants === "string" ? JSON.parse(bgRow.asiGrants) : bgRow.asiGrants as unknown as string[]
    if (asiPool.length > 0) {
      const filled = (char.backgroundChoices ?? []).some((c) => c.backgroundId === bgRow.id)
      const key = getBackgroundPendingChoiceKey({ backgroundId: bgRow.id, type: "asi" })
      if (!filled && !dismissed.has(key)) {
        pending.push({ type: "asi", backgroundId: bgRow.id, backgroundName: bgRow.name, asiPool: asiPool as AttributeKey[] })
      }
    }
  }

  // ── Language choices ──────────────────────────────────────────────────────
  const langCount: number = bgRow.languageChoiceCount ?? 0
  if (langCount > 0) {
    const madeCount = (char.languageChoices ?? []).filter((c) => c.sourceId === `background:${bgRow.id}`).length
    const remaining = langCount - madeCount
    if (remaining > 0) {
      const key = getBackgroundPendingChoiceKey({ backgroundId: bgRow.id, type: "language" })
      if (!dismissed.has(key)) {
        pending.push({ type: "language", backgroundId: bgRow.id, backgroundName: bgRow.name, chooseCount: remaining })
      }
    }
  }

  // ── Tool choices ──────────────────────────────────────────────────────────
  if (bgRow.toolChoicesJson) {
    const toolChoices: BackgroundToolChoiceOption[] = typeof bgRow.toolChoicesJson === "string"
      ? JSON.parse(bgRow.toolChoicesJson)
      : bgRow.toolChoicesJson as unknown as BackgroundToolChoiceOption[]
    for (let i = 0; i < toolChoices.length; i++) {
      const opt = toolChoices[i]
      const alreadyMade = (char.toolChoices ?? []).some((c) => c.backgroundId === bgRow.id && c.choiceIndex === i)
      const key = getBackgroundPendingChoiceKey({ backgroundId: bgRow.id, type: "tool", choiceIndex: i })
      if (!alreadyMade && !dismissed.has(key)) {
        pending.push({ type: "tool", backgroundId: bgRow.id, backgroundName: bgRow.name, choiceIndex: i, ...opt })
      }
    }
  }

  return pending
}

export function deriveRaceLanguagePendingChoices(
  char: CharacterData,
  raceRow: RaceRow | undefined,
  subraceRow: SubraceRow | undefined,
  allLangChoiceRows: RaceLanguageChoiceRow[],
): RaceLanguagePendingChoice[] {
  if (char.selectionIgnores?.race) return []
  const dismissed = new Set(char.dismissedRaceChoiceKeys ?? [])
  const pending: RaceLanguagePendingChoice[] = []

  if (raceRow) {
    const row = allLangChoiceRows.find((r) => r.raceId === raceRow.id && !r.subraceId)
    if (row) {
      const sourceId = `race:${raceRow.id}`
      const madeCount = (char.languageChoices ?? []).filter((c) => c.sourceId === sourceId).length
      const remaining = row.chooseCount - madeCount
      if (remaining > 0 && !dismissed.has(getRaceLanguagePendingChoiceKey({ sourceId }))) {
        pending.push({ sourceId, sourceName: raceRow.name, chooseCount: remaining })
      }
    }
  }

  if (subraceRow) {
    const row = allLangChoiceRows.find((r) => r.subraceId === subraceRow.id)
    if (row) {
      const sourceId = `subrace:${subraceRow.id}`
      const madeCount = (char.languageChoices ?? []).filter((c) => c.sourceId === sourceId).length
      const remaining = row.chooseCount - madeCount
      if (remaining > 0 && !dismissed.has(getRaceLanguagePendingChoiceKey({ sourceId }))) {
        pending.push({ sourceId, sourceName: subraceRow.name, chooseCount: remaining })
      }
    }
  }

  return pending
}

export function derivePendingChoices(
  char: CharacterData,
  classes: CharacterClassEntry[],
  allFeatureRows: ClassFeatureRow[],
  allSkillChoiceRows: ClassSkillChoiceRow[],
): PendingChoice[] {
  const pending: PendingChoice[] = []
  const activeClasses = classes.filter((c) => c.classId)
  const dismissed = new Set(char.dismissedClassChoiceKeys ?? [])

  for (const cls of activeClasses) {
    // ── ASI slots ─────────────────────────────────────────────────────────
    const asiFeatures = allFeatureRows.filter(
      (f) =>
        f.classId === cls.classId &&
        f.name === "Ability Score Improvement" &&
        f.level <= cls.level,
    )

    for (const feat of asiFeatures) {
      const isFilled = (char.classChoices ?? []).some(
        (c) =>
          c.classId === cls.classId &&
          c.atLevel === feat.level &&
          (c.type === "asi" || c.type === "feat"),
      )
      if (!isFilled) {
        const choice = {
          classId: cls.classId!,
          className: cls.name,
          atLevel: feat.level,
          type: "asi",
        } satisfies PendingChoice
        if (!dismissed.has(getClassPendingChoiceKey(choice))) pending.push(choice)
      }
    }

    // ── Skill proficiency choices ──────────────────────────────────────────
    const skillOptions = allSkillChoiceRows
      .filter((r) => r.classId === cls.classId)
      .map((r) => r.skillKey)

    if (skillOptions.length > 0) {
      const chooseCount = allSkillChoiceRows.find((r) => r.classId === cls.classId)!.chooseCount
      const madeCount = (char.classChoices ?? []).filter(
        (c) => c.classId === cls.classId && c.type === "skill",
      ).length
      const needed = chooseCount - madeCount
      if (needed > 0) {
        const choice = {
          classId: cls.classId!,
          className: cls.name,
          atLevel: 1,
          type: "skill",
          skillOptions,
          skillsNeeded: needed,
        } satisfies PendingChoice
        if (!dismissed.has(getClassPendingChoiceKey(choice))) pending.push(choice)
      }
    }
  }

  // ASI slots first (ordered by level), then skill choices
  return pending.sort((a, b) => {
    if (a.type !== b.type) return a.type === "asi" ? -1 : 1
    return a.atLevel - b.atLevel
  })
}

export function deriveEquipmentPendingChoices(
  char: CharacterData,
  classes: CharacterClassEntry[],
  allOptionRows: ClassStartingEquipmentOptionRow[],
): EquipmentPendingChoice[] {
  const pending: EquipmentPendingChoice[] = []
  const activeClasses = classes.filter((c) => c.classId && !c.ignoreAutomation)
  const dismissed = new Set(char.dismissedEquipmentChoiceKeys ?? [])

  for (const cls of activeClasses) {
    const optRows = allOptionRows
      .filter((r) => r.classId === cls.classId)
      .sort((a, b) => a.choiceIndex - b.choiceIndex)

    for (const row of optRows) {
      const alreadyMade = (char.equipmentChoicesMade ?? []).some(
        (m) => m.classId === cls.classId && m.choiceIndex === row.choiceIndex,
      )
      if (!alreadyMade) {
        const options: StartingEquipAlternative[] = JSON.parse(row.optionsJson)
        const choice = {
          classId: cls.classId!,
          className: cls.name,
          choiceIndex: row.choiceIndex,
          description: row.description,
          chooseCount: row.chooseCount,
          options,
        } satisfies EquipmentPendingChoice
        if (!dismissed.has(getEquipmentPendingChoiceKey(choice))) pending.push(choice)
      }
    }
  }

  return pending
}

export function deriveRacePendingChoices(
  char: CharacterData,
  raceRow: RaceRow | undefined,
  allAsiOptionRows: RaceAbilityBonusOptionRow[],
  allSkillChoiceRows: RaceSkillChoiceRow[],
): RacePendingChoice[] {
  if (!raceRow) return []
  if (char.selectionIgnores?.race) return []
  const pending: RacePendingChoice[] = []
  const dismissed = new Set(char.dismissedRaceChoiceKeys ?? [])

  // ── Choosable ASI bonuses (e.g. Half-Elf +1 to 2 stats) ──────────────────
  const asiOptions = allAsiOptionRows.filter((r) => r.raceId === raceRow.id)
  if (asiOptions.length > 0) {
    const chooseCount = asiOptions[0].chooseCount
    const madeCount = (char.raceChoices ?? []).filter(
      (c) => c.raceId === raceRow.id && c.type === "asi",
    ).length
    const remaining = chooseCount - madeCount
    if (remaining > 0) {
      const alreadyPicked = new Set(
        (char.raceChoices ?? [])
          .filter((c) => c.raceId === raceRow.id && c.type === "asi")
          .map((c) => c.abilityScore),
      )
      pending.push({
        raceId: raceRow.id,
        raceName: raceRow.name,
        type: "asi",
        asiOptions: asiOptions
          .filter((r) => !alreadyPicked.has(r.abilityScore as AttributeKey))
          .map((r) => ({ abilityScore: r.abilityScore as AttributeKey, bonus: r.bonus })),
        asiChooseCount: remaining,
      })
    }
  }

  // ── Skill proficiency choices (e.g. Half-Elf 2 from any) ─────────────────
  const skillOptions = allSkillChoiceRows.filter((r) => r.raceId === raceRow.id)
  if (skillOptions.length > 0) {
    const chooseCount = skillOptions[0].chooseCount
    const alreadyPicked = new Set(
      (char.raceChoices ?? [])
        .filter((c) => c.raceId === raceRow.id && c.type === "skill")
        .map((c) => c.skillKey),
    )
    const needed = chooseCount - alreadyPicked.size
    if (needed > 0) {
      pending.push({
        raceId: raceRow.id,
        raceName: raceRow.name,
        type: "skill",
        skillOptions: skillOptions.filter((r) => !alreadyPicked.has(r.skillKey)).map((r) => r.skillKey),
        skillsNeeded: needed,
      })
    }
  }

  return pending.filter((choice) => !dismissed.has(getRacePendingChoiceKey(choice)))
}
