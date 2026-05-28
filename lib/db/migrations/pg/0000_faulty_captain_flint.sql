CREATE TABLE "backgrounds" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"skill_grants" jsonb,
	"asi_grants" jsonb,
	"feat_grant" varchar(255),
	"features_json" jsonb,
	"fixed_equipment_json" jsonb,
	"language_choice_count" integer,
	"tool_choices_json" text,
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "canvas_templates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"cols" integer NOT NULL,
	"widgets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"auto_save" boolean DEFAULT true NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_features" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"subclass_id" varchar(100),
	"level" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(10000) DEFAULT '',
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "class_proficiencies" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"prof_type" varchar(50) NOT NULL,
	"source" varchar(50) DEFAULT 'srd'
);
--> statement-breakpoint
CREATE TABLE "class_skill_choices" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"skill_key" varchar(60) NOT NULL,
	"choose_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_spell_slots" (
	"class_id" varchar(100) NOT NULL,
	"level" integer NOT NULL,
	"slot_1" integer DEFAULT 0 NOT NULL,
	"slot_2" integer DEFAULT 0 NOT NULL,
	"slot_3" integer DEFAULT 0 NOT NULL,
	"slot_4" integer DEFAULT 0 NOT NULL,
	"slot_5" integer DEFAULT 0 NOT NULL,
	"slot_6" integer DEFAULT 0 NOT NULL,
	"slot_7" integer DEFAULT 0 NOT NULL,
	"slot_8" integer DEFAULT 0 NOT NULL,
	"slot_9" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "class_spell_slots_class_id_level_pk" PRIMARY KEY("class_id","level")
);
--> statement-breakpoint
CREATE TABLE "class_spells" (
	"class_id" varchar(100) NOT NULL,
	"spell_id" varchar(100) NOT NULL,
	CONSTRAINT "class_spells_class_id_spell_id_pk" PRIMARY KEY("class_id","spell_id")
);
--> statement-breakpoint
CREATE TABLE "class_starting_equipment" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"item_id" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"equipment_category" varchar(100) DEFAULT 'Adventuring Gear' NOT NULL,
	"weight" integer
);
--> statement-breakpoint
CREATE TABLE "class_starting_equipment_options" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"choice_index" integer NOT NULL,
	"description" varchar(1000) NOT NULL,
	"choose_count" integer DEFAULT 1 NOT NULL,
	"options_json" varchar(10000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"hit_die" varchar(10) DEFAULT 'd8',
	"spellcasting_stat" varchar(10),
	"spell_slot_progression" varchar(20) DEFAULT 'none',
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "feats" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(10000) DEFAULT '',
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"equipment_category" varchar(100) NOT NULL,
	"description" varchar(10000),
	"weight" integer,
	"cost" varchar(50),
	"weapon_category" varchar(50),
	"weapon_range" varchar(20),
	"damage_dice_count" integer,
	"damage_die_type" varchar(10),
	"damage_type" varchar(50),
	"two_handed_dice_count" integer,
	"two_handed_die_type" varchar(10),
	"two_handed_damage_type" varchar(50),
	"properties" varchar(500),
	"range_normal" integer,
	"range_long" integer,
	"armor_category" varchar(20),
	"ac_base" integer,
	"ac_dex_bonus" boolean DEFAULT true,
	"ac_max_dex" integer,
	"stealth_disadvantage" boolean DEFAULT false,
	"str_minimum" integer,
	"modifiers_json" text,
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"source" varchar(50) DEFAULT 'srd'
);
--> statement-breakpoint
CREATE TABLE "race_ability_bonus_options" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100) NOT NULL,
	"ability_score" varchar(10) NOT NULL,
	"bonus" integer NOT NULL,
	"choose_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "race_ability_bonuses" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100),
	"subrace_id" varchar(100),
	"ability_score" varchar(10) NOT NULL,
	"bonus" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "race_language_choices" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100),
	"subrace_id" varchar(100),
	"choose_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "race_proficiencies" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100),
	"subrace_id" varchar(100),
	"name" varchar(255) NOT NULL,
	"prof_type" varchar(50) NOT NULL,
	"source" varchar(50) DEFAULT 'srd'
);
--> statement-breakpoint
CREATE TABLE "race_skill_choices" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100) NOT NULL,
	"skill_key" varchar(60) NOT NULL,
	"choose_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "race_traits" (
	"id" varchar(150) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100),
	"subrace_id" varchar(100),
	"name" varchar(255) NOT NULL,
	"description" varchar(10000) DEFAULT '',
	"source" varchar(50) DEFAULT 'srd'
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"speed" integer,
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36),
	"tool_choices_json" text,
	"cantrip_choices_json" text
);
--> statement-breakpoint
CREATE TABLE "spells" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" integer NOT NULL,
	"school" varchar(100) DEFAULT '',
	"casting_time" varchar(100) DEFAULT '',
	"range" varchar(100) DEFAULT '',
	"duration" varchar(100) DEFAULT '',
	"verbal" boolean DEFAULT false NOT NULL,
	"somatic" boolean DEFAULT false NOT NULL,
	"material" boolean DEFAULT false NOT NULL,
	"material_desc" varchar(500) DEFAULT '',
	"ritual" boolean DEFAULT false NOT NULL,
	"concentration" boolean DEFAULT false NOT NULL,
	"description" varchar(10000) DEFAULT '',
	"upcast_desc" varchar(5000) DEFAULT '',
	"damage_dice_count" integer,
	"damage_die_type" varchar(10),
	"damage_type_name" varchar(100),
	"attack_type" varchar(20),
	"dc_save_stat" varchar(10),
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "subclasses" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subclass_flavor" varchar(100),
	"description" varchar(10000) DEFAULT '',
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "subraces" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"system" varchar(50) NOT NULL,
	"race_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"source" varchar(50) DEFAULT 'srd',
	"user_id" varchar(36),
	"tool_choices_json" text,
	"cantrip_choices_json" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"username" varchar(100) DEFAULT '' NOT NULL,
	"password_hash" varchar(255) DEFAULT '' NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "backgrounds" ADD CONSTRAINT "backgrounds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_templates" ADD CONSTRAINT "canvas_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_features" ADD CONSTRAINT "class_features_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_features" ADD CONSTRAINT "class_features_subclass_id_subclasses_id_fk" FOREIGN KEY ("subclass_id") REFERENCES "public"."subclasses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_features" ADD CONSTRAINT "class_features_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_proficiencies" ADD CONSTRAINT "class_proficiencies_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_skill_choices" ADD CONSTRAINT "class_skill_choices_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_spell_slots" ADD CONSTRAINT "class_spell_slots_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_spells" ADD CONSTRAINT "class_spells_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_spells" ADD CONSTRAINT "class_spells_spell_id_spells_id_fk" FOREIGN KEY ("spell_id") REFERENCES "public"."spells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_starting_equipment" ADD CONSTRAINT "class_starting_equipment_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_starting_equipment_options" ADD CONSTRAINT "class_starting_equipment_options_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feats" ADD CONSTRAINT "feats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_ability_bonus_options" ADD CONSTRAINT "race_ability_bonus_options_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_ability_bonuses" ADD CONSTRAINT "race_ability_bonuses_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_ability_bonuses" ADD CONSTRAINT "race_ability_bonuses_subrace_id_subraces_id_fk" FOREIGN KEY ("subrace_id") REFERENCES "public"."subraces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_language_choices" ADD CONSTRAINT "race_language_choices_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_language_choices" ADD CONSTRAINT "race_language_choices_subrace_id_subraces_id_fk" FOREIGN KEY ("subrace_id") REFERENCES "public"."subraces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_proficiencies" ADD CONSTRAINT "race_proficiencies_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_proficiencies" ADD CONSTRAINT "race_proficiencies_subrace_id_subraces_id_fk" FOREIGN KEY ("subrace_id") REFERENCES "public"."subraces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_skill_choices" ADD CONSTRAINT "race_skill_choices_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_traits" ADD CONSTRAINT "race_traits_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_traits" ADD CONSTRAINT "race_traits_subrace_id_subraces_id_fk" FOREIGN KEY ("subrace_id") REFERENCES "public"."subraces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spells" ADD CONSTRAINT "spells_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subclasses" ADD CONSTRAINT "subclasses_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subclasses" ADD CONSTRAINT "subclasses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subraces" ADD CONSTRAINT "subraces_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subraces" ADD CONSTRAINT "subraces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_templates_user_name_unique" ON "canvas_templates" USING btree ("user_id","name");