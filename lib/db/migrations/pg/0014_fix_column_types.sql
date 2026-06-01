ALTER TABLE "items" ALTER COLUMN "weight" TYPE real;
ALTER TABLE "backgrounds" ALTER COLUMN "tool_choices_json" TYPE jsonb USING tool_choices_json::jsonb;
ALTER TABLE "class_starting_equipment_options" ALTER COLUMN "options_json" TYPE text;
