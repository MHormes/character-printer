ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_sent_at" timestamp;
