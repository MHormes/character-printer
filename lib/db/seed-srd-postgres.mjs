const SYSTEM = "dnd5e";
const SOURCE = "srd";
const BASE_URL =
  "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en";

const PHB_BACKGROUNDS = [
  {
    index: "acolyte", name: "Acolyte", skills: ["insight", "religion"],
    features: [
      { name: "Languages", description: "You can speak, read, and write 2 additional languages of your choice." },
    ],
    fixedEquipment: [
      { name: "Holy symbol", quantity: 1 },
      { name: "Prayer book", quantity: 1 },
      { name: "Stick of incense", quantity: 5 },
      { name: "Vestments", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "charlatan", name: "Charlatan", skills: ["deception", "sleightOfHand"],
    features: [
      { name: "Tool Proficiencies", description: "Disguise kit, Forgery kit." },
      { name: "Equipment — Tools of the Con", description: "Add one of the following to your inventory: ten stoppered bottles of colored liquid, a set of weighted dice, a deck of marked cards, or a signet ring of an imaginary duke." },
    ],
    fixedEquipment: [
      { name: "Fine clothes", quantity: 1 },
      { name: "Disguise kit", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "criminal", name: "Criminal", skills: ["deception", "stealth"],
    features: [
      { name: "Tool Proficiencies", description: "One type of gaming set, Thieves' tools." },
      { name: "Equipment — Gaming Set", description: "Add one gaming set of your choice (e.g. dice set, playing card set) to your inventory." },
    ],
    fixedEquipment: [
      { name: "Crowbar", quantity: 1 },
      { name: "Dark common clothes with hood", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "entertainer", name: "Entertainer", skills: ["acrobatics", "performance"],
    features: [
      { name: "Tool Proficiencies", description: "Disguise kit, one type of musical instrument." },
      { name: "Equipment — Musical Instrument", description: "Add one musical instrument of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Admirer's token", quantity: 1 },
      { name: "Costume clothes", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "folk-hero", name: "Folk Hero", skills: ["animalHandling", "survival"],
    features: [
      { name: "Tool Proficiencies", description: "One type of artisan's tools, Vehicles (land)." },
      { name: "Equipment — Artisan's Tools", description: "Add one set of artisan's tools of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Shovel", quantity: 1 },
      { name: "Iron pot", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "guild-artisan", name: "Guild Artisan", skills: ["insight", "persuasion"],
    features: [
      { name: "Tool Proficiencies", description: "One type of artisan's tools." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
      { name: "Equipment — Artisan's Tools", description: "Add one set of artisan's tools of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Letter of introduction from guild", quantity: 1 },
      { name: "Traveler's clothes", quantity: 1 },
      { name: "Belt pouch (15 gp)", quantity: 1 },
    ],
  },
  {
    index: "hermit", name: "Hermit", skills: ["medicine", "religion"],
    features: [
      { name: "Tool Proficiencies", description: "Herbalism kit." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
    ],
    fixedEquipment: [
      { name: "Scroll case with notes", quantity: 1 },
      { name: "Winter blanket", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Herbalism kit", quantity: 1 },
      { name: "Belt pouch (5 gp)", quantity: 1 },
    ],
  },
  {
    index: "noble", name: "Noble", skills: ["history", "persuasion"],
    features: [
      { name: "Tool Proficiencies", description: "One type of gaming set." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
      { name: "Equipment — Gaming Set", description: "Add one gaming set of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Fine clothes", quantity: 1 },
      { name: "Signet ring", quantity: 1 },
      { name: "Scroll of pedigree", quantity: 1 },
      { name: "Belt pouch (25 gp)", quantity: 1 },
    ],
  },
  {
    index: "outlander", name: "Outlander", skills: ["athletics", "survival"],
    features: [
      { name: "Tool Proficiencies", description: "One type of musical instrument." },
      { name: "Languages", description: "You can speak, read, and write 1 additional language of your choice." },
      { name: "Equipment — Musical Instrument", description: "Add one musical instrument of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Staff", quantity: 1 },
      { name: "Hunting trap", quantity: 1 },
      { name: "Trophy from an animal you killed", quantity: 1 },
      { name: "Traveler's clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "sage", name: "Sage", skills: ["arcana", "history"],
    features: [
      { name: "Languages", description: "You can speak, read, and write 2 additional languages of your choice." },
    ],
    fixedEquipment: [
      { name: "Bottle of black ink", quantity: 1 },
      { name: "Quill", quantity: 1 },
      { name: "Small knife", quantity: 1 },
      { name: "Letter from dead colleague", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "sailor", name: "Sailor", skills: ["athletics", "perception"],
    features: [
      { name: "Tool Proficiencies", description: "Navigator's tools, Vehicles (water)." },
    ],
    fixedEquipment: [
      { name: "Belaying pin (club)", quantity: 1 },
      { name: "Silk rope (50 feet)", quantity: 1 },
      { name: "Lucky charm", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "soldier", name: "Soldier", skills: ["athletics", "intimidation"],
    features: [
      { name: "Tool Proficiencies", description: "One type of gaming set, Vehicles (land)." },
      { name: "Equipment — Gaming Set", description: "Add one gaming set of your choice to your inventory." },
    ],
    fixedEquipment: [
      { name: "Insignia of rank", quantity: 1 },
      { name: "Trophy from fallen enemy", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
  {
    index: "urchin", name: "Urchin", skills: ["sleightOfHand", "stealth"],
    features: [
      { name: "Tool Proficiencies", description: "Disguise kit, Thieves' tools." },
    ],
    fixedEquipment: [
      { name: "Small knife", quantity: 1 },
      { name: "Map of the city you grew up in", quantity: 1 },
      { name: "Pet mouse", quantity: 1 },
      { name: "Token of remembrance from parents", quantity: 1 },
      { name: "Common clothes", quantity: 1 },
      { name: "Belt pouch (10 gp)", quantity: 1 },
    ],
  },
];

const VALID_DICE = new Set(["d4", "d6", "d8", "d10", "d12", "d20", "d100"]);

async function fetchJson(url) {
  console.log(`  fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function kebabToCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function classId(index) {
  return `${SYSTEM}:${index}`;
}

function spellId(index) {
  return `${SYSTEM}:${index}`;
}

function hitDieStr(value) {
  return `d${value}`;
}

function getSpellSlotProgression(index) {
  if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(index)) return "full";
  if (["paladin", "ranger"].includes(index)) return "half";
  return "none";
}

function parseDiceStr(value) {
  const match = value?.match(/^(\d+)(d\d+)/);
  if (!match || !VALID_DICE.has(match[2])) return null;
  return { count: Number.parseInt(match[1], 10), die: match[2] };
}

function lowestEntry(record) {
  return Object.entries(record ?? {})
    .sort((a, b) => Number.parseInt(a[0], 10) - Number.parseInt(b[0], 10))[0]?.[1] ?? null;
}

function extractDamage(spell) {
  const attackType = spell.attack_type ?? null;
  const dcSaveStat = spell.dc?.dc_type?.index ?? null;

  if (spell.heal_at_slot_level) {
    const parsed = parseDiceStr(lowestEntry(spell.heal_at_slot_level));
    return {
      damageDiceCount: parsed?.count ?? null,
      damageDieType: parsed?.die ?? null,
      damageTypeName: "Healing",
      attackType,
      dcSaveStat,
    };
  }

  if (spell.damage) {
    const rawDice =
      (spell.damage.damage_at_slot_level
        ? lowestEntry(spell.damage.damage_at_slot_level)
        : null) ??
      (spell.damage.damage_at_character_level
        ? spell.damage.damage_at_character_level["1"] ?? null
        : null);
    const parsed = parseDiceStr(rawDice);
    return {
      damageDiceCount: parsed?.count ?? null,
      damageDieType: parsed?.die ?? null,
      damageTypeName: spell.damage.damage_type?.name ?? null,
      attackType,
      dcSaveStat,
    };
  }

  return {
    damageDiceCount: null,
    damageDieType: null,
    damageTypeName: null,
    attackType,
    dcSaveStat,
  };
}

function flattenMultiple(items) {
  const fixedItems = [];
  let categoryPick = null;

  for (const item of items ?? []) {
    if (item.option_type === "counted_reference" && item.of) {
      fixedItems.push({
        itemId: `${SYSTEM}:${item.of.index}`,
        name: item.of.name,
        quantity: item.count ?? 1,
      });
    } else if (
      item.option_type === "choice" &&
      item.choice?.from?.option_set_type === "equipment_category" &&
      item.choice.from.equipment_category
    ) {
      categoryPick = {
        category: item.choice.from.equipment_category.name,
        count: item.choice.choose ?? 1,
      };
    }
  }

  return { fixedItems, categoryPick };
}

function processEquipOption(opt) {
  if (opt.option_type === "counted_reference" && opt.of) {
    const quantity = opt.count ?? 1;
    return {
      type: "items",
      label: `${quantity > 1 ? `${quantity}x ` : ""}${opt.of.name}`,
      items: [{ itemId: `${SYSTEM}:${opt.of.index}`, name: opt.of.name, quantity }],
    };
  }

  if (opt.option_type === "multiple" && opt.items) {
    const { fixedItems, categoryPick } = flattenMultiple(opt.items);
    if (fixedItems.length === 0 && !categoryPick) return null;
    const parts = [
      ...fixedItems.map((item) => `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.name}`),
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
      return from.options.map(processEquipOption).find(Boolean) ?? null;
    }
  }

  return null;
}

async function insertRows(client, table, rows, chunkSize = 100) {
  if (!rows.length) return;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const columns = Object.keys(chunk[0]);
    const values = [];
    const rowPlaceholders = chunk.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        values.push(row[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${rowPlaceholders.join(", ")} ON CONFLICT DO NOTHING`,
      values,
    );
  }
}

async function deleteSrdRows(client) {
  await client.query(
    "DELETE FROM class_spells USING classes WHERE class_spells.class_id = classes.id AND classes.system = $1",
    [SYSTEM],
  );
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
    "race_skill_choices",
    "race_ability_bonus_options",
    "race_ability_bonuses",
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

export async function seedSrdPostgres(client) {
  console.log("Fetching 5e SRD data...");
  const [
    rawSpells,
    rawClasses,
    rawLevels,
    rawRaces,
    rawSubraces,
    rawFeatures,
    rawTraits,
    rawProficiencies,
    rawLanguages,
    rawSubclasses,
    rawFeats,
    rawEquipment,
    rawMagicItems,
  ] = await Promise.all([
    fetchJson(`${BASE_URL}/5e-SRD-Spells.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Classes.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Levels.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Races.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Subraces.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Features.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Traits.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Proficiencies.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Languages.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Subclasses.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Feats.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Equipment.json`),
    fetchJson(`${BASE_URL}/5e-SRD-Magic-Items.json`),
  ]);

  await client.query("BEGIN");
  try {
  await deleteSrdRows(client);

  const spellRows = rawSpells.map((spell) => {
    const damage = extractDamage(spell);
    return {
      id: spellId(spell.index),
      system: SYSTEM,
      name: spell.name,
      level: spell.level,
      school: spell.school.name,
      casting_time: capitalize(spell.casting_time),
      range: spell.range,
      duration: spell.duration,
      verbal: spell.components.includes("V"),
      somatic: spell.components.includes("S"),
      material: spell.components.includes("M"),
      material_desc: spell.material ?? "",
      ritual: spell.ritual,
      concentration: spell.concentration,
      description: spell.desc.join("\n\n"),
      upcast_desc: spell.higher_level?.join("\n\n") ?? "",
      damage_dice_count: damage.damageDiceCount,
      damage_die_type: damage.damageDieType,
      damage_type_name: damage.damageTypeName,
      attack_type: damage.attackType,
      dc_save_stat: damage.dcSaveStat,
      source: SOURCE,
      user_id: null,
    };
  });
  await insertRows(client, "spells", spellRows);

  const classRows = rawClasses.map((klass) => ({
    id: classId(klass.index),
    system: SYSTEM,
    name: klass.name,
    hit_die: hitDieStr(klass.hit_die),
    spellcasting_stat: klass.spellcasting?.spellcasting_ability?.index ?? null,
    spell_slot_progression: getSpellSlotProgression(klass.index),
    source: SOURCE,
    user_id: null,
  }));
  await insertRows(client, "classes", classRows);

  const slotRows = rawLevels
    .filter((level) => level.spellcasting)
    .map((level) => ({
      class_id: classId(level.class.index),
      level: level.level,
      slot_1: level.spellcasting?.spell_slots_level_1 ?? 0,
      slot_2: level.spellcasting?.spell_slots_level_2 ?? 0,
      slot_3: level.spellcasting?.spell_slots_level_3 ?? 0,
      slot_4: level.spellcasting?.spell_slots_level_4 ?? 0,
      slot_5: level.spellcasting?.spell_slots_level_5 ?? 0,
      slot_6: level.spellcasting?.spell_slots_level_6 ?? 0,
      slot_7: level.spellcasting?.spell_slots_level_7 ?? 0,
      slot_8: level.spellcasting?.spell_slots_level_8 ?? 0,
      slot_9: level.spellcasting?.spell_slots_level_9 ?? 0,
    }));
  await insertRows(client, "class_spell_slots", slotRows);

  const classSpellRows = [];
  for (const spell of rawSpells) {
    for (const klass of spell.classes ?? []) {
      classSpellRows.push({ class_id: classId(klass.index), spell_id: spellId(spell.index) });
    }
  }
  await insertRows(client, "class_spells", classSpellRows);

  const raceRows = rawRaces.map((race) => ({
    id: `${SYSTEM}:${race.index}`,
    system: SYSTEM,
    name: race.name,
    speed: race.speed ?? null,
    source: SOURCE,
    user_id: null,
  }));
  await insertRows(client, "races", raceRows);

  const subraceRows = rawSubraces.map((subrace) => ({
    id: `${SYSTEM}:${subrace.index}`,
    system: SYSTEM,
    race_id: `${SYSTEM}:${subrace.race.index}`,
    name: subrace.name,
    source: SOURCE,
    user_id: null,
  }));
  await insertRows(client, "subraces", subraceRows);

  await insertRows(
    client,
    "backgrounds",
    PHB_BACKGROUNDS.map((background) => ({
      id: `${SYSTEM}:${background.index}`,
      system: SYSTEM,
      name: background.name,
      skill_grants: JSON.stringify(background.skills),
      features_json: JSON.stringify(background.features),
      fixed_equipment_json: JSON.stringify(background.fixedEquipment),
      source: SOURCE,
      user_id: null,
    })),
  );

  const itemRows = rawEquipment.map((equipment) => {
    const damage = parseDiceStr(equipment.damage?.damage_dice);
    const twoHandedDamage = parseDiceStr(equipment.two_handed_damage?.damage_dice);
    return {
      id: `${SYSTEM}:${equipment.index}`,
      system: SYSTEM,
      name: equipment.name,
      equipment_category: equipment.equipment_category.name,
      description: equipment.desc?.length ? equipment.desc.join("\n\n") : null,
      weight: equipment.weight ?? null,
      cost: equipment.cost ? `${equipment.cost.quantity} ${equipment.cost.unit}` : null,
      weapon_category: equipment.weapon_category?.split(" ")[0] ?? null,
      weapon_range: equipment.weapon_range ?? null,
      damage_dice_count: damage?.count ?? null,
      damage_die_type: damage?.die ?? null,
      damage_type: equipment.damage?.damage_type?.name ?? null,
      two_handed_dice_count: twoHandedDamage?.count ?? null,
      two_handed_die_type: twoHandedDamage?.die ?? null,
      two_handed_damage_type: equipment.two_handed_damage?.damage_type?.name ?? null,
      properties: equipment.properties?.length ? JSON.stringify(equipment.properties.map((prop) => prop.name)) : null,
      range_normal: equipment.range?.normal ?? null,
      range_long: equipment.range?.long ?? null,
      armor_category: equipment.armor_category ?? null,
      ac_base: equipment.armor_class?.base ?? null,
      ac_dex_bonus: equipment.armor_class?.dex_bonus ?? null,
      ac_max_dex: equipment.armor_class?.max_bonus ?? null,
      stealth_disadvantage: equipment.stealth_disadvantage ?? null,
      str_minimum: equipment.str_minimum ?? null,
      source: SOURCE,
      user_id: null,
    };
  });
  await insertRows(client, "items", itemRows);

  const magicItemRows = rawMagicItems.map((item) => ({
    id: `${SYSTEM}:magic:${item.index}`,
    system: SYSTEM,
    name: item.name,
    equipment_category: item.equipment_category.name,
    description: item.desc?.length ? item.desc.join("\n\n") : null,
    weight: null,
    cost: null,
    weapon_category: null,
    weapon_range: null,
    damage_dice_count: null,
    damage_die_type: null,
    damage_type: null,
    two_handed_dice_count: null,
    two_handed_die_type: null,
    two_handed_damage_type: null,
    properties: null,
    range_normal: null,
    range_long: null,
    armor_category: null,
    ac_base: null,
    ac_dex_bonus: null,
    ac_max_dex: null,
    stealth_disadvantage: null,
    str_minimum: null,
    source: SOURCE,
    user_id: null,
  }));
  await insertRows(client, "items", magicItemRows);

  const classIdByIndex = new Map(rawClasses.map((klass) => [klass.index, classId(klass.index)]));
  const raceIdByIndex = new Map(rawRaces.map((race) => [race.index, `${SYSTEM}:${race.index}`]));
  const subraceIdByIndex = new Map(rawSubraces.map((subrace) => [subrace.index, `${SYSTEM}:${subrace.index}`]));
  const baseClassFeatures = rawFeatures.filter((feature) => !feature.subclass);

  await insertRows(
    client,
    "class_features",
    baseClassFeatures
      .filter((feature) => classIdByIndex.has(feature.class.index))
      .map((feature) => ({
        id: `${SYSTEM}:${feature.index}`,
        system: SYSTEM,
        class_id: classIdByIndex.get(feature.class.index),
        level: feature.level,
        name: feature.name,
        description: feature.desc.join("\n\n"),
        source: SOURCE,
        user_id: null,
      })),
  );

  const traitRows = [];
  for (const trait of rawTraits) {
    for (const race of trait.races ?? []) {
      if (raceIdByIndex.has(race.index)) {
        traitRows.push({
          id: `${SYSTEM}:trait:${trait.index}:${race.index}`,
          system: SYSTEM,
          race_id: raceIdByIndex.get(race.index),
          subrace_id: null,
          name: trait.name,
          description: trait.desc.join("\n\n"),
          source: SOURCE,
        });
      }
    }
    for (const subrace of trait.subraces ?? []) {
      if (subraceIdByIndex.has(subrace.index)) {
        traitRows.push({
          id: `${SYSTEM}:trait:${trait.index}:${subrace.index}`,
          system: SYSTEM,
          race_id: null,
          subrace_id: subraceIdByIndex.get(subrace.index),
          name: trait.name,
          description: trait.desc.join("\n\n"),
          source: SOURCE,
        });
      }
    }
  }
  await insertRows(client, "race_traits", traitRows);

  const raceAsiRows = [];
  for (const race of rawRaces) {
    for (const bonus of race.ability_bonuses ?? []) {
      raceAsiRows.push({
        id: `${SYSTEM}:race-asi:${race.index}:${bonus.ability_score.index}`,
        system: SYSTEM,
        race_id: `${SYSTEM}:${race.index}`,
        subrace_id: null,
        ability_score: bonus.ability_score.index,
        bonus: bonus.bonus,
      });
    }
  }
  for (const subrace of rawSubraces) {
    for (const bonus of subrace.ability_bonuses ?? []) {
      raceAsiRows.push({
        id: `${SYSTEM}:subrace-asi:${subrace.index}:${bonus.ability_score.index}`,
        system: SYSTEM,
        race_id: null,
        subrace_id: `${SYSTEM}:${subrace.index}`,
        ability_score: bonus.ability_score.index,
        bonus: bonus.bonus,
      });
    }
  }
  await insertRows(client, "race_ability_bonuses", raceAsiRows);

  const raceAsiOptionRows = [];
  for (const race of rawRaces) {
    for (const option of race.ability_bonus_options?.from?.options ?? []) {
      if (!option.ability_score?.index) continue;
      raceAsiOptionRows.push({
        id: `${SYSTEM}:race-asi-opt:${race.index}:${option.ability_score.index}`,
        system: SYSTEM,
        race_id: `${SYSTEM}:${race.index}`,
        ability_score: option.ability_score.index,
        bonus: option.bonus ?? 1,
        choose_count: race.ability_bonus_options.choose,
      });
    }
  }
  await insertRows(client, "race_ability_bonus_options", raceAsiOptionRows);

  const raceSkillRows = [];
  for (const trait of rawTraits) {
    if (!trait.proficiency_choices) continue;
    for (const race of trait.races ?? []) {
      if (!raceIdByIndex.has(race.index)) continue;
      for (const option of trait.proficiency_choices.from?.options ?? []) {
        if (!option.item?.index?.startsWith("skill-")) continue;
        const raw = option.item.index.replace(/^skill-/, "");
        raceSkillRows.push({
          id: `${SYSTEM}:race-skill:${race.index}:${raw}`,
          system: SYSTEM,
          race_id: raceIdByIndex.get(race.index),
          skill_key: kebabToCamel(raw),
          choose_count: trait.proficiency_choices.choose,
        });
      }
    }
  }
  await insertRows(client, "race_skill_choices", raceSkillRows);

  const classProfRows = [];
  for (const proficiency of rawProficiencies) {
    for (const klass of proficiency.classes ?? []) {
      if (!classIdByIndex.has(klass.index)) continue;
      classProfRows.push({
        id: `${SYSTEM}:prof:${klass.index}:${proficiency.index}`,
        system: SYSTEM,
        class_id: classIdByIndex.get(klass.index),
        name: proficiency.name,
        prof_type: proficiency.type,
        source: SOURCE,
      });
    }
  }
  await insertRows(client, "class_proficiencies", classProfRows);

  const classSkillRows = [];
  for (const klass of rawClasses) {
    const skillGroup = klass.proficiency_choices?.find((group) =>
      group.from?.options?.[0]?.item?.index?.startsWith("skill-"),
    );
    if (!skillGroup) continue;
    for (const option of skillGroup.from.options) {
      const raw = option.item.index.replace(/^skill-/, "");
      classSkillRows.push({
        id: `${SYSTEM}:${klass.index}:skill-choice:${raw}`,
        system: SYSTEM,
        class_id: classId(klass.index),
        skill_key: kebabToCamel(raw),
        choose_count: skillGroup.choose,
      });
    }
  }
  await insertRows(client, "class_skill_choices", classSkillRows);

  await insertRows(
    client,
    "languages",
    rawLanguages.map((language) => ({
      id: `${SYSTEM}:${language.index}`,
      system: SYSTEM,
      name: language.name,
      source: SOURCE,
    })),
  );

  await insertRows(
    client,
    "subclasses",
    rawSubclasses
      .filter((subclass) => classIdByIndex.has(subclass.class.index))
      .map((subclass) => ({
        id: `${SYSTEM}:${subclass.index}`,
        system: SYSTEM,
        class_id: classIdByIndex.get(subclass.class.index),
        name: subclass.name,
        subclass_flavor: subclass.subclass_flavor ?? null,
        description: Array.isArray(subclass.desc) ? subclass.desc.join("\n\n") : (subclass.desc ?? ""),
        source: SOURCE,
        user_id: null,
      })),
  );

  await insertRows(
    client,
    "feats",
    rawFeats.map((feat) => ({
      id: `${SYSTEM}:${feat.index}`,
      system: SYSTEM,
      name: feat.name,
      description: Array.isArray(feat.desc) ? feat.desc.join("\n\n") : (feat.desc ?? ""),
      source: SOURCE,
      user_id: null,
    })),
  );

  const itemByIndex = new Map(rawEquipment.map((equipment) => [equipment.index, equipment]));
  const fixedEquipRows = [];
  const equipOptionRows = [];

  for (const klass of rawClasses) {
    for (let index = 0; index < (klass.starting_equipment ?? []).length; index += 1) {
      const startingEquipment = klass.starting_equipment[index];
      const item = itemByIndex.get(startingEquipment.equipment.index);
      fixedEquipRows.push({
        id: `${SYSTEM}:${klass.index}:fixed:${index}`,
        system: SYSTEM,
        class_id: classId(klass.index),
        item_id: `${SYSTEM}:${startingEquipment.equipment.index}`,
        item_name: startingEquipment.equipment.name,
        quantity: startingEquipment.quantity,
        equipment_category: item?.equipment_category?.name ?? "Adventuring Gear",
        weight: item?.weight ?? null,
      });
    }

    for (let index = 0; index < (klass.starting_equipment_options ?? []).length; index += 1) {
      const group = klass.starting_equipment_options[index];
      if (group.from?.option_set_type !== "options_array") continue;
      const alternatives = (group.from.options ?? []).map(processEquipOption).filter(Boolean);
      if (!alternatives.length) continue;
      equipOptionRows.push({
        id: `${SYSTEM}:${klass.index}:opt:${index}`,
        system: SYSTEM,
        class_id: classId(klass.index),
        choice_index: index,
        description: group.desc,
        choose_count: group.choose ?? 1,
        options_json: JSON.stringify(alternatives),
      });
    }
  }
  await insertRows(client, "class_starting_equipment", fixedEquipRows);
  await insertRows(client, "class_starting_equipment_options", equipOptionRows);

  console.log(
    `Seed complete. ${spellRows.length} spells, ${classRows.length} classes, ${itemRows.length + magicItemRows.length} items.`,
  );
  await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}
