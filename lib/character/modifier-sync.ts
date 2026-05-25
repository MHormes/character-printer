import type { CharacterData, InventoryItem, ModifierEntry, ModifierTarget } from "@/lib/types/character"
import { resolvePb } from "./calculations"

const ATTR_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const

function updateStack(
  existing: ModifierEntry[],
  incoming: ModifierEntry[],
  prefix: string,
): ModifierEntry[] {
  return [...existing.filter((m) => !m.sourceId?.startsWith(prefix)), ...incoming]
}

/**
 * Rebuilds all inventory-managed modifier entries across every stack in the
 * character. Called whenever inventory changes. Equipped items produce active
 * entries; unequipped produce inactive entries; removed items produce nothing.
 */
export function syncInventoryToStacks(
  c: CharacterData,
  inventory: InventoryItem[],
): void {
  const prefix = "item:"

  // Build a map: target → entries contributed by all items
  const byTarget = new Map<ModifierTarget, ModifierEntry[]>()

  for (const item of inventory) {
    for (const mod of item.modifiers) {
      if (!byTarget.has(mod.target)) byTarget.set(mod.target, [])
      byTarget.get(mod.target)!.push({
        id: mod.id,
        source: item.name || "(unnamed item)",
        value: mod.value,
        type: mod.type,
        isActive: item.equipped,
        sourceId: `item:${item.id}`,
      })
    }
  }

  function get(target: ModifierTarget): ModifierEntry[] {
    return byTarget.get(target) ?? []
  }

  // Attributes & saves
  for (const key of ATTR_KEYS) {
    c.attributes[key].stack = updateStack(c.attributes[key].stack, get(`attr.${key}`), prefix)
    c.saves[key].stack      = updateStack(c.saves[key].stack,      get(`save.${key}`), prefix)
  }

  // Global save / skill stacks
  c.saveGlobalStack  = updateStack(c.saveGlobalStack,  get("save.all"),   prefix)
  c.skillGlobalStack = updateStack(c.skillGlobalStack, get("skill.all"),  prefix)
  c.passivePerception.stack = updateStack(
    c.passivePerception.stack,
    get("sense.passivePerception"),
    prefix,
  )

  // Individual skills
  for (const key of Object.keys(c.skills)) {
    c.skills[key].stack = updateStack(
      c.skills[key].stack,
      get(`skill.${key}` as ModifierTarget),
      prefix,
    )
  }

  // Combat
  c.combat.ac.stack         = updateStack(c.combat.ac.stack,         get("combat.ac"),         prefix)
  c.combat.hp.stack         = updateStack(c.combat.hp.stack,         get("combat.hp"),         prefix)
  c.combat.initiative.stack = updateStack(c.combat.initiative.stack, get("combat.initiative"), prefix)
  c.combat.speed.stack      = updateStack(c.combat.speed.stack,      get("combat.speed"),      prefix)

  // Armor formula sync: equipped armor with acBase drives Formula mode
  const equippedArmors = inventory
    .filter((item) => item.equipped && (item.acBase ?? null) !== null && item.acSetsFormula !== false)
    .sort((a, b) => (b.acBase ?? 0) - (a.acBase ?? 0))
  const armorItem = equippedArmors[0] ?? null

  if (armorItem) {
    c.combat.ac.mode           = "Formula"
    c.combat.ac.base           = armorItem.acBase!
    c.combat.ac.statA          = armorItem.acDexBonus ? "dex" : null
    c.combat.ac.statB          = null
    c.combat.ac.armorSourceId  = armorItem.id
    c.combat.ac.armorSourceName = armorItem.name || "(unnamed armor)"
    c.combat.ac.acMaxDex       = armorItem.acMaxDex ?? null
  } else if (c.combat.ac.armorSourceId) {
    // Was armor-driven; revert to Standard when armor is removed/unequipped
    c.combat.ac.mode           = "Standard"
    c.combat.ac.armorSourceId  = null
    c.combat.ac.armorSourceName = null
    c.combat.ac.acMaxDex       = null
  }

  // Spell slots
  for (const level of Object.keys(c.spells.slots)) {
    c.spells.slots[level].stack = updateStack(
      c.spells.slots[level].stack,
      get(`spell.slots.${level}` as ModifierTarget),
      prefix,
    )
  }

  // Spell attack / DC / prof bonus
  c.spells.attackStack = updateStack(c.spells.attackStack, get("spell.attack"), prefix)
  c.spells.dcStack     = updateStack(c.spells.dcStack,     get("spell.dc"),     prefix)
  c.profBonusStack     = updateStack(c.profBonusStack,     get("prof_bonus"),   prefix)

  syncGlobalSkillToInitiative(c)
}

export function syncJoatToStacks(c: CharacterData): void {
  const prefix = "joat:"
  const pb = resolvePb(c)
  const joatVal = Math.floor(pb / 2)

  // Initiative: JoAT always applies when the feature is active
  const initIncoming: ModifierEntry[] = c.jackOfAllTrades
    ? [{ id: "joat:initiative:entry", source: "Jack of All Trades", sourceId: "joat:initiative", value: joatVal, isActive: true }]
    : []
  c.combat.initiative.stack = updateStack(c.combat.initiative.stack, initIncoming, prefix)

  // Saving throws: JoAT applies only when explicitly enabled (2024 rule)
  const saveIncoming: ModifierEntry[] =
    c.jackOfAllTrades && (c.jackOfAllTradesSaves ?? false)
      ? [{ id: "joat:saves:entry", source: "Jack of All Trades", sourceId: "joat:saves", value: joatVal, isActive: true }]
      : []
  c.saveGlobalStack = updateStack(c.saveGlobalStack, saveIncoming, prefix)
}

export function syncGlobalSkillToInitiative(c: CharacterData): void {
  const prefix = "global_skill:"
  const mirrored = c.skillGlobalStack.map((entry) => ({
    ...entry,
    sourceId: `${prefix}${entry.id}`,
  }))
  c.combat.initiative.stack = updateStack(c.combat.initiative.stack, mirrored, prefix)
}
