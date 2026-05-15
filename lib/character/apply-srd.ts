import type { CharacterData, AttributeKey, FeatureEntry, ClassChoiceMade, RaceChoiceMade, BackgroundChoiceMade, InventoryItem, OtherProficiency } from "@/lib/types/character"
import type {
  RaceRow,
  SubraceRow,
  RaceTraitRow,
  ClassFeatureRow,
  ClassProficiencyRow,
  BackgroundRow,
  RaceAbilityBonusRow,
  ClassStartingEquipmentRow,
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

export function clearRaceAutomation(char: CharacterData): CharacterData {
  const next = structuredClone(char)
  next.features = next.features.filter(
    (f) => !f.sourceId?.startsWith("race:") && !f.sourceId?.startsWith("subrace:"),
  )
  clearRaceModifiers(next)
  next.srdGrants = {
    saveProficiencies: next.srdGrants?.saveProficiencies ?? [],
    skillProficiencies: next.srdGrants?.skillProficiencies ?? [],
    raceAsiBonuses: [],
  }
  return next
}

export function applyRace(
  char: CharacterData,
  raceRow: RaceRow,
  raceTraits: RaceTraitRow[],
  allAsiBonuses: RaceAbilityBonusRow[],
  raceChoices: RaceChoiceMade[],
  oldRaceKey?: string,
  subraceRow?: SubraceRow,
  subraceTraits?: RaceTraitRow[],
): CharacterData {
  const next = structuredClone(char)

  // Parse current state
  const currentBaseKey = `${raceRow.id}:${subraceRow?.id ?? ""}`

  // Parse old state and historical state
  const [oldBasePart, oldChoicesPart] = (oldRaceKey ?? "").split("|")
  const [histBasePart, histChoicesPart] = (char.automationKeys?.srdRaceKey ?? "").split("|")

  // 1. Major Change Handling: if base race/subrace changed, do full clear
  // Use historical key to prevent re-adding on characters where the session key is missing
  if (oldBasePart !== currentBaseKey && histBasePart !== currentBaseKey) {
    next.features = next.features.filter(
      (f) => !f.sourceId?.startsWith("race:") && !f.sourceId?.startsWith("subrace:"),
    )
    clearRaceModifiers(next)

    // Apply base traits (only on major change)
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

    // Fixed ASI bonuses (major change only)
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
  }

  // 2. Surgical Choice Management
  // Combine session choices and historical choices to find "processed" IDs
  const processedChoiceIds = new Set<string>()
  if (oldChoicesPart) oldChoicesPart.split(",").forEach(c => processedChoiceIds.add(c.split(":")[0]))
  if (histChoicesPart) histChoicesPart.split(",").forEach(c => processedChoiceIds.add(c.split(":")[0]))

  const validRaceChoices = raceChoices.filter((c) => c.raceId === raceRow.id)
  next.raceChoices = validRaceChoices

  // Remove stale choice effects (only if they are in the session key and missing in new choices)
  const oldChoiceIds = new Set<string>()
  if (oldChoicesPart) oldChoicesPart.split(",").forEach(c => oldChoiceIds.add(c.split(":")[0]))
  
  const currentChoiceIds = new Set(validRaceChoices.map(c => c.id))
  oldChoiceIds.forEach(id => {
    if (id && !currentChoiceIds.has(id)) {
      const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]
      for (const key of ATTR_KEYS) {
        next.attributes[key].stack = next.attributes[key].stack.filter(
          (m) => m.sourceId !== `race:choice:${id}`
        )
      }
    }
  })

  // Apply ONLY new choices (not in processed history)
  for (const choice of validRaceChoices) {
    if (processedChoiceIds.has(choice.id)) continue

    if (choice.type === "asi" && choice.abilityScore && choice.bonus !== undefined) {
      const attrKey = choice.abilityScore
      if (!next.attributes[attrKey]) continue
      next.attributes[attrKey].stack.push({
        id: crypto.randomUUID(),
        source: raceRow.name,
        sourceId: `race:choice:${choice.id}`,
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
  oldClassKey?: string,
): CharacterData {
  const next = structuredClone(char)

  // Parse old state: "classId:level,classId:level|choiceId:type:val,choiceId:type:val"
  const [oldClassesPart] = (oldClassKey ?? "").split("|")
  const oldClassMap = new Map<string, number>() // classId -> level
  const oldClassOrder: string[] = []
  
  // Also track the maximum level we've EVER processed for a class to prevent re-adding on reloads/level-ups
  const maxProcessedLevelByClass = new Map<string, number>()
  if (char.automationKeys?.srdClassKey) {
    const [prevClassesPart] = char.automationKeys.srdClassKey.split("|")
    prevClassesPart.split(",").forEach(pair => {
      // Correctly handle namespaced IDs (e.g. "dnd5e:bard:5") by finding the LAST colon
      const lastColonIdx = pair.lastIndexOf(":")
      if (lastColonIdx !== -1) {
        const id = pair.slice(0, lastColonIdx)
        const lvlStr = pair.slice(lastColonIdx + 1)
        const level = parseInt(lvlStr, 10)
        if (id && !isNaN(level)) {
          maxProcessedLevelByClass.set(id, Math.max(maxProcessedLevelByClass.get(id) ?? 0, level))
        }
      }
    })
  }

  if (oldClassesPart) {
    oldClassesPart.split(",").forEach((pair) => {
      const lastColonIdx = pair.lastIndexOf(":")
      if (lastColonIdx !== -1) {
        const id = pair.slice(0, lastColonIdx)
        const lvlStr = pair.slice(lastColonIdx + 1)
        const lvl = parseInt(lvlStr, 10)
        if (id && !isNaN(lvl)) {
          oldClassMap.set(id, lvl)
          oldClassOrder.push(id)
        }
      }
    })
  }

  const activeClasses = classes.filter((c) => c.classId)
  const primaryClass = activeClasses[0]
  
  // 1. Surgical Removal & Major Change Handling
  activeClasses.forEach((cls, idx) => {
    const oldId = oldClassOrder[idx]
    const oldLvl = oldId ? oldClassMap.get(oldId) ?? 0 : 0

    if (oldId && oldId !== cls.classId) {
      // Major change: class at this slot swapped. Clear all features for the OLD class.
      next.features = next.features.filter((f) => !f.sourceId?.startsWith(`class:${oldId}:`))
    } else if (oldId === cls.classId && cls.level < oldLvl) {
      // Level down: remove features for levels > current
      next.features = next.features.filter((f) => {
        if (!f.sourceId?.startsWith(`class:${cls.classId}:`)) return true
        const featLvl = parseInt(f.sourceId.split(":")[2], 10)
        return featLvl <= cls.level
      })
    }
  })

  // Remove features for class slots that were completely removed
  if (oldClassOrder.length > activeClasses.length) {
    for (let i = activeClasses.length; i < oldClassOrder.length; i++) {
      const removedId = oldClassOrder[i]
      next.features = next.features.filter((f) => !f.sourceId?.startsWith(`class:${removedId}:`))
    }
  }

  // 2. Surgical Addition
  activeClasses.forEach((cls) => {
    // We only add features for levels that have NEVER been processed before for this class
    const lastProcessedLvl = maxProcessedLevelByClass.get(cls.classId!) ?? 0

    const newFeatures = allFeatureRows.filter(
      (f) => f.classId === cls.classId && f.level > lastProcessedLvl && f.level <= cls.level,
    )

    for (const feat of newFeatures) {
      // Fallback check: even if lastProcessedLvl suggests adding, don't add if a feature 
      // with the exact same name and sourceId already exists (handles some edge cases)
      const exists = next.features.some(
        (f) => f.sourceId === `class:${cls.classId}:${feat.level}` && f.name === feat.name
      )
      if (exists) continue

      next.features.push({
        id: crypto.randomUUID(),
        name: feat.name,
        source: cls.name,
        sourceId: `class:${cls.classId}:${feat.level}`,
        description: feat.description ?? "",
      } satisfies FeatureEntry)
    }
  })

  // 3. Deterministic Grants (Saves)
  // These are refreshed fully because they are small and state-based (proficient true/false)
  const oldSaveGrants = next.srdGrants?.saveProficiencies ?? []
  for (const key of oldSaveGrants) {
    const attrKey = key as AttributeKey
    if (next.saves[attrKey]) next.saves[attrKey].proficient = false
  }

  const newSaveGrants: string[] = []
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

  // ── Deterministic Grants (Armor / Weapon / Tool / Language) ──────────────
  next.otherProficiencies = next.otherProficiencies.filter(
    (p) => !p.sourceId?.startsWith("class:"),
  )

  const PROF_TYPE_TO_CATEGORY: Record<string, OtherProficiency["category"]> = {
    Armor: "Armor",
    Weapons: "Weapon",
    Tools: "Tool",
    Languages: "Language",
  }

  for (const cls of activeClasses) {
    const classProfs = allProfRows.filter(
      (p) =>
        p.classId === cls.classId &&
        p.profType !== "Saving Throws" &&
        p.profType !== "Skills",
    )
    for (const prof of classProfs) {
      const category = PROF_TYPE_TO_CATEGORY[prof.profType]
      if (!category) continue
      const already = next.otherProficiencies.some(
        (p) => p.name === prof.name && p.category === category,
      )
      if (already) continue
      next.otherProficiencies.push({
        id: crypto.randomUUID(),
        name: prof.name,
        category,
        training: "Proficient",
        stat: null,
        override: null,
        sourceId: `class:${cls.classId}:prof`,
      })
    }
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

  // ── Subclass Feature Handling ────────────────────────────────────────────────
  // Stored format: "classId|subclassId:maxLevel,..."
  // Tracks what was last applied so we only add new features on level-up (same as base class logic).
  const oldSubclassMap = new Map<string, { subclassId: string; maxLevel: number }>()
  const storedSubclassKey = char.automationKeys?.srdSubclassKey ?? ""
  if (storedSubclassKey) {
    for (const entry of storedSubclassKey.split(",")) {
      const pipeIdx = entry.indexOf("|")
      if (pipeIdx === -1) continue
      const cId = entry.slice(0, pipeIdx)
      const rest = entry.slice(pipeIdx + 1)
      const colonIdx = rest.lastIndexOf(":")
      if (colonIdx === -1) continue
      const scId = rest.slice(0, colonIdx)
      const maxLevel = parseInt(rest.slice(colonIdx + 1), 10) || 0
      if (cId) oldSubclassMap.set(cId, { subclassId: scId, maxLevel })
    }
  }

  for (const cls of activeClasses) {
    if (!cls.classId) continue
    const currentSubclassId = cls.subclassId ?? ""
    const old = oldSubclassMap.get(cls.classId)
    const oldSubclassId = old?.subclassId ?? ""
    const oldMaxLevel = old?.maxLevel ?? 0

    if (currentSubclassId === "" && oldSubclassId === "") continue

    if (currentSubclassId !== oldSubclassId) {
      // Subclass changed — clear old subclass features and apply all new ones up to current level
      next.features = next.features.filter(
        (f) => !f.sourceId?.startsWith(`class:${cls.classId}:sc:`),
      )
      if (currentSubclassId) {
        const scFeats = allFeatureRows.filter(
          (f) => f.classId === cls.classId && f.subclassId === currentSubclassId && f.level <= cls.level,
        )
        for (const feat of scFeats) {
          next.features.push({
            id: crypto.randomUUID(),
            name: feat.name,
            source: cls.name,
            sourceId: `class:${cls.classId}:sc:${currentSubclassId}:${feat.level}`,
            description: feat.description ?? "",
          } satisfies FeatureEntry)
        }
      }
    } else if (currentSubclassId) {
      if (cls.level > oldMaxLevel) {
        // Leveled up — add only newly unlocked subclass features (same fire-once guarantee as base class)
        const scFeats = allFeatureRows.filter(
          (f) =>
            f.classId === cls.classId &&
            f.subclassId === currentSubclassId &&
            f.level > oldMaxLevel &&
            f.level <= cls.level,
        )
        for (const feat of scFeats) {
          const exists = next.features.some(
            (f) =>
              f.sourceId === `class:${cls.classId}:sc:${currentSubclassId}:${feat.level}` &&
              f.name === feat.name,
          )
          if (!exists) {
            next.features.push({
              id: crypto.randomUUID(),
              name: feat.name,
              source: cls.name,
              sourceId: `class:${cls.classId}:sc:${currentSubclassId}:${feat.level}`,
              description: feat.description ?? "",
            } satisfies FeatureEntry)
          }
        }
      } else if (cls.level < oldMaxLevel) {
        // Leveled down — prune features beyond current level
        next.features = next.features.filter((f) => {
          if (!f.sourceId?.startsWith(`class:${cls.classId}:sc:${currentSubclassId}:`)) return true
          const parts = f.sourceId.split(":")
          const featLvl = parseInt(parts[parts.length - 1], 10)
          return featLvl <= cls.level
        })
      }
    }
  }

  // Persist current subclass state for next comparison
  next.automationKeys = {
    ...next.automationKeys,
    srdSubclassKey: activeClasses
      .filter((c) => c.classId)
      .map((c) => `${c.classId}|${c.subclassId ?? ""}:${c.level}`)
      .join(","),
  }

  return next
}

export function applyBackground(
  char: CharacterData,
  bgRow: BackgroundRow,
): CharacterData {
  const next = structuredClone(char)
  const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]

  // ── Clear old skill grants ────────────────────────────────────────────────
  const oldSkillGrants = next.srdGrants?.skillProficiencies ?? []
  for (const key of oldSkillGrants) {
    if (next.skills[key]) next.skills[key].state = "None"
  }

  // ── Clear old background ASI modifiers ───────────────────────────────────
  for (const key of ATTR_KEYS) {
    next.attributes[key].stack = next.attributes[key].stack.filter(
      (m) => !m.sourceId?.startsWith("background:"),
    )
  }

  // ── Clear old background feat feature ────────────────────────────────────
  next.features = next.features.filter((f) => !f.sourceId?.startsWith("background:"))

  // ── Apply new skill grants ────────────────────────────────────────────────
  const skillGrants: string[] = bgRow.skillGrants ? JSON.parse(bgRow.skillGrants as string) : []
  for (const key of skillGrants) {
    if (next.skills[key]) next.skills[key].state = "Proficient"
  }

  // ── Apply background ASI choices (2024) ──────────────────────────────────
  const newBgAsis: NonNullable<NonNullable<CharacterData["srdGrants"]>["backgroundAsiBonuses"]> = []
  const bgChoices = (next.backgroundChoices ?? []).filter((c) => c.backgroundId === bgRow.id)
  for (const choice of bgChoices) {
    for (const imp of choice.improvements) {
      if (!next.attributes[imp.attr]) continue
      const sourceId = `background:${bgRow.id}:asi`
      next.attributes[imp.attr].stack.push({
        id: crypto.randomUUID(),
        source: bgRow.name,
        sourceId,
        value: imp.bonus,
        isActive: true,
      })
      newBgAsis.push({ abilityScore: imp.attr, bonus: imp.bonus, sourceId })
    }
  }

  // ── Apply feat grant (2024) ───────────────────────────────────────────────
  if (bgRow.featGrant) {
    next.features.push({
      id: crypto.randomUUID(),
      name: bgRow.featGrant,
      source: bgRow.name,
      sourceId: `background:${bgRow.id}:feat`,
      description: "",
    } satisfies FeatureEntry)
  }

  // ── Prune stale background choices for other backgrounds ─────────────────
  next.backgroundChoices = (next.backgroundChoices ?? []).filter(
    (c) => c.backgroundId === bgRow.id,
  )

  next.srdGrants = {
    saveProficiencies: next.srdGrants?.saveProficiencies ?? [],
    skillProficiencies: skillGrants,
    raceAsiBonuses: next.srdGrants?.raceAsiBonuses ?? [],
    backgroundAsiBonuses: newBgAsis,
  }

  return next
}

function equipCategoryToInventoryCategory(cat: string): InventoryItem["category"] {
  if (cat === "Weapon") return "Weapon"
  if (cat === "Armor") return "Armor"
  const l = cat.toLowerCase()
  if (l.includes("tool")) return "Tool"
  if (l.includes("potion") || l.includes("ammunition")) return "Consumable"
  return "Mundane"
}

export function applyClassStartingEquipment(
  char: CharacterData,
  classes: CharacterClassEntry[],
  allFixedRows: ClassStartingEquipmentRow[],
  oldClassKey?: string,
): CharacterData {
  const next = structuredClone(char)
  
  // Parse session key (previous render state)
  const [oldClassesPart] = (oldClassKey ?? "").split("|")
  const oldClassIds = new Set<string>()
  if (oldClassesPart) {
    oldClassesPart.split(",").forEach(p => {
      const lastColonIdx = p.lastIndexOf(":")
      if (lastColonIdx !== -1) oldClassIds.add(p.slice(0, lastColonIdx))
    })
  }
  
  // IMPORTANT: We do NOT check char.automationKeys here for "addition" logic, 
  // because applyClasses (run right before this) has likely already updated next.automationKeys 
  // with the new levels, which would make the class look "already processed".
  // Instead, we rely strictly on oldClassKey (the state from the PREVIOUS render cycle).

  const activeClasses = classes.filter((c) => c.classId && !c.ignoreAutomation)
  const activeClassIds = new Set(activeClasses.map((c) => c.classId!))

  // 1. Removal: Remove starting equipment for classes no longer active AT ALL
  next.inventory = next.inventory.filter((item) => {
    if (!item.sourceId?.startsWith("class-start:")) return true
    const classId = item.sourceId.slice("class-start:".length)
    return activeClassIds.has(classId)
  })

  // 2. Addition: ONLY for classes that were NOT present in the previous session state
  for (const cls of activeClasses) {
    if (oldClassIds.has(cls.classId!)) continue 

    const fixedRows = allFixedRows.filter((r) => r.classId === cls.classId)
    const sourceId = `class-start:${cls.classId}`
    for (const row of fixedRows) {
      // Safety check: don't add if an item from this class's starting equipment 
      // already exists in the inventory (handles re-hydration edge cases)
      const alreadyPresent = next.inventory.some(
        (item) => item.sourceId === sourceId && item.name === row.itemName
      )
      if (alreadyPresent) continue

      next.inventory.push({
        id: crypto.randomUUID(),
        name: row.itemName,
        quantity: row.quantity,
        weight: row.weight ?? 0,
        category: equipCategoryToInventoryCategory(row.equipmentCategory),
        equipped: false,
        modifiers: [],
        sourceId,
      })
    }
  }

  // Remove equipment choices for classes no longer active
  next.equipmentChoicesMade = (next.equipmentChoicesMade ?? []).filter(
    (m) => activeClassIds.has(m.classId),
  )

  return next
}

export function clearBackgroundAutomation(char: CharacterData): CharacterData {
  const next = structuredClone(char)
  const ATTR_KEYS: AttributeKey[] = ["str", "dex", "con", "int", "wis", "cha"]

  const oldSkillGrants = next.srdGrants?.skillProficiencies ?? []
  for (const key of oldSkillGrants) {
    if (next.skills[key]) next.skills[key].state = "None"
  }

  for (const key of ATTR_KEYS) {
    next.attributes[key].stack = next.attributes[key].stack.filter(
      (m) => !m.sourceId?.startsWith("background:"),
    )
  }

  next.features = next.features.filter((f) => !f.sourceId?.startsWith("background:"))
  next.backgroundChoices = []

  next.srdGrants = {
    saveProficiencies: next.srdGrants?.saveProficiencies ?? [],
    skillProficiencies: [],
    raceAsiBonuses: next.srdGrants?.raceAsiBonuses ?? [],
    backgroundAsiBonuses: [],
  }

  return next
}
