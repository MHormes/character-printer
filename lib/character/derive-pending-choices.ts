import type { CharacterData, AttributeKey } from "@/lib/types/character"
import type {
  ClassFeatureRow,
  ClassSkillChoiceRow,
  RaceAbilityBonusOptionRow,
  RaceSkillChoiceRow,
  RaceRow,
} from "@/lib/actions/5e-data"
import type { CharacterClassEntry } from "@/lib/types/character"

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

export function derivePendingChoices(
  char: CharacterData,
  classes: CharacterClassEntry[],
  allFeatureRows: ClassFeatureRow[],
  allSkillChoiceRows: ClassSkillChoiceRow[],
): PendingChoice[] {
  const pending: PendingChoice[] = []
  const activeClasses = classes.filter((c) => c.classId)

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
        pending.push({
          classId: cls.classId!,
          className: cls.name,
          atLevel: feat.level,
          type: "asi",
        })
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
        pending.push({
          classId: cls.classId!,
          className: cls.name,
          atLevel: 1,
          type: "skill",
          skillOptions,
          skillsNeeded: needed,
        })
      }
    }
  }

  // ASI slots first (ordered by level), then skill choices
  return pending.sort((a, b) => {
    if (a.type !== b.type) return a.type === "asi" ? -1 : 1
    return a.atLevel - b.atLevel
  })
}

export function deriveRacePendingChoices(
  char: CharacterData,
  raceRow: RaceRow | undefined,
  allAsiOptionRows: RaceAbilityBonusOptionRow[],
  allSkillChoiceRows: RaceSkillChoiceRow[],
): RacePendingChoice[] {
  if (!raceRow) return []
  const pending: RacePendingChoice[] = []

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

  return pending
}
