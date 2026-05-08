import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import {
  pgTable,
  varchar,
  integer as pgInteger,
  jsonb,
  timestamp,
  boolean,
  primaryKey as pgPrimaryKey,
} from "drizzle-orm/pg-core";

// ─── SQLite schema (development) ─────────────────────────────────────────────

export const sqliteUsers = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
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

// ─── PostgreSQL schema (production) ──────────────────────────────────────────

export const pgUsers = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
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

// ─── Game content: spells ─────────────────────────────────────────────────────

export const sqliteSpells = sqliteTable("spells", {
  id: text("id").primaryKey(), // "dnd5e:fireball"
  system: text("system").notNull(), // "dnd5e" | "dnd5_5e"
  name: text("name").notNull(),
  level: integer("level").notNull(),
  school: text("school").notNull().default(""),
  castingTime: text("casting_time").notNull().default(""),
  range: text("range").notNull().default(""),
  duration: text("duration").notNull().default(""),
  verbal: integer("verbal", { mode: "boolean" }).notNull().default(false),
  somatic: integer("somatic", { mode: "boolean" }).notNull().default(false),
  material: integer("material", { mode: "boolean" }).notNull().default(false),
  materialDesc: text("material_desc").notNull().default(""),
  ritual: integer("ritual", { mode: "boolean" }).notNull().default(false),
  concentration: integer("concentration", { mode: "boolean" }).notNull().default(false),
  description: text("description").notNull().default(""),
  upcastDesc: text("upcast_desc").notNull().default(""),
  damageDiceCount: integer("damage_dice_count"),
  damageDieType: text("damage_die_type"),    // "d4" | "d6" | "d8" | "d10" | "d12"
  damageTypeName: text("damage_type_name"),  // "Fire" | "Healing" | etc.
  attackType: text("attack_type"),           // "RANGED" | "MELEE" | null
  dcSaveStat: text("dc_save_stat"),          // "str" | "dex" | "con" | "int" | "wis" | "cha" | null
  source: text("source").notNull().default("srd"), // "srd" | "homebrew"
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgSpells = pgTable("spells", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  level: pgInteger("level").notNull(),
  school: varchar("school", { length: 100 }).notNull().default(""),
  castingTime: varchar("casting_time", { length: 100 }).notNull().default(""),
  range: varchar("range", { length: 100 }).notNull().default(""),
  duration: varchar("duration", { length: 100 }).notNull().default(""),
  verbal: boolean("verbal").notNull().default(false),
  somatic: boolean("somatic").notNull().default(false),
  material: boolean("material").notNull().default(false),
  materialDesc: varchar("material_desc", { length: 500 }).notNull().default(""),
  ritual: boolean("ritual").notNull().default(false),
  concentration: boolean("concentration").notNull().default(false),
  description: varchar("description", { length: 10000 }).notNull().default(""),
  upcastDesc: varchar("upcast_desc", { length: 5000 }).notNull().default(""),
  damageDiceCount: pgInteger("damage_dice_count"),
  damageDieType: varchar("damage_die_type", { length: 10 }),
  damageTypeName: varchar("damage_type_name", { length: 100 }),
  attackType: varchar("attack_type", { length: 20 }),
  dcSaveStat: varchar("dc_save_stat", { length: 10 }),
  source: varchar("source", { length: 50 }).notNull().default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: classes ────────────────────────────────────────────────────

export const sqliteClasses = sqliteTable("classes", {
  id: text("id").primaryKey(), // "dnd5e:wizard"
  system: text("system").notNull(),
  name: text("name").notNull(),
  hitDie: text("hit_die").notNull().default("d8"), // "d6" | "d8" | "d10" | "d12"
  spellcastingStat: text("spellcasting_stat"), // "int" | "wis" | "cha" | null
  source: text("source").notNull().default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgClasses = pgTable("classes", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  hitDie: varchar("hit_die", { length: 10 }).notNull().default("d8"),
  spellcastingStat: varchar("spellcasting_stat", { length: 10 }),
  source: varchar("source", { length: 50 }).notNull().default("srd"),
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
  source: text("source").notNull().default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgBackgrounds = pgTable("backgrounds", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: races ──────────────────────────────────────────────────────

export const sqliteRaces = sqliteTable("races", {
  id: text("id").primaryKey(), // "dnd5e:elf"
  system: text("system").notNull(),
  name: text("name").notNull(),
  source: text("source").notNull().default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgRaces = pgTable("races", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});

// ─── Game content: subraces ───────────────────────────────────────────────────

export const sqliteSubraces = sqliteTable("subraces", {
  id: text("id").primaryKey(), // "dnd5e:high-elf"
  system: text("system").notNull(),
  raceId: text("race_id").notNull().references(() => sqliteRaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source").notNull().default("srd"),
  userId: text("user_id").references(() => sqliteUsers.id, { onDelete: "cascade" }),
});

export const pgSubraces = pgTable("subraces", {
  id: varchar("id", { length: 100 }).primaryKey(),
  system: varchar("system", { length: 50 }).notNull(),
  raceId: varchar("race_id", { length: 100 }).notNull().references(() => pgRaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("srd"),
  userId: varchar("user_id", { length: 36 }).references(() => pgUsers.id, { onDelete: "cascade" }),
});
