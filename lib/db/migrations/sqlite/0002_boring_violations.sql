CREATE TABLE `class_spell_slots` (
	`class_id` text NOT NULL,
	`level` integer NOT NULL,
	`slot_1` integer DEFAULT 0 NOT NULL,
	`slot_2` integer DEFAULT 0 NOT NULL,
	`slot_3` integer DEFAULT 0 NOT NULL,
	`slot_4` integer DEFAULT 0 NOT NULL,
	`slot_5` integer DEFAULT 0 NOT NULL,
	`slot_6` integer DEFAULT 0 NOT NULL,
	`slot_7` integer DEFAULT 0 NOT NULL,
	`slot_8` integer DEFAULT 0 NOT NULL,
	`slot_9` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`class_id`, `level`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class_spells` (
	`class_id` text NOT NULL,
	`spell_id` text NOT NULL,
	PRIMARY KEY(`class_id`, `spell_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_id`) REFERENCES `spells`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`hit_die` text DEFAULT 'd8' NOT NULL,
	`spellcasting_stat` text,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spells` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`school` text DEFAULT '' NOT NULL,
	`casting_time` text DEFAULT '' NOT NULL,
	`range` text DEFAULT '' NOT NULL,
	`duration` text DEFAULT '' NOT NULL,
	`verbal` integer DEFAULT false NOT NULL,
	`somatic` integer DEFAULT false NOT NULL,
	`material` integer DEFAULT false NOT NULL,
	`material_desc` text DEFAULT '' NOT NULL,
	`ritual` integer DEFAULT false NOT NULL,
	`concentration` integer DEFAULT false NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`upcast_desc` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
