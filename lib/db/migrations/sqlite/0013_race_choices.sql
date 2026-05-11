CREATE TABLE `race_ability_bonuses` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text,
	`subrace_id` text,
	`ability_score` text NOT NULL,
	`bonus` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subrace_id`) REFERENCES `subraces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `race_ability_bonus_options` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text NOT NULL,
	`ability_score` text NOT NULL,
	`bonus` integer NOT NULL,
	`choose_count` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `race_skill_choices` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text NOT NULL,
	`skill_key` text NOT NULL,
	`choose_count` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade
);
