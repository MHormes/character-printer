PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_backgrounds` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`skill_grants` text,
	`asi_grants` text,
	`feat_grant` text,
	`features_json` text,
	`fixed_equipment_json` text,
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_backgrounds`("id", "system", "name", "skill_grants", "asi_grants", "feat_grant", "features_json", "fixed_equipment_json", "source", "user_id") SELECT "id", "system", "name", "skill_grants", "asi_grants", "feat_grant", "features_json", "fixed_equipment_json", "source", "user_id" FROM `backgrounds`;--> statement-breakpoint
DROP TABLE `backgrounds`;--> statement-breakpoint
ALTER TABLE `__new_backgrounds` RENAME TO `backgrounds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_class_features` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`subclass_id` text,
	`level` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_class_features`("id", "system", "class_id", "subclass_id", "level", "name", "description", "source", "user_id") SELECT "id", "system", "class_id", "subclass_id", "level", "name", "description", "source", "user_id" FROM `class_features`;--> statement-breakpoint
DROP TABLE `class_features`;--> statement-breakpoint
ALTER TABLE `__new_class_features` RENAME TO `class_features`;--> statement-breakpoint
CREATE TABLE `__new_class_proficiencies` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`prof_type` text NOT NULL,
	`source` text DEFAULT 'srd',
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_class_proficiencies`("id", "system", "class_id", "name", "prof_type", "source") SELECT "id", "system", "class_id", "name", "prof_type", "source" FROM `class_proficiencies`;--> statement-breakpoint
DROP TABLE `class_proficiencies`;--> statement-breakpoint
ALTER TABLE `__new_class_proficiencies` RENAME TO `class_proficiencies`;--> statement-breakpoint
CREATE TABLE `__new_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`hit_die` text DEFAULT 'd8',
	`spellcasting_stat` text,
	`spell_slot_progression` text DEFAULT 'none',
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_classes`("id", "system", "name", "hit_die", "spellcasting_stat", "spell_slot_progression", "source", "user_id") SELECT "id", "system", "name", "hit_die", "spellcasting_stat", "spell_slot_progression", "source", "user_id" FROM `classes`;--> statement-breakpoint
DROP TABLE `classes`;--> statement-breakpoint
ALTER TABLE `__new_classes` RENAME TO `classes`;--> statement-breakpoint
CREATE TABLE `__new_feats` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feats`("id", "system", "name", "description", "source", "user_id") SELECT "id", "system", "name", "description", "source", "user_id" FROM `feats`;--> statement-breakpoint
DROP TABLE `feats`;--> statement-breakpoint
ALTER TABLE `__new_feats` RENAME TO `feats`;--> statement-breakpoint
CREATE TABLE `__new_items` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`equipment_category` text NOT NULL,
	`description` text,
	`weight` real,
	`cost` text,
	`weapon_category` text,
	`weapon_range` text,
	`damage_dice_count` integer,
	`damage_die_type` text,
	`damage_type` text,
	`two_handed_dice_count` integer,
	`two_handed_die_type` text,
	`two_handed_damage_type` text,
	`properties` text,
	`range_normal` integer,
	`range_long` integer,
	`armor_category` text,
	`ac_base` integer,
	`ac_dex_bonus` integer DEFAULT true,
	`ac_max_dex` integer,
	`stealth_disadvantage` integer DEFAULT false,
	`str_minimum` integer,
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_items`("id", "system", "name", "equipment_category", "description", "weight", "cost", "weapon_category", "weapon_range", "damage_dice_count", "damage_die_type", "damage_type", "two_handed_dice_count", "two_handed_die_type", "two_handed_damage_type", "properties", "range_normal", "range_long", "armor_category", "ac_base", "ac_dex_bonus", "ac_max_dex", "stealth_disadvantage", "str_minimum", "source", "user_id") SELECT "id", "system", "name", "equipment_category", "description", "weight", "cost", "weapon_category", "weapon_range", "damage_dice_count", "damage_die_type", "damage_type", "two_handed_dice_count", "two_handed_die_type", "two_handed_damage_type", "properties", "range_normal", "range_long", "armor_category", "ac_base", "ac_dex_bonus", "ac_max_dex", "stealth_disadvantage", "str_minimum", "source", "user_id" FROM `items`;--> statement-breakpoint
DROP TABLE `items`;--> statement-breakpoint
ALTER TABLE `__new_items` RENAME TO `items`;--> statement-breakpoint
CREATE TABLE `__new_languages` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'srd'
);
--> statement-breakpoint
INSERT INTO `__new_languages`("id", "system", "name", "source") SELECT "id", "system", "name", "source" FROM `languages`;--> statement-breakpoint
DROP TABLE `languages`;--> statement-breakpoint
ALTER TABLE `__new_languages` RENAME TO `languages`;--> statement-breakpoint
CREATE TABLE `__new_race_traits` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text,
	`subrace_id` text,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`source` text DEFAULT 'srd',
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subrace_id`) REFERENCES `subraces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_race_traits`("id", "system", "race_id", "subrace_id", "name", "description", "source") SELECT "id", "system", "race_id", "subrace_id", "name", "description", "source" FROM `race_traits`;--> statement-breakpoint
DROP TABLE `race_traits`;--> statement-breakpoint
ALTER TABLE `__new_race_traits` RENAME TO `race_traits`;--> statement-breakpoint
CREATE TABLE `__new_races` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`speed` integer,
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_races`("id", "system", "name", "speed", "source", "user_id") SELECT "id", "system", "name", "speed", "source", "user_id" FROM `races`;--> statement-breakpoint
DROP TABLE `races`;--> statement-breakpoint
ALTER TABLE `__new_races` RENAME TO `races`;--> statement-breakpoint
CREATE TABLE `__new_spells` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`school` text DEFAULT '',
	`casting_time` text DEFAULT '',
	`range` text DEFAULT '',
	`duration` text DEFAULT '',
	`verbal` integer DEFAULT false NOT NULL,
	`somatic` integer DEFAULT false NOT NULL,
	`material` integer DEFAULT false NOT NULL,
	`material_desc` text DEFAULT '',
	`ritual` integer DEFAULT false NOT NULL,
	`concentration` integer DEFAULT false NOT NULL,
	`description` text DEFAULT '',
	`upcast_desc` text DEFAULT '',
	`damage_dice_count` integer,
	`damage_die_type` text,
	`damage_type_name` text,
	`attack_type` text,
	`dc_save_stat` text,
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_spells`("id", "system", "name", "level", "school", "casting_time", "range", "duration", "verbal", "somatic", "material", "material_desc", "ritual", "concentration", "description", "upcast_desc", "damage_dice_count", "damage_die_type", "damage_type_name", "attack_type", "dc_save_stat", "source", "user_id") SELECT "id", "system", "name", "level", "school", "casting_time", "range", "duration", "verbal", "somatic", "material", "material_desc", "ritual", "concentration", "description", "upcast_desc", "damage_dice_count", "damage_die_type", "damage_type_name", "attack_type", "dc_save_stat", "source", "user_id" FROM `spells`;--> statement-breakpoint
DROP TABLE `spells`;--> statement-breakpoint
ALTER TABLE `__new_spells` RENAME TO `spells`;--> statement-breakpoint
CREATE TABLE `__new_subclasses` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`subclass_flavor` text,
	`description` text DEFAULT '',
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_subclasses`("id", "system", "class_id", "name", "subclass_flavor", "description", "source", "user_id") SELECT "id", "system", "class_id", "name", "subclass_flavor", "description", "source", "user_id" FROM `subclasses`;--> statement-breakpoint
DROP TABLE `subclasses`;--> statement-breakpoint
ALTER TABLE `__new_subclasses` RENAME TO `subclasses`;--> statement-breakpoint
CREATE TABLE `__new_subraces` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'srd',
	`user_id` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_subraces`("id", "system", "race_id", "name", "source", "user_id") SELECT "id", "system", "race_id", "name", "source", "user_id" FROM `subraces`;--> statement-breakpoint
DROP TABLE `subraces`;--> statement-breakpoint
ALTER TABLE `__new_subraces` RENAME TO `subraces`;