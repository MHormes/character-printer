CREATE TABLE `class_skill_choices` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`class_id` text NOT NULL,
	`skill_key` text NOT NULL,
	`choose_count` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
