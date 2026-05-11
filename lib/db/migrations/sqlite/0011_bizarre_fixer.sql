CREATE TABLE `class_proficiencies` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`prof_type` text NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feats` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `languages` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `race_traits` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text,
	`subrace_id` text,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subrace_id`) REFERENCES `subraces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subclasses` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`subclass_flavor` text,
	`description` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
