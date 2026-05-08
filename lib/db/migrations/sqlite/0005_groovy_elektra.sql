CREATE TABLE `races` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subraces` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`race_id` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
