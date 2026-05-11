CREATE TABLE `class_starting_equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`item_id` text NOT NULL,
	`item_name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`equipment_category` text DEFAULT 'Adventuring Gear' NOT NULL,
	`weight` real,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class_starting_equipment_options` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`choice_index` integer NOT NULL,
	`description` text NOT NULL,
	`choose_count` integer DEFAULT 1 NOT NULL,
	`options_json` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
