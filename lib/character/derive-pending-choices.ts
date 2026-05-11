import type { CharacterData } from "@/lib/types/character"
import type {
  ClassFeatureRow,
  ClassSkillChoiceRow,
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
