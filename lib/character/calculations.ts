import type { CharacterData, AttributeKey, AttributeData, ModifierEntry } from "@/lib/types/character"

export function sumStack(stack: ModifierEntry[]): number {
  return (stack ?? [])
    .filter((m) => m.isActive)
    .reduce((s, m) => s + m.value, 0)
}

export function resolveAttributeScore(attr: AttributeData): number {
  if (attr.override !== null) return attr.override
  return attr.base + sumStack(attr.stack)
}

export function resolveAttributeMod(attr: AttributeData): number {
  return Math.floor((resolveAttributeScore(attr) - 10) / 2)
}

export function resolvePb(c: CharacterData): number {
  const basePb = Math.ceil((c.identity?.level ?? 1) / 4) + 1
  const pbStackSum = sumStack(c.profBonusStack)
  return basePb + pbStackSum
}

export function resolveSkillBonus(
  c: CharacterData,
  skillKey: string,
  attrKey: AttributeKey
): number {
  const skill = c.skills[skillKey]
  if (skill.override !== null) return skill.override

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

  const pb = resolvePb(c)
  const attrMod = resolveAttributeMod(c.attributes[attrKey])
  const stackSum = sumStack(save.stack)
  const globalSum = sumStack(c.saveGlobalStack)

  return attrMod + stackSum + globalSum + (save.proficient ? pb : 0)
}

export function resolveAc(c: CharacterData): number {
  const ac = c.combat.ac
  if (ac.override !== null) return ac.override

  const acStack = sumStack(ac.stack)
  if (ac.mode === "Standard") {
    return 10 + resolveAttributeMod(c.attributes["dex"]) + acStack
  }

  // Formula mode
  const statAMod = ac.statA ? resolveAttributeMod(c.attributes[ac.statA]) : 0
  const statBMod = ac.statB ? resolveAttributeMod(c.attributes[ac.statB]) : 0
  return ac.base + statAMod + statBMod + acStack
}

export function resolveInitiative(c: CharacterData): number {
  const init = c.combat.initiative
  if (init.override !== null) return init.override

  const dexMod = resolveAttributeMod(c.attributes["dex"])
  const stackSum = sumStack(init.stack)
  const pb = resolvePb(c)
  const joatBonus = c.jackOfAllTrades ? Math.floor(pb / 2) : 0

  return dexMod + stackSum + joatBonus
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
