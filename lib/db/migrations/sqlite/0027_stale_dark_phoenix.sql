ALTER TABLE `backgrounds` ADD `fixed_proficiencies_json` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_secret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token_expiry` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verification_sent_at` integer;