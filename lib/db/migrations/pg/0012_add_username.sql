ALTER TABLE "users" ADD COLUMN "username" varchar(100) NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "users_username_unique" ON "users" ("username");
