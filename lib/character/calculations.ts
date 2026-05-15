import type { CharacterData, AttributeKey, AttributeData, ModifierEntry, TrackerBaseSource } from "@/lib/types/character"

export function sumStack(stack: ModifierEntry[]): number {
  return (stack ?? [])
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0)
}

function resolveStackWithSetTo(base: number, stack: ModifierEntry[]): number {
  const active = (stack ?? []).filter((m) => m.isActive)
  const setTos = active.filter((m) => m.type === "Set To").map((m) => m.value)
  if (setTos.length > 0) return Math.max(...setTos)
  return base + active.reduce((s, m) => s + m.value, 0)
}

export function resolveAttributeScore(attr: AttributeData): number {
  if (attr.override !== null) return attr.override
  return resolveStackWithSetTo(attr.base, attr.stack)
}

export function resolveAttributeMod(attr: AttributeData): number {
  return Math.floor((resolveAttributeScore(attr) - 10) / 2)
}

export function resolvePb(c: CharacterData): number {
  const basePb = Math.ceil((c.identity?.level ?? 1) / 4) + 1
  const pbStackSum = sumStack(c.profBonusStack)
  return basePb + pbStackSum
}

function activeSetTos(stack: ModifierEntry[]): number[] {
  return (stack ?? []).filter((m) => m.isActive && m.type === "Set To").map((m) => m.value)
}

export function resolveSkillBonus(
  c: CharacterData,
  skillKey: string,
  attrKey: AttributeKey
): number {
  const skill = c.skills[skillKey]
  if (skill.override !== null) return skill.override

  const setTos = activeSetTos(skill.stack)
  if (setTos.length > 0) return Math.max(...setTos)

  const pb = resolvePb(c)
  const attrMod = resolveAttributeMod(c.attributes[attrKey])
  const stackSum = sumStack(skill.stack)
  const globalSum = sumStack(c.skillGlobalStack)

  let profMod = 0
  if (skill.state === "Proficient") profMod = pb
  else if (skill.state === "Expertise") profMod = pb * 2
  else if (c.jackOfAllTrades) profMod = Math.floor(pb / 2)

  return attrMod + stackSum + globalSum + profMod
}

export function resolveSaveBonus(
  c: CharacterData,
  attrKey: AttributeKey
): number {
  const save = c.saves[attrKey]
  if (save.override !== null) return save.override

  const setTos = activeSetTos(save.stack)
  if (setTos.length > 0) return Math.max(...setTos)

  const pb = resolvePb(c)
  const attrMod = resolveAttributeMod(c.attributes[attrKey])
  const stackSum = sumStack(save.stack)
  const globalSum = sumStack(c.saveGlobalStack)

  const profMod = save.proficient ? pb : 0

  return attrMod + stackSum + globalSum + profMod
}

export function resolveAc(c: CharacterData): number {
  const ac = c.combat.ac
  if (ac.override !== null) return ac.override

  const acStack = sumStack(ac.stack)
  if (ac.mode === "Standard") {
    return 10 + resolveAttributeMod(c.attributes["dex"]) + acStack
  }

  // Formula mode
  let statAMod = ac.statA ? resolveAttributeMod(c.attributes[ac.statA]) : 0
  if (ac.statA === "dex" && ac.acMaxDex != null) {
    statAMod = Math.min(statAMod, ac.acMaxDex)
  }
  const statBMod = ac.statB ? resolveAttributeMod(c.attributes[ac.statB]) : 0
  return ac.base + statAMod + statBMod + acStack
}

export function resolveInitiative(c: CharacterData): number {
  const init = c.combat.initiative
  if (init.override !== null) return init.override

  const dexMod = resolveAttributeMod(c.attributes["dex"])
  const stackSum = sumStack(init.stack)

  return dexMod + stackSum
}

export function resolveSpeed(c: CharacterData): number {
  const speed = c.combat.speed
  if (speed.override !== null) return speed.override
  return speed.base + sumStack(speed.stack)
}

export function resolveHpMax(c: CharacterData): number {
  const hp = c.combat.hp
  if (hp.max !== null) return hp.max

  const conMod = resolveAttributeMod(c.attributes["con"])
  let baseHp = 0
  c.identity.classes.forEach((cls, i) => {
    const die = parseInt(cls.hitDie.replace("d", ""), 10)
    if (isNaN(die) || cls.level < 1) return
    const avg = Math.floor(die / 2) + 1
    if (i === 0) {
      baseHp += die + conMod
      baseHp += Math.max(0, cls.level - 1) * (avg + conMod)
    } else {
      baseHp += cls.level * (avg + conMod)
    }
  })

  return baseHp + sumStack(hp.stack)
}

export function resolvePassivePerception(c: CharacterData): number {
  if (c.passivePerception.override !== null) return c.passivePerception.override

  const stackSum = sumStack(c.passivePerception.stack)
  return 10 + resolveSkillBonus(c, "perception", "wis") + stackSum
}

export function resolveSpellDc(c: CharacterData): number {
  const stat = c.spells.globalCastingStat
  const mod = stat ? resolveAttributeMod(c.attributes[stat]) : 0
  const pb = resolvePb(c)
  const stackSum = sumStack(c.spells.dcStack)
  return 8 + pb + mod + stackSum
}

export function resolveSpellAttack(c: CharacterData): number {
  const stat = c.spells.globalCastingStat
  const mod = stat ? resolveAttributeMod(c.attributes[stat]) : 0
  const pb = resolvePb(c)
  const stackSum = sumStack(c.spells.attackStack)
  return pb + mod + stackSum
}

export function resolveTrackerBase(
  tracker: { base: number; baseSource?: TrackerBaseSource },
  attrs: Record<AttributeKey, AttributeData>,
  level: number,
  pb: number,
): number {
  const src = tracker.baseSource
  if (!src || src.kind === "fixed") return tracker.base
  if (src.kind === "attr_mod") return resolveAttributeMod(attrs[src.attr])
  if (src.kind === "level") return level
  if (src.kind === "half_level_up") return Math.ceil(level / 2)
  if (src.kind === "half_level_down") return Math.floor(level / 2)
  if (src.kind === "prof_bonus") return pb
  return tracker.base
}

export function resolveEquippedWeight(c: CharacterData): number {
  return (c.inventory ?? [])
    .filter((item) => item.equipped)
    .reduce((sum, item) => sum + item.weight * (item.quantity ?? 1), 0)
}

export function resolveCarryCapacity(c: CharacterData): number {
  return resolveAttributeScore(c.attributes.str) * 15
}

export function isOverCarryCapacity(c: CharacterData): boolean {
  return resolveEquippedWeight(c) > resolveCarryCapacity(c)
}
