ALTER TABLE `backgrounds` ADD COLUMN `language_choice_count` integer;
--> statement-breakpoint
ALTER TABLE `backgrounds` ADD COLUMN `tool_choices_json` text;
--> statement-breakpoint
CREATE TABLE `race_language_choices` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text,
	`subrace_id` text,
	`choose_count` integer NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subrace_id`) REFERENCES `subraces`(`id`) ON UPDATE no action ON DELETE cascade
);
