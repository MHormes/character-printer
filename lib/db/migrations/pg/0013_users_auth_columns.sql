ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255) NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "role" varchar(20) NOT NULL DEFAULT 'user';
