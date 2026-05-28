CREATE TABLE `race_language_choices` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text,
	`subrace_id` text,
	`choose_count` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subrace_id`) REFERENCES `subraces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `race_proficiencies` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text,
	`subrace_id` text,
	`name` text NOT NULL,
	`prof_type` text NOT NULL,
	`source` text DEFAULT 'srd',
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subrace_id`) REFERENCES `subraces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `backgrounds` ADD `language_choice_count` integer;--> statement-breakpoint
ALTER TABLE `backgrounds` ADD `tool_choices_json` text;--> statement-breakpoint
ALTER TABLE `races` ADD `tool_choices_json` text;--> statement-breakpoint
ALTER TABLE `races` ADD `cantrip_choices_json` text;--> statement-breakpoint
ALTER TABLE `subraces` ADD `tool_choices_json` text;--> statement-breakpoint
ALTER TABLE `subraces` ADD `cantrip_choices_json` text;