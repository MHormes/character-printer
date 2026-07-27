import type { ActionEntry, SpellEntry } from "@/lib/types/character"

export function buildActionFromSpell(spell: SpellEntry, existingId?: string): ActionEntry {
  return {
    id: existingId ?? crypto.randomUUID(),
    name: spell.name,
    mode: spell.mode,
    attackStat: null,
    attackProficient: true,
    attackBonus: 0,
    fixedDC: spell.fixedDC,
    damageStack: spell.damageStack.map(d => ({ ...d })),
    notes: [
      spell.level === 0 ? "Cantrip" : `Level ${spell.level}`,
      spell.castingTime,
      spell.range,
    ].filter(Boolean).join(" · "),
    sourceId: spell.id,
  }
}
