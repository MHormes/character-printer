const SYSTEM = "dnd5e_2024";
const SOURCE = "srd";
const BASE_URL = "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en";
const BASE_URL_2014 = "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson(url) {
  console.log(`  fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function kebabToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeSrdName(name) {
  const idx = name.indexOf(", ");
  return idx === -1 ? name : name.slice(0, idx) + " - " + name.slice(idx + 2);
}

function hitDieStr(n) {
  return `d${n}`;
}

function getSpellSlotProgression(index) {
  if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(index)) return "full";
  if (["paladin", "ranger"].includes(index)) return "half";
  return "none";
}

const VALID_DICE = new Set(["d4", "d6", "d8", "d10", "d12", "d20", "d100"]);

function parseDiceStr(str) {
  if (!str) return null;
  const m = str.match(/^(\d+)(d\d+)/);
  if (!m) return null;
  const die = m[2];
  if (!VALID_DICE.has(die)) return null;
  return { count: parseInt(m[1], 10), die };
}

function mapProfType(index, name) {
  if (index.startsWith("saving-throw-")) return "Saving Throws";
  if (index.startsWith("skill-")) return "Skills";
  if (["light-armor", "medium-armor", "heavy-armor", "shields", "all-armor"].includes(index)) return "Armor";
  if (index.includes("weapon") || index === "simple-weapons" || index === "martial-weapons") return "Weapons";
  if (index.includes("tool") || index.includes("supplies") || index.includes("kit")) return "Tools";
  if (index.includes("language") || index.includes("-language")) return "Languages";
  const n = name.toLowerCase();
  if (n.includes("armor")) return "Armor";
  if (n.includes("weapon")) return "Weapons";
  if (n.includes("tool")) return "Tools";
  return "Other";
}

async function insertRows(client, table, rows, chunkSize = 100) {
  if (!rows.length) return;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const columns = Object.keys(chunk[0]);
    const values = [];
    const rowPlaceholders = chunk.map((row, rowIndex) => {
      const placeholders = columns.map((col, colIndex) => {
        values.push(row[col]);
        return `$${rowIndex * columns.length + colIndex + 1}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    await client.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${rowPlaceholders.join(", ")} ON CONFLICT DO NOTHING`,
      values,
    );
  }
}

// ─── Starting equipment option processing ─────────────────────────────────────

function flattenMultiple2024(items) {
  const fixedItems = [];
  let categoryPick = null;
  for (const item of items) {
    if (item.option_type === "money") continue;
    if (item.option_type === "counted_reference" && item.of) {
      fixedItems.push({ itemId: `${SYSTEM}:${item.of.index}`, name: item.of.name, quantity: item.count ?? 1 });
    } else if (
      item.option_type === "choice" &&
      item.choice?.from?.option_set_type === "equipment_category" &&
      item.choice.from.equipment_category
    ) {
      categoryPick = { category: item.choice.from.equipment_category.name, count: item.choice.choose ?? 1 };
    }
  }
  return { fixedItems, categoryPick };
}

function processEquipOption2024(opt) {
  if (opt.option_type === "money") return null;

  if (opt.option_type === "counted_reference" && opt.of) {
    const name = opt.of.name;
    const qty = opt.count ?? 1;
    return {
      type: "items",
      label: `${qty > 1 ? `${qty}x ` : ""}${name}`,
      items: [{ itemId: `${SYSTEM}:${opt.of.index}`, name, quantity: qty }],
    };
  }

  if (opt.option_type === "multiple" && opt.items) {
    const { fixedItems, categoryPick } = flattenMultiple2024(opt.items);
    if (fixedItems.length === 0 && !categoryPick) return null;
    const parts = [
      ...fixedItems.map((i) => `${i.quantity > 1 ? `${i.quantity}x ` : ""}${i.name}`),
      ...(categoryPick ? [`${categoryPick.count > 1 ? `${categoryPick.count}x ` : ""}Any ${categoryPick.category}`] : []),
    ];
    const label = parts.join(" + ");
    if (categoryPick) return { type: "bundle", label, fixedItems, categoryPick };
    return { type: "items", label, items: fixedItems };
  }

  if (opt.option_type === "choice" && opt.choice?.from) {
    const from = opt.choice.from;
    if (from.option_set_type === "equipment_category" && from.equipment_category) {
      const count = opt.choice.choose ?? 1;
      return {
        type: "category",
        label: `${count > 1 ? `${count}x ` : ""}Any ${from.equipment_category.name}`,
        category: from.equipment_category.name,
        count,
      };
    }
    if (from.option_set_type === "options_array" && from.options) {
      return from.options.map(processEquipOption2024).find(Boolean) ?? null;
    }
  }

  return null;
}

// ─── Hardcoded 2024 class features ────────────────────────────────────────────

const CLASS_FEATURES_2024 = [
  // ── Barbarian ──────────────────────────────────────────────────────────────
  { cls: "barbarian", level: 1,  name: "Rage" },
  { cls: "barbarian", level: 1,  name: "Unarmored Defense" },
  { cls: "barbarian", level: 1,  name: "Weapon Mastery" },
  { cls: "barbarian", level: 2,  name: "Danger Sense" },
  { cls: "barbarian", level: 2,  name: "Reckless Attack" },
  { cls: "barbarian", level: 3,  name: "Barbarian Subclass" },
  { cls: "barbarian", level: 3,  name: "Primal Knowledge" },
  { cls: "barbarian", level: 4,  name: "Ability Score Improvement" },
  { cls: "barbarian", level: 5,  name: "Extra Attack" },
  { cls: "barbarian", level: 5,  name: "Fast Movement" },
  { cls: "barbarian", level: 6,  name: "Subclass Feature" },
  { cls: "barbarian", level: 7,  name: "Feral Instinct" },
  { cls: "barbarian", level: 7,  name: "Instinctive Pounce" },
  { cls: "barbarian", level: 8,  name: "Ability Score Improvement" },
  { cls: "barbarian", level: 9,  name: "Brutal Strike" },
  { cls: "barbarian", level: 10, name: "Subclass Feature" },
  { cls: "barbarian", level: 11, name: "Relentless Rage" },
  { cls: "barbarian", level: 12, name: "Ability Score Improvement" },
  { cls: "barbarian", level: 13, name: "Improved Brutal Strike" },
  { cls: "barbarian", level: 14, name: "Subclass Feature" },
  { cls: "barbarian", level: 15, name: "Persistent Rage" },
  { cls: "barbarian", level: 16, name: "Ability Score Improvement" },
  { cls: "barbarian", level: 17, name: "Improved Brutal Strike" },
  { cls: "barbarian", level: 18, name: "Indomitable Might" },
  { cls: "barbarian", level: 19, name: "Ability Score Improvement" },
  { cls: "barbarian", level: 20, name: "Primal Champion" },
  // ── Bard ───────────────────────────────────────────────────────────────────
  { cls: "bard", level: 1,  name: "Bardic Inspiration" },
  { cls: "bard", level: 1,  name: "Spellcasting" },
  { cls: "bard", level: 2,  name: "Expertise" },
  { cls: "bard", level: 2,  name: "Jack of All Trades" },
  { cls: "bard", level: 3,  name: "Bard Subclass" },
  { cls: "bard", level: 4,  name: "Ability Score Improvement" },
  { cls: "bard", level: 5,  name: "Font of Inspiration" },
  { cls: "bard", level: 6,  name: "Subclass Feature" },
  { cls: "bard", level: 7,  name: "Countercharm" },
  { cls: "bard", level: 8,  name: "Ability Score Improvement" },
  { cls: "bard", level: 9,  name: "Expertise" },
  { cls: "bard", level: 10, name: "Magical Secrets" },
  { cls: "bard", level: 12, name: "Ability Score Improvement" },
  { cls: "bard", level: 14, name: "Subclass Feature" },
  { cls: "bard", level: 16, name: "Ability Score Improvement" },
  { cls: "bard", level: 18, name: "Superior Inspiration" },
  { cls: "bard", level: 19, name: "Ability Score Improvement" },
  { cls: "bard", level: 20, name: "Words of Creation" },
  // ── Cleric ─────────────────────────────────────────────────────────────────
  { cls: "cleric", level: 1,  name: "Divine Order" },
  { cls: "cleric", level: 1,  name: "Spellcasting" },
  { cls: "cleric", level: 2,  name: "Channel Divinity" },
  { cls: "cleric", level: 2,  name: "Cleric Subclass" },
  { cls: "cleric", level: 4,  name: "Ability Score Improvement" },
  { cls: "cleric", level: 5,  name: "Sear Undead" },
  { cls: "cleric", level: 6,  name: "Subclass Feature" },
  { cls: "cleric", level: 8,  name: "Ability Score Improvement" },
  { cls: "cleric", level: 10, name: "Divine Intervention" },
  { cls: "cleric", level: 12, name: "Ability Score Improvement" },
  { cls: "cleric", level: 14, name: "Improved Blessed Strikes" },
  { cls: "cleric", level: 16, name: "Ability Score Improvement" },
  { cls: "cleric", level: 18, name: "Subclass Feature" },
  { cls: "cleric", level: 19, name: "Ability Score Improvement" },
  { cls: "cleric", level: 20, name: "Greater Divine Intervention" },
  // ── Druid ──────────────────────────────────────────────────────────────────
  { cls: "druid", level: 1,  name: "Druidic" },
  { cls: "druid", level: 1,  name: "Primal Order" },
  { cls: "druid", level: 1,  name: "Spellcasting" },
  { cls: "druid", level: 2,  name: "Wild Companion" },
  { cls: "druid", level: 2,  name: "Wild Shape" },
  { cls: "druid", level: 3,  name: "Druid Subclass" },
  { cls: "druid", level: 4,  name: "Ability Score Improvement" },
  { cls: "druid", level: 5,  name: "Wild Resurgence" },
  { cls: "druid", level: 6,  name: "Subclass Feature" },
  { cls: "druid", level: 7,  name: "Elemental Fury" },
  { cls: "druid", level: 8,  name: "Ability Score Improvement" },
  { cls: "druid", level: 10, name: "Subclass Feature" },
  { cls: "druid", level: 12, name: "Ability Score Improvement" },
  { cls: "druid", level: 14, name: "Subclass Feature" },
  { cls: "druid", level: 15, name: "Improved Elemental Fury" },
  { cls: "druid", level: 16, name: "Ability Score Improvement" },
  { cls: "druid", level: 18, name: "Beast Spells" },
  { cls: "druid", level: 19, name: "Ability Score Improvement" },
  { cls: "druid", level: 20, name: "Archdruid" },
  // ── Fighter ────────────────────────────────────────────────────────────────
  { cls: "fighter", level: 1,  name: "Fighting Style" },
  { cls: "fighter", level: 1,  name: "Second Wind" },
  { cls: "fighter", level: 1,  name: "Weapon Mastery" },
  { cls: "fighter", level: 2,  name: "Action Surge" },
  { cls: "fighter", level: 2,  name: "Tactical Mind" },
  { cls: "fighter", level: 3,  name: "Fighter Subclass" },
  { cls: "fighter", level: 4,  name: "Ability Score Improvement" },
  { cls: "fighter", level: 5,  name: "Extra Attack" },
  { cls: "fighter", level: 6,  name: "Ability Score Improvement" },
  { cls: "fighter", level: 7,  name: "Subclass Feature" },
  { cls: "fighter", level: 8,  name: "Ability Score Improvement" },
  { cls: "fighter", level: 9,  name: "Tactical Shift" },
  { cls: "fighter", level: 10, name: "Subclass Feature" },
  { cls: "fighter", level: 11, name: "Two Extra Attacks" },
  { cls: "fighter", level: 12, name: "Ability Score Improvement" },
  { cls: "fighter", level: 13, name: "Studied Attacks" },
  { cls: "fighter", level: 14, name: "Ability Score Improvement" },
  { cls: "fighter", level: 15, name: "Subclass Feature" },
  { cls: "fighter", level: 16, name: "Ability Score Improvement" },
  { cls: "fighter", level: 17, name: "Action Surge (2/rest)" },
  { cls: "fighter", level: 18, name: "Subclass Feature" },
  { cls: "fighter", level: 19, name: "Ability Score Improvement" },
  { cls: "fighter", level: 20, name: "Three Extra Attacks" },
  // ── Monk ───────────────────────────────────────────────────────────────────
  { cls: "monk", level: 1,  name: "Martial Arts" },
  { cls: "monk", level: 1,  name: "Unarmored Defense" },
  { cls: "monk", level: 2,  name: "Monk's Focus" },
  { cls: "monk", level: 2,  name: "Unarmored Movement" },
  { cls: "monk", level: 2,  name: "Uncanny Metabolism" },
  { cls: "monk", level: 3,  name: "Deflect Attacks" },
  { cls: "monk", level: 3,  name: "Monk Subclass" },
  { cls: "monk", level: 4,  name: "Ability Score Improvement" },
  { cls: "monk", level: 4,  name: "Slow Fall" },
  { cls: "monk", level: 5,  name: "Extra Attack" },
  { cls: "monk", level: 5,  name: "Stunning Strike" },
  { cls: "monk", level: 6,  name: "Empowered Strikes" },
  { cls: "monk", level: 6,  name: "Subclass Feature" },
  { cls: "monk", level: 7,  name: "Evasion" },
  { cls: "monk", level: 8,  name: "Ability Score Improvement" },
  { cls: "monk", level: 9,  name: "Acrobatic Movement" },
  { cls: "monk", level: 10, name: "Heightened Focus" },
  { cls: "monk", level: 10, name: "Self-Restoration" },
  { cls: "monk", level: 11, name: "Subclass Feature" },
  { cls: "monk", level: 12, name: "Ability Score Improvement" },
  { cls: "monk", level: 13, name: "Deflect Energy" },
  { cls: "monk", level: 14, name: "Disciplined Survivor" },
  { cls: "monk", level: 15, name: "Perfect Focus" },
  { cls: "monk", level: 16, name: "Ability Score Improvement" },
  { cls: "monk", level: 17, name: "Subclass Feature" },
  { cls: "monk", level: 18, name: "Superior Defense" },
  { cls: "monk", level: 19, name: "Ability Score Improvement" },
  { cls: "monk", level: 20, name: "Body and Mind" },
  // ── Paladin ────────────────────────────────────────────────────────────────
  { cls: "paladin", level: 1,  name: "Divine Smite" },
  { cls: "paladin", level: 1,  name: "Lay On Hands" },
  { cls: "paladin", level: 1,  name: "Spellcasting" },
  { cls: "paladin", level: 1,  name: "Weapon Mastery" },
  { cls: "paladin", level: 2,  name: "Fighting Style" },
  { cls: "paladin", level: 2,  name: "Paladin's Smite" },
  { cls: "paladin", level: 3,  name: "Channel Divinity" },
  { cls: "paladin", level: 3,  name: "Paladin Subclass" },
  { cls: "paladin", level: 4,  name: "Ability Score Improvement" },
  { cls: "paladin", level: 5,  name: "Extra Attack" },
  { cls: "paladin", level: 5,  name: "Faithful Steed" },
  { cls: "paladin", level: 6,  name: "Aura of Protection" },
  { cls: "paladin", level: 7,  name: "Subclass Feature" },
  { cls: "paladin", level: 8,  name: "Ability Score Improvement" },
  { cls: "paladin", level: 9,  name: "Abjure Foes" },
  { cls: "paladin", level: 10, name: "Aura of Courage" },
  { cls: "paladin", level: 11, name: "Radiant Strikes" },
  { cls: "paladin", level: 12, name: "Ability Score Improvement" },
  { cls: "paladin", level: 14, name: "Restoring Touch" },
  { cls: "paladin", level: 15, name: "Subclass Feature" },
  { cls: "paladin", level: 16, name: "Ability Score Improvement" },
  { cls: "paladin", level: 18, name: "Aura Expansion" },
  { cls: "paladin", level: 19, name: "Ability Score Improvement" },
  { cls: "paladin", level: 20, name: "Subclass Feature" },
  // ── Ranger ─────────────────────────────────────────────────────────────────
  { cls: "ranger", level: 1,  name: "Expertise" },
  { cls: "ranger", level: 1,  name: "Favored Enemy" },
  { cls: "ranger", level: 1,  name: "Spellcasting" },
  { cls: "ranger", level: 1,  name: "Weapon Mastery" },
  { cls: "ranger", level: 2,  name: "Deft Explorer" },
  { cls: "ranger", level: 2,  name: "Fighting Style" },
  { cls: "ranger", level: 3,  name: "Ranger Subclass" },
  { cls: "ranger", level: 4,  name: "Ability Score Improvement" },
  { cls: "ranger", level: 5,  name: "Extra Attack" },
  { cls: "ranger", level: 6,  name: "Roving" },
  { cls: "ranger", level: 7,  name: "Subclass Feature" },
  { cls: "ranger", level: 8,  name: "Ability Score Improvement" },
  { cls: "ranger", level: 9,  name: "Expertise" },
  { cls: "ranger", level: 10, name: "Tireless" },
  { cls: "ranger", level: 11, name: "Subclass Feature" },
  { cls: "ranger", level: 12, name: "Ability Score Improvement" },
  { cls: "ranger", level: 13, name: "Relentless Hunter" },
  { cls: "ranger", level: 14, name: "Nature's Veil" },
  { cls: "ranger", level: 15, name: "Subclass Feature" },
  { cls: "ranger", level: 16, name: "Ability Score Improvement" },
  { cls: "ranger", level: 17, name: "Precise Hunter" },
  { cls: "ranger", level: 18, name: "Feral Senses" },
  { cls: "ranger", level: 19, name: "Ability Score Improvement" },
  { cls: "ranger", level: 20, name: "Foe Slayer" },
  // ── Rogue ──────────────────────────────────────────────────────────────────
  { cls: "rogue", level: 1,  name: "Expertise" },
  { cls: "rogue", level: 1,  name: "Sneak Attack" },
  { cls: "rogue", level: 1,  name: "Thieves' Cant" },
  { cls: "rogue", level: 1,  name: "Weapon Mastery" },
  { cls: "rogue", level: 2,  name: "Cunning Action" },
  { cls: "rogue", level: 3,  name: "Rogue Subclass" },
  { cls: "rogue", level: 3,  name: "Steady Aim" },
  { cls: "rogue", level: 4,  name: "Ability Score Improvement" },
  { cls: "rogue", level: 5,  name: "Cunning Strike" },
  { cls: "rogue", level: 5,  name: "Uncanny Dodge" },
  { cls: "rogue", level: 6,  name: "Expertise" },
  { cls: "rogue", level: 7,  name: "Evasion" },
  { cls: "rogue", level: 7,  name: "Subclass Feature" },
  { cls: "rogue", level: 8,  name: "Ability Score Improvement" },
  { cls: "rogue", level: 9,  name: "Improved Cunning Strike" },
  { cls: "rogue", level: 10, name: "Ability Score Improvement" },
  { cls: "rogue", level: 11, name: "Reliable Talent" },
  { cls: "rogue", level: 11, name: "Subclass Feature" },
  { cls: "rogue", level: 12, name: "Ability Score Improvement" },
  { cls: "rogue", level: 13, name: "Subtle Strikes" },
  { cls: "rogue", level: 14, name: "Devious Strikes" },
  { cls: "rogue", level: 14, name: "Subclass Feature" },
  { cls: "rogue", level: 15, name: "Slippery Mind" },
  { cls: "rogue", level: 16, name: "Ability Score Improvement" },
  { cls: "rogue", level: 17, name: "Elusive" },
  { cls: "rogue", level: 18, name: "Subclass Feature" },
  { cls: "rogue", level: 19, name: "Ability Score Improvement" },
  { cls: "rogue", level: 20, name: "Stroke of Luck" },
  // ── Sorcerer ───────────────────────────────────────────────────────────────
  { cls: "sorcerer", level: 1,  name: "Innate Sorcery" },
  { cls: "sorcerer", level: 1,  name: "Spellcasting" },
  { cls: "sorcerer", level: 2,  name: "Font of Magic" },
  { cls: "sorcerer", level: 2,  name: "Sorcerer Subclass" },
  { cls: "sorcerer", level: 3,  name: "Metamagic" },
  { cls: "sorcerer", level: 4,  name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 5,  name: "Sorcerous Restoration" },
  { cls: "sorcerer", level: 6,  name: "Subclass Feature" },
  { cls: "sorcerer", level: 7,  name: "Sorcery Incarnate" },
  { cls: "sorcerer", level: 8,  name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 10, name: "Metamagic (3 options)" },
  { cls: "sorcerer", level: 10, name: "Subclass Feature" },
  { cls: "sorcerer", level: 12, name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 14, name: "Subclass Feature" },
  { cls: "sorcerer", level: 16, name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 17, name: "Metamagic (4 options)" },
  { cls: "sorcerer", level: 18, name: "Subclass Feature" },
  { cls: "sorcerer", level: 19, name: "Ability Score Improvement" },
  { cls: "sorcerer", level: 20, name: "Arcane Apotheosis" },
  // ── Warlock ────────────────────────────────────────────────────────────────
  { cls: "warlock", level: 1,  name: "Eldritch Invocations" },
  { cls: "warlock", level: 1,  name: "Pact Magic" },
  { cls: "warlock", level: 2,  name: "Magical Cunning" },
  { cls: "warlock", level: 3,  name: "Warlock Subclass" },
  { cls: "warlock", level: 4,  name: "Ability Score Improvement" },
  { cls: "warlock", level: 5,  name: "Contact Patron" },
  { cls: "warlock", level: 6,  name: "Subclass Feature" },
  { cls: "warlock", level: 8,  name: "Ability Score Improvement" },
  { cls: "warlock", level: 11, name: "Mystic Arcanum (6th level)" },
  { cls: "warlock", level: 12, name: "Ability Score Improvement" },
  { cls: "warlock", level: 13, name: "Mystic Arcanum (7th level)" },
  { cls: "warlock", level: 15, name: "Mystic Arcanum (8th level)" },
  { cls: "warlock", level: 15, name: "Subclass Feature" },
  { cls: "warlock", level: 16, name: "Ability Score Improvement" },
  { cls: "warlock", level: 17, name: "Mystic Arcanum (9th level)" },
  { cls: "warlock", level: 19, name: "Ability Score Improvement" },
  { cls: "warlock", level: 20, name: "Eldritch Master" },
  // ── Wizard ─────────────────────────────────────────────────────────────────
  { cls: "wizard", level: 1,  name: "Arcane Recovery" },
  { cls: "wizard", level: 1,  name: "Spellcasting" },
  { cls: "wizard", level: 2,  name: "Scholar" },
  { cls: "wizard", level: 2,  name: "Wizard Subclass" },
  { cls: "wizard", level: 4,  name: "Ability Score Improvement" },
  { cls: "wizard", level: 5,  name: "Memorize Spell" },
  { cls: "wizard", level: 6,  name: "Subclass Feature" },
  { cls: "wizard", level: 8,  name: "Ability Score Improvement" },
  { cls: "wizard", level: 10, name: "Subclass Feature" },
  { cls: "wizard", level: 12, name: "Ability Score Improvement" },
  { cls: "wizard", level: 14, name: "Subclass Feature" },
  { cls: "wizard", level: 16, name: "Ability Score Improvement" },
  { cls: "wizard", level: 18, name: "Spell Mastery" },
  { cls: "wizard", level: 18, name: "Subclass Feature" },
  { cls: "wizard", level: 19, name: "Ability Score Improvement" },
  { cls: "wizard", level: 20, name: "Signature Spells" },
];

// ─── Hardcoded 2024 spell slot progressions ───────────────────────────────────

const FULL_CASTER_SLOTS = [
  [2,0,0,0,0,0,0,0,0], [3,0,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0], [4,3,2,0,0,0,0,0,0], [4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0], [4,3,3,2,0,0,0,0,0], [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0], [4,3,3,3,2,1,0,0,0], [4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0], [4,3,3,3,2,1,1,0,0], [4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,0], [4,3,3,3,2,1,1,1,1], [4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1], [4,3,3,3,3,2,2,1,1],
];

// 2024 half casters get spell slots starting at level 1
const HALF_CASTER_SLOTS = [
  [2,0,0,0,0,0,0,0,0], [2,0,0,0,0,0,0,0,0], [3,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0], [4,3,0,0,0,0,0,0,0], [4,3,2,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0], [4,3,3,0,0,0,0,0,0], [4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0], [4,3,3,1,0,0,0,0,0], [4,3,3,2,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0], [4,3,3,3,1,0,0,0,0], [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0], [4,3,3,3,2,0,0,0,0],
];

const FULL_CASTER_CLASSES = ["bard", "cleric", "druid", "sorcerer", "wizard"];
const HALF_CASTER_CLASSES = ["paladin", "ranger"];

// ─── Delete existing 2024 rows (FK-safe order) ────────────────────────────────

async function deleteSrd2024Rows(client) {
  await client.query(
    "DELETE FROM class_spell_slots USING classes WHERE class_spell_slots.class_id = classes.id AND classes.system = $1",
    [SYSTEM],
  );

  const tables = [
    "class_starting_equipment_options",
    "class_starting_equipment",
    "feats",
    "subclasses",
    "languages",
    "class_skill_choices",
    "class_proficiencies",
    "race_traits",
    "class_features",
    "backgrounds",
    "subraces",
    "races",
    "classes",
    "spells",
    "items",
  ];

  for (const table of tables) {
    await client.query(`DELETE FROM ${table} WHERE system = $1`, [SYSTEM]);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function seedSrd2024Postgres(client) {
  console.log("Fetching D&D 2024 SRD data...");
  const [
    rawBackgrounds,
    rawSpecies,
    rawSubspecies,
    rawTraits,
    rawClasses,
    rawFeats,
    rawEquipment,
    rawMagicItems,
    rawLanguages,
    rawSubclasses,
    raw2014Features,
  ] = await Promise.all([
    fetchJson(`${BASE_URL}/5e-SRD-Backgrounds.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Species.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Subspecies.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Traits.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Classes.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Feats.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Equipment.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Magic-Items.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Languages.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Subclasses.json`),
    fetchJson(`${BASE_URL_2014}/5e-SRD-Features.json`),
  ]);

  // Name→description fallback from 2014 SRD (no 2024 features file exists)
  const featureDescByName = new Map();
  for (const f of raw2014Features) {
    const key = f.name.toLowerCase();
    if (!featureDescByName.has(key) && f.desc?.length) {
      featureDescByName.set(key, f.desc.join("\n\n"));
    }
  }

  console.log(
    `  ${rawBackgrounds.length} backgrounds | ${rawSpecies.length} species | ${rawSubspecies.length} subspecies | ` +
    `${rawTraits.length} traits | ${rawClasses.length} classes | ${rawFeats.length} feats | ` +
    `${rawEquipment.length} equipment | ${rawMagicItems.length} magic items | ` +
    `${rawLanguages.length} languages | ${rawSubclasses.length} subclasses`,
  );

  await client.query("BEGIN");
  try {
    console.log("Clearing existing 2024 SRD data...");
    await deleteSrd2024Rows(client);

    // ── Backgrounds ────────────────────────────────────────────────────────────
    console.log("Inserting 2024 backgrounds...");
    const bgRows = rawBackgrounds.map((bg) => {
      const skillGrants = bg.proficiencies
        .filter((p) => p.index.startsWith("skill-"))
        .map((p) => kebabToCamel(p.index.replace(/^skill-/, "")));
      const asiPool = bg.ability_scores.map((a) => a.index);
      const feat = bg.feat;
      const featGrant = feat ? (feat.note ? `${feat.name} (${feat.note})` : feat.name) : null;
      return {
        id: `${SYSTEM}:${bg.index}`,
        system: SYSTEM,
        name: bg.name,
        skill_grants: JSON.stringify(skillGrants),
        asi_grants: JSON.stringify(asiPool),
        feat_grant: featGrant,
        source: SOURCE,
        user_id: null,
      };
    });
    await insertRows(client, "backgrounds", bgRows);
    console.log(`  ${bgRows.length} backgrounds`);

    // ── Species (mapped to races table) ───────────────────────────────────────
    console.log("Inserting 2024 species...");
    const speciesRows = rawSpecies.map((s) => ({
      id: `${SYSTEM}:${s.index}`,
      system: SYSTEM,
      name: s.name,
      speed: s.speed ?? null,
      source: SOURCE,
      user_id: null,
    }));
    await insertRows(client, "races", speciesRows);

    // ── Subspecies (mapped to subraces table) ─────────────────────────────────
    console.log("Inserting 2024 subspecies...");
    const speciesIdByIndex = new Map(rawSpecies.map((s) => [s.index, `${SYSTEM}:${s.index}`]));
    const subspeciesRows = rawSubspecies
      .filter((s) => speciesIdByIndex.has(s.species.index))
      .map((s) => ({
        id: `${SYSTEM}:${s.index}`,
        system: SYSTEM,
        race_id: speciesIdByIndex.get(s.species.index),
        name: s.name,
        source: SOURCE,
        user_id: null,
      }));
    await insertRows(client, "subraces", subspeciesRows);
    console.log(`  ${speciesRows.length} species | ${subspeciesRows.length} subspecies`);

    // ── Traits ────────────────────────────────────────────────────────────────
    console.log("Inserting 2024 species traits...");
    const subspeciesIdByIndex = new Map(rawSubspecies.map((s) => [s.index, `${SYSTEM}:${s.index}`]));
    const traitRows = [];
    for (const t of rawTraits) {
      const desc = t.description ?? "";
      for (const sp of (t.species ?? [])) {
        const rid = speciesIdByIndex.get(sp.index);
        if (!rid) continue;
        traitRows.push({
          id: `${SYSTEM}:trait:${t.index}:${sp.index}`,
          system: SYSTEM,
          race_id: rid,
          subrace_id: null,
          name: t.name,
          description: desc,
          source: SOURCE,
        });
      }
      for (const ss of (t.subspecies ?? [])) {
        const sid = subspeciesIdByIndex.get(ss.index);
        if (!sid) continue;
        traitRows.push({
          id: `${SYSTEM}:trait:${t.index}:${ss.index}`,
          system: SYSTEM,
          race_id: null,
          subrace_id: sid,
          name: t.name,
          description: desc,
          source: SOURCE,
        });
      }
    }
    // Also handle traits referenced directly on subspecies objects
    for (const ss of rawSubspecies) {
      const sid = subspeciesIdByIndex.get(ss.index);
      if (!sid) continue;
      for (const t of ss.traits ?? []) {
        const alreadyAdded = traitRows.some((r) => r.subrace_id === sid && r.name === t.name);
        if (!alreadyAdded) {
          traitRows.push({
            id: `${SYSTEM}:trait:${t.index}:${ss.index}`,
            system: SYSTEM,
            race_id: null,
            subrace_id: sid,
            name: t.name,
            description: "",
            source: SOURCE,
          });
        }
      }
    }
    await insertRows(client, "race_traits", traitRows);
    console.log(`  ${traitRows.length} trait entries`);

    // ── Classes ───────────────────────────────────────────────────────────────
    console.log("Inserting 2024 classes...");
    const classRows = rawClasses.map((c) => ({
      id: `${SYSTEM}:${c.index}`,
      system: SYSTEM,
      name: c.name,
      hit_die: hitDieStr(c.hit_die),
      spellcasting_stat: c.spellcasting?.spellcasting_ability?.index ?? null,
      spell_slot_progression: getSpellSlotProgression(c.index),
      source: SOURCE,
      user_id: null,
    }));
    await insertRows(client, "classes", classRows);
    const classIdByIndex = new Map(rawClasses.map((c) => [c.index, `${SYSTEM}:${c.index}`]));
    console.log(`  ${classRows.length} classes`);

    // ── Class features (hardcoded) ─────────────────────────────────────────────
    console.log("Inserting 2024 class features (hardcoded)...");
    const classFeatureRows = CLASS_FEATURES_2024
      .filter((f) => classIdByIndex.has(f.cls))
      .map((f) => ({
        id: `${SYSTEM}:feature:${f.cls}:${f.level}:${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        system: SYSTEM,
        class_id: classIdByIndex.get(f.cls),
        subclass_id: null,
        level: f.level,
        name: f.name,
        description: f.desc ?? featureDescByName.get(f.name.toLowerCase()) ?? "",
        source: SOURCE,
        user_id: null,
      }));
    await insertRows(client, "class_features", classFeatureRows);
    console.log(`  ${classFeatureRows.length} class features`);

    // ── Spell slots (hardcoded) ────────────────────────────────────────────────
    console.log("Inserting 2024 class spell slots (hardcoded)...");
    const spellSlotRows = [];
    for (const index of FULL_CASTER_CLASSES) {
      const cid = classIdByIndex.get(index);
      if (!cid) continue;
      FULL_CASTER_SLOTS.forEach((slots, i) => {
        spellSlotRows.push({ class_id: cid, level: i + 1, slot_1: slots[0], slot_2: slots[1], slot_3: slots[2], slot_4: slots[3], slot_5: slots[4], slot_6: slots[5], slot_7: slots[6], slot_8: slots[7], slot_9: slots[8] });
      });
    }
    for (const index of HALF_CASTER_CLASSES) {
      const cid = classIdByIndex.get(index);
      if (!cid) continue;
      HALF_CASTER_SLOTS.forEach((slots, i) => {
        spellSlotRows.push({ class_id: cid, level: i + 1, slot_1: slots[0], slot_2: slots[1], slot_3: slots[2], slot_4: slots[3], slot_5: slots[4], slot_6: slots[5], slot_7: slots[6], slot_8: slots[7], slot_9: slots[8] });
      });
    }
    await insertRows(client, "class_spell_slots", spellSlotRows);
    console.log(`  ${spellSlotRows.length} spell slot rows`);

    // ── Class proficiencies ────────────────────────────────────────────────────
    console.log("Inserting 2024 class proficiencies...");
    const classProfRows = [];
    for (const cls of rawClasses) {
      const cid = classIdByIndex.get(cls.index);
      if (!cid) continue;
      for (const prof of cls.proficiencies ?? []) {
        classProfRows.push({
          id: `${SYSTEM}:prof:${cls.index}:${prof.index}`,
          system: SYSTEM,
          class_id: cid,
          name: prof.name,
          prof_type: mapProfType(prof.index, prof.name),
          source: SOURCE,
        });
      }
    }
    await insertRows(client, "class_proficiencies", classProfRows);
    console.log(`  ${classProfRows.length} class proficiencies`);

    // ── Class skill choices ────────────────────────────────────────────────────
    console.log("Inserting 2024 class skill choices...");
    const classSkillRows = [];
    for (const cls of rawClasses) {
      const cid = classIdByIndex.get(cls.index);
      if (!cid) continue;
      const skillGroup = cls.proficiency_choices?.find(
        (g) => g.from?.options?.some((o) => o.item?.index?.startsWith("skill-")),
      );
      if (!skillGroup) continue;
      for (const opt of skillGroup.from.options) {
        if (!opt.item?.index?.startsWith("skill-")) continue;
        const rawKey = opt.item.index.replace(/^skill-/, "");
        classSkillRows.push({
          id: `${SYSTEM}:${cls.index}:skill-choice:${rawKey}`,
          system: SYSTEM,
          class_id: cid,
          skill_key: kebabToCamel(rawKey),
          choose_count: skillGroup.choose,
        });
      }
    }
    await insertRows(client, "class_skill_choices", classSkillRows);
    console.log(`  ${classSkillRows.length} class skill choices`);

    // ── Starting equipment options ─────────────────────────────────────────────
    console.log("Inserting 2024 class starting equipment options...");
    const equipOptionRows = [];
    for (const cls of rawClasses) {
      const cid = `${SYSTEM}:${cls.index}`;
      for (let gIdx = 0; gIdx < (cls.starting_equipment_options ?? []).length; gIdx++) {
        const group = cls.starting_equipment_options[gIdx];
        if (group.from?.option_set_type !== "options_array") continue;
        const alternatives = (group.from.options ?? []).map(processEquipOption2024).filter(Boolean);
        if (!alternatives.length) continue;
        equipOptionRows.push({
          id: `${SYSTEM}:${cls.index}:opt:${gIdx}`,
          system: SYSTEM,
          class_id: cid,
          choice_index: gIdx,
          description: group.desc,
          choose_count: group.choose ?? 1,
          options_json: JSON.stringify(alternatives),
        });
      }
    }
    await insertRows(client, "class_starting_equipment_options", equipOptionRows);
    console.log(`  ${equipOptionRows.length} equipment choice groups`);

    // ── Equipment ─────────────────────────────────────────────────────────────
    console.log("Inserting 2024 equipment...");
    const itemRows = rawEquipment.map((e) => {
      const damage = parseDiceStr(e.damage?.damage_dice);
      const twoHandedDamage = parseDiceStr(e.two_handed_damage?.damage_dice);
      return {
        id: `${SYSTEM}:${e.index}`,
        system: SYSTEM,
        name: normalizeSrdName(e.name),
        equipment_category: e.equipment_category?.name ?? "Adventuring Gear",
        description: e.desc?.length ? e.desc.join("\n\n") : null,
        weight: e.weight ?? null,
        cost: e.cost ? `${e.cost.quantity} ${e.cost.unit}` : null,
        weapon_category: e.weapon_category?.split(" ")[0] ?? null,
        weapon_range: e.weapon_range ?? null,
        damage_dice_count: damage?.count ?? null,
        damage_die_type: damage?.die ?? null,
        damage_type: e.damage?.damage_type?.name ?? null,
        two_handed_dice_count: twoHandedDamage?.count ?? null,
        two_handed_die_type: twoHandedDamage?.die ?? null,
        two_handed_damage_type: e.two_handed_damage?.damage_type?.name ?? null,
        properties: e.properties?.length ? JSON.stringify(e.properties.map((p) => p.name)) : null,
        range_normal: e.range?.normal ?? null,
        range_long: e.range?.long ?? null,
        armor_category: e.armor_category ?? null,
        ac_base: e.armor_class?.base ?? null,
        ac_dex_bonus: e.armor_class?.dex_bonus ?? null,
        ac_max_dex: e.armor_class?.max_bonus ?? null,
        stealth_disadvantage: e.stealth_disadvantage ?? null,
        str_minimum: e.str_minimum ?? null,
        source: SOURCE,
        user_id: null,
      };
    });
    await insertRows(client, "items", itemRows);

    const MAGIC_ITEM_MODIFIERS = {
      "belt-of-giant-strength-hill":  JSON.stringify([{ target: "attr.str", value: 21, type: "Set To" }]),
      "belt-of-giant-strength-stone": JSON.stringify([{ target: "attr.str", value: 23, type: "Set To" }]),
      "belt-of-giant-strength-frost": JSON.stringify([{ target: "attr.str", value: 23, type: "Set To" }]),
      "belt-of-giant-strength-fire":  JSON.stringify([{ target: "attr.str", value: 25, type: "Set To" }]),
      "belt-of-giant-strength-cloud": JSON.stringify([{ target: "attr.str", value: 27, type: "Set To" }]),
      "belt-of-giant-strength-storm": JSON.stringify([{ target: "attr.str", value: 29, type: "Set To" }]),
      "amulet-of-health":             JSON.stringify([{ target: "attr.con", value: 19, type: "Set To" }]),
      "gauntlets-of-ogre-power":      JSON.stringify([{ target: "attr.str", value: 19, type: "Set To" }]),
      "headband-of-intellect":        JSON.stringify([{ target: "attr.int", value: 19, type: "Set To" }]),
    };

    const magicItemRows = rawMagicItems.map((m) => ({
      id: `${SYSTEM}:magic:${m.index}`,
      system: SYSTEM,
      name: m.name,
      equipment_category: m.equipment_category.name,
      description: Array.isArray(m.desc) ? m.desc.join("\n\n") : (m.desc ?? null),
      weight: null, cost: null, weapon_category: null, weapon_range: null,
      damage_dice_count: null, damage_die_type: null, damage_type: null,
      two_handed_dice_count: null, two_handed_die_type: null, two_handed_damage_type: null,
      properties: null, range_normal: null, range_long: null,
      armor_category: null, ac_base: null, ac_dex_bonus: null, ac_max_dex: null,
      stealth_disadvantage: null, str_minimum: null,
      modifiers_json: MAGIC_ITEM_MODIFIERS[m.index] ?? null,
      source: SOURCE, user_id: null,
    }));
    await insertRows(client, "items", magicItemRows);
    console.log(`  ${itemRows.length} equipment | ${magicItemRows.length} magic items`);

    // ── Languages ─────────────────────────────────────────────────────────────
    console.log("Inserting 2024 languages...");
    const langRows = rawLanguages.map((l) => ({
      id: `${SYSTEM}:${l.index}`,
      system: SYSTEM,
      name: l.name,
      source: SOURCE,
    }));
    await insertRows(client, "languages", langRows);
    console.log(`  ${langRows.length} languages`);

    // ── Subclasses ────────────────────────────────────────────────────────────
    console.log("Inserting 2024 subclasses...");
    const subclassRows = rawSubclasses
      .filter((s) => classIdByIndex.has(s.class.index))
      .map((s) => ({
        id: `${SYSTEM}:${s.index}`,
        system: SYSTEM,
        class_id: classIdByIndex.get(s.class.index),
        name: s.name,
        subclass_flavor: s.subclass_flavor ?? null,
        description: Array.isArray(s.desc) ? s.desc.join("\n\n") : (s.desc ?? ""),
        source: SOURCE,
        user_id: null,
      }));
    await insertRows(client, "subclasses", subclassRows);
    console.log(`  ${subclassRows.length} subclasses`);

    // ── Feats ─────────────────────────────────────────────────────────────────
    console.log("Inserting 2024 feats...");
    const featRows = rawFeats.map((f) => ({
      id: `${SYSTEM}:${f.index}`,
      system: SYSTEM,
      name: f.name,
      description: Array.isArray(f.desc)
        ? f.desc.join("\n\n")
        : (f.description ?? f.desc ?? ""),
      source: SOURCE,
      user_id: null,
    }));
    await insertRows(client, "feats", featRows);
    console.log(`  ${featRows.length} feats`);

    console.log(
      `2024 SRD seed complete. ${bgRows.length} backgrounds | ${speciesRows.length} species | ` +
      `${subspeciesRows.length} subspecies | ${traitRows.length} traits | ${classRows.length} classes | ` +
      `${classFeatureRows.length} class features | ${spellSlotRows.length} slot rows | ` +
      `${classProfRows.length} class profs | ${classSkillRows.length} skill choices | ` +
      `${equipOptionRows.length} equip choice groups | ${itemRows.length + magicItemRows.length} items | ` +
      `${langRows.length} languages | ${subclassRows.length} subclasses | ${featRows.length} feats`,
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}
