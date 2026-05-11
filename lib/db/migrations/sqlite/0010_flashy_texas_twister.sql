CREATE TABLE `class_features` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`level` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `backgrounds` ADD `skill_grants` text;--> statement-breakpoint
ALTER TABLE `races` ADD `speed` integer;