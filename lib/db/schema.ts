import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import {
  pgTable,
  varchar,
  integer as pgInteger,
  jsonb,
  timestamp,
  boolean,
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
