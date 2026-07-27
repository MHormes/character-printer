import type { AttributeKey, DamageEntry, DieType } from "@/lib/types/character"

function sign(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

// Groups a flat damageStack by orGroup: entries sharing a non-null orGroup are
// alternatives (OR — versatile dice, a choice of damage type, etc.) collapsed
// into one group; null-orGroup entries are each their own singleton (AND) group.
export function resolveDamageGroups(damageStack: DamageEntry[]): DamageEntry[][] {
  const groups: DamageEntry[][] = []
  const indexByGroup = new Map<string, number>()
  for (const d of damageStack) {
    if (d.orGroup && indexByGroup.has(d.orGroup)) {
      groups[indexByGroup.get(d.orGroup)!].push(d)
      continue
    }
    if (d.orGroup) indexByGroup.set(d.orGroup, groups.length)
    groups.push([d])
  }
  return groups
}

// Joins alternatives in natural language: "A or B", "A, B or C".
function joinOr(parts: string[]): string {
  if (parts.length <= 2) return parts.join(" or ")
  return `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}`
}

function diceOf(d: DamageEntry): string {
  return `${d.diceCount}${d.dieType}`
}

function bonusOf(d: DamageEntry, attrMod: (key: AttributeKey) => number): string {
  const total = (d.stat ? attrMod(d.stat) : 0) + (d.flatBonus ?? 0)
  return total !== 0 ? sign(total) : ""
}

export function formatDamageGroup(group: DamageEntry[], attrMod: (key: AttributeKey) => number): string {
  if (group.length === 1) {
    const d = group[0]
    if (!d.active) return ""
    return formatSingleDamage(d, attrMod)
  }

  // OR group: only fold parts together when they actually match — otherwise
  // spell each alternative out in full so nothing gets silently merged away.
  const dice = group.map(diceOf)
  const bonuses = group.map((d) => bonusOf(d, attrMod))
  const types = group.map((d) => d.type ?? "")
  const sameDice = dice.every((v) => v === dice[0])
  const sameBonus = bonuses.every((v) => v === bonuses[0])
  const sameType = types.every((v) => v === types[0])

  if (sameDice && sameBonus && !sameType) {
    // Same roll, different damage type — e.g. Destructive Wave: 5d6 Necrotic or Radiant
    const typePart = joinOr(types.filter(Boolean))
    return `${dice[0]}${bonuses[0]}${typePart ? ` ${typePart}` : ""}`
  }

  if (sameType && sameBonus && !sameDice) {
    // Same type/bonus, different dice — e.g. versatile weapon: 1d6/1d8 Bludgeoning
    const typePart = types[0] ? ` ${types[0]}` : ""
    return `${dice.join("/")}${bonuses[0]}${typePart}`
  }

  // Nothing lines up cleanly — list each alternative in full.
  return joinOr(group.map((d) => formatSingleDamage(d, attrMod)))
}

function formatSingleDamage(d: DamageEntry, attrMod: (key: AttributeKey) => number): string {
  const total = (d.stat ? attrMod(d.stat) : 0) + (d.flatBonus ?? 0)
  const bonusPart = total !== 0 ? sign(total) : ""
  const typePart = d.type ? ` ${d.type}` : ""
  return `${d.diceCount}${d.dieType}${bonusPart}${typePart}`
}

// Single joined summary string, e.g. "2d8 Radiant + 2d8 Thunder", "1d6/1d8 Bludgeoning",
// or "5d6 Thunder + 5d6 Necrotic or Radiant" (an OR group only folds dice/type/bonus
// together when they match across alternatives; otherwise each is spelled out in full).
export function formatDamageStack(damageStack: DamageEntry[] | undefined, attrMod: (key: AttributeKey) => number): string {
  return resolveDamageGroups(damageStack ?? [])
    .map((g) => formatDamageGroup(g, attrMod))
    .filter(Boolean)
    .join(" + ")
}

// Returns 1 or 2 printable lines: AND groups that don't fit maxLineLen on one
// line wrap the overflow onto a second line instead of being dropped/truncated.
export function formatDamageLines(
  damageStack: DamageEntry[] | undefined,
  attrMod: (key: AttributeKey) => number,
  maxLineLen = 16,
): string[] {
  const parts = resolveDamageGroups(damageStack ?? [])
    .map((g) => formatDamageGroup(g, attrMod))
    .filter(Boolean)
  if (parts.length === 0) return []
  const full = parts.join(" + ")
  if (parts.length === 1 || full.length <= maxLineLen) return [full]

  let line1 = parts[0]
  let i = 1
  while (i < parts.length && line1.length + 3 + parts[i].length <= maxLineLen) {
    line1 += " + " + parts[i]
    i++
  }
  const line2 = parts.slice(i).join(" + ")
  return line2 ? [line1, line2] : [line1]
}

type WeaponDamageInput = {
  damageDiceCount: number
  damageDieType: string
  damageType: string | null
  twoHandedDiceCount?: number | null
  twoHandedDieType?: string | null
  twoHandedDamageType?: string | null
  stat: AttributeKey
}

// Builds a weapon's damageStack, grouping the primary and two-handed (versatile)
// profiles as an OR pair when both are present instead of the old active:false hack.
export function buildWeaponDamageStack(input: WeaponDamageInput): DamageEntry[] {
  const primary: DamageEntry = {
    diceCount: input.damageDiceCount,
    dieType: input.damageDieType as DieType,
    stat: input.stat,
    flatBonus: 0,
    type: input.damageType ?? "Bludgeoning",
    active: true,
    orGroup: null,
  }

  if (!input.twoHandedDiceCount || !input.twoHandedDieType) return [primary]

  const orGroup = crypto.randomUUID()
  return [
    { ...primary, orGroup },
    {
      diceCount: input.twoHandedDiceCount,
      dieType: input.twoHandedDieType as DieType,
      stat: "str",
      flatBonus: 0,
      type: input.twoHandedDamageType ?? primary.type,
      active: false,
      orGroup,
    },
  ]
}

// Toggles whether damageStack[idx] is linked (OR/alternative) with damageStack[idx-1].
export function toggleOrLink(damageStack: DamageEntry[], idx: number): DamageEntry[] {
  if (idx <= 0 || idx >= damageStack.length) return damageStack
  const cur = damageStack[idx]
  const prev = damageStack[idx - 1]
  const linked = cur.orGroup !== null && cur.orGroup === prev.orGroup
  if (linked) {
    return damageStack.map((d, i) => (i === idx ? { ...d, orGroup: null } : d))
  }
  const groupId = prev.orGroup ?? crypto.randomUUID()
  return damageStack.map((d, i) => (i === idx || i === idx - 1 ? { ...d, orGroup: groupId } : d))
}
