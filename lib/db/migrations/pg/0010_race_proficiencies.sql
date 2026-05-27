CREATE TABLE "race_proficiencies" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100),
	"subrace_id" varchar(100),
	"name" varchar(255) NOT NULL,
	"prof_type" varchar(50) NOT NULL,
	"source" varchar(50) DEFAULT 'srd',
	CONSTRAINT "race_proficiencies_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "race_proficiencies_subrace_id_subraces_id_fk" FOREIGN KEY ("subrace_id") REFERENCES "subraces"("id") ON DELETE cascade ON UPDATE no action
);
