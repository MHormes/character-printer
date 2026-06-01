import type { AttributeKey, AttributeData, CharacterClassEntry } from "@/lib/types/character"
import { resolveAttributeScore } from "@/lib/character/calculations"

type AttrMin = { attr: AttributeKey; min: number }
type MulticlassPrereq =
  | { type: "single"; req: AttrMin }
  | { type: "or"; reqs: AttrMin[] }
  | { type: "and"; reqs: AttrMin[] }

const PREREQS_BY_SLUG: Record<string, MulticlassPrereq> = {
  barbarian: { type: "single", req: { attr: "str", min: 13 } },
  bard:      { type: "single", req: { attr: "cha", min: 13 } },
  cleric:    { type: "single", req: { attr: "wis", min: 13 } },
  druid:     { type: "single", req: { attr: "wis", min: 13 } },
  fighter:   { type: "or",    reqs: [{ attr: "str", min: 13 }, { attr: "dex", min: 13 }] },
  monk:      { type: "and",   reqs: [{ attr: "dex", min: 13 }, { attr: "wis", min: 13 }] },
  paladin:   { type: "and",   reqs: [{ attr: "str", min: 13 }, { attr: "cha", min: 13 }] },
  ranger:    { type: "and",   reqs: [{ attr: "dex", min: 13 }, { attr: "wis", min: 13 }] },
  rogue:     { type: "single", req: { attr: "dex", min: 13 } },
  sorcerer:  { type: "single", req: { attr: "cha", min: 13 } },
  warlock:   { type: "single", req: { attr: "cha", min: 13 } },
  wizard:    { type: "single", req: { attr: "int", min: 13 } },
}

const ATTR_LABEL: Record<AttributeKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
}

export type MulticlassWarning = {
  classId: string
  className: string
  requirementText: string
  failingAttrs: { attr: AttributeKey; have: number; need: number }[]
}

export function deriveMulticlassWarnings(
  classes: CharacterClassEntry[],
  attributes: Record<AttributeKey, AttributeData>,
): MulticlassWarning[] {
  if (classes.length < 2) return []

  const warnings: MulticlassWarning[] = []

  for (const cls of classes.slice(1)) {
    if (!cls.classId) continue
    // Extract slug: last segment after the last ":"
    const slug = cls.classId.split(":").pop() ?? ""
    const prereq = PREREQS_BY_SLUG[slug]
    if (!prereq) continue

    const score = (attr: AttributeKey) => resolveAttributeScore(attributes[attr])

    if (prereq.type === "single") {
      const have = score(prereq.req.attr)
      if (have < prereq.req.min) {
        warnings.push({
          classId: cls.classId,
          className: cls.name,
          requirementText: `${ATTR_LABEL[prereq.req.attr]} ${prereq.req.min}`,
          failingAttrs: [{ attr: prereq.req.attr, have, need: prereq.req.min }],
        })
      }
    } else if (prereq.type === "or") {
      const met = prereq.reqs.some((r) => score(r.attr) >= r.min)
      if (!met) {
        warnings.push({
          classId: cls.classId,
          className: cls.name,
          requirementText: prereq.reqs.map((r) => `${ATTR_LABEL[r.attr]} ${r.min}`).join(" or "),
          failingAttrs: prereq.reqs.map((r) => ({ attr: r.attr, have: score(r.attr), need: r.min })),
        })
      }
    } else {
      // "and" — warn for each failing req individually
      const failing = prereq.reqs.filter((r) => score(r.attr) < r.min)
      if (failing.length > 0) {
        warnings.push({
          classId: cls.classId,
          className: cls.name,
          requirementText: prereq.reqs.map((r) => `${ATTR_LABEL[r.attr]} ${r.min}`).join(" and "),
          failingAttrs: failing.map((r) => ({ attr: r.attr, have: score(r.attr), need: r.min })),
        })
      }
    }
  }

  return warnings
}

export function getMulticlassWarningKey(classId: string): string {
  return `multiclass:${classId}`
}
