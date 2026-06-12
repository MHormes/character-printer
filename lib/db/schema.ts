import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  pgTable,
  varchar,
  integer as pgInteger,
  real as pgReal,
  jsonb,
  timestamp,
  boolean,
  primaryKey as pgPrimaryKey,
  uniqueIndex as pgUniqueIndex,
  text as pgText,
} from "drizzle-orm/pg-core";

// ─── SQLite schema (development) ─────────────────────────────────────────────

export const sqliteUsers = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  username: text("username").notNull().default("").unique(),
  passwordHash: text("password_hash").notNull().default(""),
  role: text("role").notNull().default("user"),
  totpSecret: text("totp_secret"),
  totpEnabled: integer("totp_enabled", { mode: "boolean" }).notNull().default(false),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: integer("verification_token_expiry", { mode: "timestamp" }),
  emailVerificationSentAt: integer("email_verification_sent_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sqliteCharacters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => sqliteUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  autoSave: integer("auto_save", { mode: "boolean" }).notNull().default(true),
  data: text("data", { mode: "json" }).notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sqliteCanvasTemplates = sqliteTable("canvas_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => sqliteUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cols: integer("cols").notNull(),
  widgets: text("widgets", { mode: "json" }).notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => [uniqueIndex("canvas_templates_user_name_unique").on(t.userId, t.name)]);

// ─── PostgreSQL schema (production) ──────────────────────────────────────────

export const pgUsers = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  username: varchar("username", { length: 100 }).notNull().default("").unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull().default(""),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  totpSecret: pgText("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  emailVerified: timestamp("email_verified"),
  verificationToken: pgText("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  emailVerificationSentAt: timestamp("email_verification_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pgCharacters = pgTable("characters", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => pgUsers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  autoSave: boolean("auto_save").notNull().default(true),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pgCanvasTemplates = pgTable("canvas_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => pgUsers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  cols: pgInteger("cols").notNull(),
  widgets: jsonb("widgets").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [pgUniqueIndex("canvas_templates_user_name_unique").on(t.userId, t.name)]);

// ─── Game content: spells ─────────────────────────────────────────────────────

export const sqliteSpells = sqliteTable("spells", {
  id: text("id").primaryKey(), // "dnd5e:fireball"
  system: text("system").notNull(), // "dnd5e" | "dnd5_5e"
  name: text("name").notNull(),
  level: integer("level").notNull(),
  school: text("school").default(""),
  castingTime: text("casting_time").default(""),
  range: text("range").default(""),
  duration: text("duration").default(""),
  verbal: integer("verbal", { mode: "boolean" }).notNull().default(false),
  somatic: integer("somatic", { mode: "boolean" }).notNull().default(false),
  material: integer("material", { mode: "boolean" }).notNull().default(false),
  materialDesc: text("material_desc").default(""),
  ritual: integer("ritual", { mode: "boolean" }).notNull().default(false),
  concentration: integer("concentration", { mode: "boolean" }).notNull().default(false),
  description: text("description").default(""),
  upcastDesc: text("upcast_desc").default(""),
  damageDiceCount: integer("damage_dice_count"),
  damageDieType: text("damage_die_type"),    // "d4" | "d6" | "d8" | "d10" | "d12"
  damageTypeName: text("damage_type_name"),  // "Fire" | "Healing" | etc.
  attackType: text("attack_type"),           // "RANGED" | "MELEE" | null
  dcSaveStat: text("dc_save_stat"),          // "str" | "dex" | "con" | "int" | "wis" | "cha" | null
  source: text("source").default("srd"), // "srd" | "homebrew"
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgSpells = pgTable("spells", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  level: pgInteger("level").notNull(),
  school: varchar("school", { length: 100 }).default(""),
  castingTime: varchar("casting_time", { length: 100 }).default(""),
  range: varchar("range", { length: 100 }).default(""),
  duration: varchar("duration", { length: 100 }).default(""),
  verbal: boolean("verbal").notNull().default(false),
  somatic: boolean("somatic").notNull().default(false),
  material: boolean("material").notNull().default(false),
  materialDesc: varchar("material_desc", { length: 500 }).default(""),
  ritual: boolean("ritual").notNull().default(false),
  concentration: boolean("concentration").notNull().default(false),
  description: varchar("description", { length: 10000 }).default(""),
  upcastDesc: varchar("upcast_desc", { length: 5000 }).default(""),
  damageDiceCount: pgInteger("damage_dice_count"),
  damageDieType: varchar("damage_die_type", { length: 10 }),
  damageTypeName: varchar("damage_type_name", { length: 100 }),
  attackType: varchar("attack_type", { length: 20 }),
  dcSaveStat: varchar("dc_save_stat", { length: 10 }),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: classes ────────────────────────────────────────────────────

export const sqliteClasses = sqliteTable("classes", {
  id: text("id").primaryKey(), // "dnd5e:wizard"
  system: text("system").notNull(),
  name: text("name").notNull(),
  hitDie: text("hit_die").default("d8"), // "d6" | "d8" | "d10" | "d12"
  spellcastingStat: text("spellcasting_stat"), // "int" | "wis" | "cha" | null
  spellSlotProgression: text("spell_slot_progression").default("none"),
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgClasses = pgTable("classes", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  hitDie: varchar("hit_die", { length: 10 }).default("d8"),
  spellcastingStat: varchar("spellcasting_stat", { length: 10 }),
  spellSlotProgression: varchar("spell_slot_progression", { length: 20 }).default("none"),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: class spell slots (one row per class × level) ──────────────

export const sqliteClassSpellSlots = sqliteTable("class_spell_slots", {
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  level: integer("level").notNull(), // 1–20
  slot1: integer("slot_1").notNull().default(0),
  slot2: integer("slot_2").notNull().default(0),
  slot3: integer("slot_3").notNull().default(0),
  slot4: integer("slot_4").notNull().default(0),
  slot5: integer("slot_5").notNull().default(0),
  slot6: integer("slot_6").notNull().default(0),
  slot7: integer("slot_7").notNull().default(0),
  slot8: integer("slot_8").notNull().default(0),
  slot9: integer("slot_9").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.classId, t.level] })]);

export const pgClassSpellSlots = pgTable("class_spell_slots", {
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  level: pgInteger("level").notNull(),
  slot1: pgInteger("slot_1").notNull().default(0),
  slot2: pgInteger("slot_2").notNull().default(0),
  slot3: pgInteger("slot_3").notNull().default(0),
  slot4: pgInteger("slot_4").notNull().default(0),
  slot5: pgInteger("slot_5").notNull().default(0),
  slot6: pgInteger("slot_6").notNull().default(0),
  slot7: pgInteger("slot_7").notNull().default(0),
  slot8: pgInteger("slot_8").notNull().default(0),
  slot9: pgInteger("slot_9").notNull().default(0),
}, (t) => [pgPrimaryKey({ columns: [t.classId, t.level] })]);

// ─── Game content: class → spell mapping ─────────────────────────────────────

export const sqliteClassSpells = sqliteTable("class_spells", {
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  spellId: text("spell_id").notNull().references(() => sqliteSpells.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.classId, t.spellId] })]);

export const pgClassSpells = pgTable("class_spells", {
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  spellId: varchar("spell_id", { length: 100 }).notNull().references(() => pgSpells.id, { onDelete: "cascade" }),
}, (t) => [pgPrimaryKey({ columns: [t.classId, t.spellId] })]);

// ─── Game content: backgrounds ───────────────────────────────────────────────

export const sqliteBackgrounds = sqliteTable("backgrounds", {
  id: text("id").primaryKey(), // "dnd5e:acolyte"
  system: text("system").notNull(),
  name: text("name").notNull(),
  skillGrants: text("skill_grants"), // JSON: ["acrobatics","insight",...] camelCase keys
  asiGrants: text("asi_grants"),     // JSON: [{"stat":"str","bonus":2},...] — 2024 backgrounds only
  featGrant: text("feat_grant"),     // feat name granted at creation — 2024 backgrounds only
  featuresJson: text("features_json"), // JSON: [{name, description}] — fixed (non-choice) features only
  fixedEquipmentJson: text("fixed_equipment_json"), // JSON: [{name, quantity}] — auto-added to inventory
  fixedProficienciesJson: text("fixed_proficiencies_json"), // JSON: [{name, category}] — fixed prof grants (tools, vehicles, etc.)
  languageChoiceCount: integer("language_choice_count"), // how many languages to pick
  toolChoicesJson: text("tool_choices_json"), // JSON: [{count, category, label}] — choosable tool profs
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgBackgrounds = pgTable("backgrounds", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  skillGrants: jsonb("skill_grants"), // string[]
  asiGrants: jsonb("asi_grants"),     // {stat: string, bonus: number}[] — 2024 backgrounds only
  featGrant: varchar("feat_grant", { length: 255 }), // feat name — 2024 backgrounds only
  featuresJson: jsonb("features_json"), // {name: string, description: string}[] — fixed features only
  fixedEquipmentJson: jsonb("fixed_equipment_json"), // {name: string, quantity: number}[]
  fixedProficienciesJson: jsonb("fixed_proficiencies_json"), // {name: string, category: string}[] — fixed prof grants
  languageChoiceCount: pgInteger("language_choice_count"),
  toolChoicesJson: jsonb("tool_choices_json"),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: races ──────────────────────────────────────────────────────

export const sqliteRaces = sqliteTable("races", {
  id: text("id").primaryKey(), // "dnd5e:elf"
  system: text("system").notNull(),
  name: text("name").notNull(),
  speed: integer("speed"),               // walking speed in feet (30, 25, etc.)
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
  toolChoicesJson: text("tool_choices_json"),
  cantripChoicesJson: text("cantrip_choices_json"),
});

export const pgRaces = pgTable("races", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  speed: pgInteger("speed"),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
  toolChoicesJson: pgText("tool_choices_json"),
  cantripChoicesJson: pgText("cantrip_choices_json"),
});

// ─── Game content: subraces ───────────────────────────────────────────────────

export const sqliteSubraces = sqliteTable("subraces", {
  id: text("id").primaryKey(), // "dnd5e:high-elf"
  system: text("system").notNull(),
  raceId: text("race_id").notNull().references(() => sqliteRaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
  toolChoicesJson: text("tool_choices_json"),
  cantripChoicesJson: text("cantrip_choices_json"),
});

export const pgSubraces = pgTable("subraces", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).notNull().references(() => pgRaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
  toolChoicesJson: pgText("tool_choices_json"),
  cantripChoicesJson: pgText("cantrip_choices_json"),
});

// ─── Game content: equipment / items ─────────────────────────────────────────

export const sqliteItems = sqliteTable("items", {
  id: text("id").primaryKey(), // "dnd5e:longsword"
  system: text("system").notNull(),
  name: text("name").notNull(),
  equipmentCategory: text("equipment_category").notNull(), // "Weapon" | "Armor" | "Tool" | "Adventuring Gear" | ...
  description: text("description"),
  weight: real("weight"),
  cost: text("cost"), // "15 gp"
  // Weapon fields
  weaponCategory: text("weapon_category"),   // "Simple" | "Martial"
  weaponRange: text("weapon_range"),         // "Melee" | "Ranged"
  damageDiceCount: integer("damage_dice_count"),
  damageDieType: text("damage_die_type"),    // "d4" | "d6" | "d8" | "d10" | "d12"
  damageType: text("damage_type"),           // "Slashing" | "Piercing" | "Bludgeoning" | ...
  twoHandedDiceCount: integer("two_handed_dice_count"),
  twoHandedDieType: text("two_handed_die_type"),
  twoHandedDamageType: text("two_handed_damage_type"),
  properties: text("properties"),            // JSON array: ["Finesse","Versatile","Light",...]
  rangeNormal: integer("range_normal"),
  rangeLong: integer("range_long"),
  // Armor fields
  armorCategory: text("armor_category"),     // "Light" | "Medium" | "Heavy" | "Shield"
  acBase: integer("ac_base"),
  acDexBonus: integer("ac_dex_bonus", { mode: "boolean" }).default(true),
  acMaxDex: integer("ac_max_dex"),
  stealthDisadvantage: integer("stealth_disadvantage", { mode: "boolean" }).default(false),
  strMinimum: integer("str_minimum"),
  modifiersJson: text("modifiers_json"),
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgItems = pgTable("items", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  equipmentCategory: varchar("equipment_category", { length: 100 }).notNull(),
  description: varchar("description", { length: 10000 }),
  weight: pgReal("weight"),
  cost: varchar("cost", { length: 50 }),
  weaponCategory: varchar("weapon_category", { length: 50 }),
  weaponRange: varchar("weapon_range", { length: 20 }),
  damageDiceCount: pgInteger("damage_dice_count"),
  damageDieType: varchar("damage_die_type", { length: 10 }),
  damageType: varchar("damage_type", { length: 50 }),
  twoHandedDiceCount: pgInteger("two_handed_dice_count"),
  twoHandedDieType: varchar("two_handed_die_type", { length: 10 }),
  twoHandedDamageType: varchar("two_handed_damage_type", { length: 50 }),
  properties: varchar("properties", { length: 500 }),
  rangeNormal: pgInteger("range_normal"),
  rangeLong: pgInteger("range_long"),
  armorCategory: varchar("armor_category", { length: 20 }),
  acBase: pgInteger("ac_base"),
  acDexBonus: boolean("ac_dex_bonus").default(true),
  acMaxDex: pgInteger("ac_max_dex"),
  stealthDisadvantage: boolean("stealth_disadvantage").default(false),
  strMinimum: pgInteger("str_minimum"),
  modifiersJson: pgText("modifiers_json"),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: class features ────────────────────────────────────────────

export const sqliteClassFeatures = sqliteTable("class_features", {
  id: text("id").primaryKey(),          // "dnd5e:action-surge-1-use"
  system: text("system").notNull(),
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  subclassId: text("subclass_id").references(() => sqliteSubclasses.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),    // character level when feature is gained
  name: text("name").notNull(),
  description: text("description").default(""),
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgClassFeatures = pgTable("class_features", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  subclassId: varchar("subclass_id", { length: 100 }).references(() => pgSubclasses.id, { onDelete: "cascade" }),
  level: pgInteger("level").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 10000 }).default(""),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: race traits ────────────────────────────────────────────────

export const sqliteRaceTraits = sqliteTable("race_traits", {
  id: text("id").primaryKey(),          // "dnd5e:trait:darkvision:elf"
  system: text("system").notNull(),
  raceId: text("race_id").references(() => sqliteRaces.id, { onDelete: "cascade" }),
  subraceId: text("subrace_id").references(() => sqliteSubraces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  source: text("source").default("srd"),
});

export const pgRaceTraits = pgTable("race_traits", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).references(() => pgRaces.id, { onDelete: "cascade" }),
  subraceId: varchar("subrace_id", { length: 100 }).references(() => pgSubraces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 10000 }).default(""),
  source: varchar("source", { length: 50 }).default("srd"),
});

// ─── Game content: class proficiencies ───────────────────────────────────────

export const sqliteClassProficiencies = sqliteTable("class_proficiencies", {
  id: text("id").primaryKey(),          // "dnd5e:fighter:longswords"
  system: text("system").notNull(),
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),         // "Longswords"
  profType: text("prof_type").notNull(), // "Weapons" | "Armor" | "Tools" | "Skills" | "Saving Throws"
  source: text("source").default("srd"),
});

export const pgClassProficiencies = pgTable("class_proficiencies", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  profType: varchar("prof_type", { length: 50 }).notNull(),
  source: varchar("source", { length: 50 }).default("srd"),
});

// ─── Game content: class skill choices ────────────────────────────────────────

export const sqliteClassSkillChoices = sqliteTable("class_skill_choices", {
  id: text("id").primaryKey(),          // "dnd5e:wizard:skill-arcana"
  system: text("system").notNull(),
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  skillKey: text("skill_key").notNull(), // camelCase: "arcana", "animalHandling"
  chooseCount: integer("choose_count").notNull(),
});

export const pgClassSkillChoices = pgTable("class_skill_choices", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  skillKey: varchar("skill_key", { length: 60 }).notNull(),
  chooseCount: pgInteger("choose_count").notNull(),
});

// ─── Game content: languages ──────────────────────────────────────────────────

export const sqliteLanguages = sqliteTable("languages", {
  id: text("id").primaryKey(),          // "dnd5e:common"
  system: text("system").notNull(),
  name: text("name").notNull(),
  source: text("source").default("srd"),
});

export const pgLanguages = pgTable("languages", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).default("srd"),
});

// ─── Game content: subclasses ─────────────────────────────────────────────────

export const sqliteSubclasses = sqliteTable("subclasses", {
  id: text("id").primaryKey(),          // "dnd5e:berserker"
  system: text("system").notNull(),
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subclassFlavor: text("subclass_flavor"), // e.g. "Primal Path", "Arcane Tradition"
  description: text("description").default(""),
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgSubclasses = pgTable("subclasses", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  subclassFlavor: varchar("subclass_flavor", { length: 100 }),
  description: varchar("description", { length: 10000 }).default(""),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: race ability bonuses ──────────────────────────────────────

export const sqliteRaceAbilityBonuses = sqliteTable("race_ability_bonuses", {
  id: text("id").primaryKey(),
  system: text("system").notNull(),
  raceId: text("race_id").references(() => sqliteRaces.id, { onDelete: "cascade" }),
  subraceId: text("subrace_id").references(() => sqliteSubraces.id, { onDelete: "cascade" }),
  abilityScore: text("ability_score").notNull(), // "str"|"dex"|"con"|"int"|"wis"|"cha"
  bonus: integer("bonus").notNull(),
});

export const pgRaceAbilityBonuses = pgTable("race_ability_bonuses", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).references(() => pgRaces.id, { onDelete: "cascade" }),
  subraceId: varchar("subrace_id", { length: 100 }).references(() => pgSubraces.id, { onDelete: "cascade" }),
  abilityScore: varchar("ability_score", { length: 10 }).notNull(),
  bonus: pgInteger("bonus").notNull(),
});

// choosable ASI pool — e.g. Half-Elf picks +1 to 2 from these
export const sqliteRaceAbilityBonusOptions = sqliteTable("race_ability_bonus_options", {
  id: text("id").primaryKey(),
  system: text("system").notNull(),
  raceId: text("race_id").notNull().references(() => sqliteRaces.id, { onDelete: "cascade" }),
  abilityScore: text("ability_score").notNull(),
  bonus: integer("bonus").notNull(),
  chooseCount: integer("choose_count").notNull(),
});

export const pgRaceAbilityBonusOptions = pgTable("race_ability_bonus_options", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).notNull().references(() => pgRaces.id, { onDelete: "cascade" }),
  abilityScore: varchar("ability_score", { length: 10 }).notNull(),
  bonus: pgInteger("bonus").notNull(),
  chooseCount: pgInteger("choose_count").notNull(),
});

// choosable skill proficiencies — e.g. Half-Elf picks 2 from any skill
export const sqliteRaceSkillChoices = sqliteTable("race_skill_choices", {
  id: text("id").primaryKey(),
  system: text("system").notNull(),
  raceId: text("race_id").notNull().references(() => sqliteRaces.id, { onDelete: "cascade" }),
  skillKey: text("skill_key").notNull(),
  chooseCount: integer("choose_count").notNull(),
});

export const pgRaceSkillChoices = pgTable("race_skill_choices", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).notNull().references(() => pgRaces.id, { onDelete: "cascade" }),
  skillKey: varchar("skill_key", { length: 60 }).notNull(),
  chooseCount: pgInteger("choose_count").notNull(),
});

// choosable language grants — e.g. Half-Elf picks 1 extra language
export const sqliteRaceLanguageChoices = sqliteTable("race_language_choices", {
  id: text("id").primaryKey(),
  system: text("system").notNull(),
  raceId: text("race_id").references(() => sqliteRaces.id, { onDelete: "cascade" }),
  subraceId: text("subrace_id").references(() => sqliteSubraces.id, { onDelete: "cascade" }),
  chooseCount: integer("choose_count").notNull(),
});

export const pgRaceLanguageChoices = pgTable("race_language_choices", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).references(() => pgRaces.id, { onDelete: "cascade" }),
  subraceId: varchar("subrace_id", { length: 100 }).references(() => pgSubraces.id, { onDelete: "cascade" }),
  chooseCount: pgInteger("choose_count").notNull(),
});

// fixed proficiency grants from race/subrace — e.g. Elf Weapon Training, Keen Senses
export const sqliteRaceProficiencies = sqliteTable("race_proficiencies", {
  id: text("id").primaryKey(),
  system: text("system").notNull(),
  raceId: text("race_id").references(() => sqliteRaces.id, { onDelete: "cascade" }),
  subraceId: text("subrace_id").references(() => sqliteSubraces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  profType: text("prof_type").notNull(), // "Weapon" | "Armor" | "Tool" | "Skill"
  source: text("source").default("srd"),
});

export const pgRaceProficiencies = pgTable("race_proficiencies", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).references(() => pgRaces.id, { onDelete: "cascade" }),
  subraceId: varchar("subrace_id", { length: 100 }).references(() => pgSubraces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  profType: varchar("prof_type", { length: 50 }).notNull(),
  source: varchar("source", { length: 50 }).default("srd"),
});

// ─── Game content: feats ──────────────────────────────────────────────────────

export const sqliteFeats = sqliteTable("feats", {
  id: text("id").primaryKey(),          // "dnd5e:grappler"
  system: text("system").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  source: text("source").default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgFeats = pgTable("feats", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 10000 }).default(""),
  source: varchar("source", { length: 50 }).default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: class starting equipment (fixed grants) ───────────────────

export const sqliteClassStartingEquipment = sqliteTable("class_starting_equipment", {
  id: text("id").primaryKey(),          // "dnd5e:fighter:longsword:0"
  system: text("system").notNull(),
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),    // "dnd5e:longsword"
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  equipmentCategory: text("equipment_category").notNull().default("Adventuring Gear"),
  weight: real("weight"),
});

export const pgClassStartingEquipment = pgTable("class_starting_equipment", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  itemId: varchar("item_id", { length: 100 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  quantity: pgInteger("quantity").notNull().default(1),
  equipmentCategory: varchar("equipment_category", { length: 100 }).notNull().default("Adventuring Gear"),
  weight: pgInteger("weight"),
});

// ─── Game content: class starting equipment options (choice groups) ───────────

export const sqliteClassStartingEquipmentOptions = sqliteTable("class_starting_equipment_options", {
  id: text("id").primaryKey(),          // "dnd5e:fighter:opt:0"
  system: text("system").notNull(),
  classId: text("class_id").notNull().references(() => sqliteClasses.id, { onDelete: "cascade" }),
  choiceIndex: integer("choice_index").notNull(),
  description: text("description").notNull(),
  chooseCount: integer("choose_count").notNull().default(1),
  optionsJson: text("options_json").notNull(), // JSON: StartingEquipAlternative[]
});

export const pgClassStartingEquipmentOptions = pgTable("class_starting_equipment_options", {
  id: varchar("id", { length: 150 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  classId: varchar("class_id", { length: 100 }).notNull().references(() => pgClasses.id, { onDelete: "cascade" }),
  choiceIndex: pgInteger("choice_index").notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
  chooseCount: pgInteger("choose_count").notNull().default(1),
  optionsJson: pgText("options_json").notNull(),
});
