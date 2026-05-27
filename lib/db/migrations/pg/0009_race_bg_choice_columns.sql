ALTER TABLE "backgrounds" ADD COLUMN "language_choice_count" integer;
ALTER TABLE "backgrounds" ADD COLUMN "tool_choices_json" text;
CREATE TABLE "race_language_choices" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100),
	"subrace_id" varchar(100),
	"choose_count" integer NOT NULL,
	CONSTRAINT "race_language_choices_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "race_language_choices_subrace_id_subraces_id_fk" FOREIGN KEY ("subrace_id") REFERENCES "subraces"("id") ON DELETE cascade ON UPDATE no action
);
