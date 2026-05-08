CREATE TABLE `backgrounds` (
	`id` text PRIMARY KEY NOT NULL,
	`system` text NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'srd' NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
