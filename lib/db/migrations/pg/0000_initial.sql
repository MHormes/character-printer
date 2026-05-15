CREATE TABLE IF NOT EXISTS users (
  id varchar(36) PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  name varchar(255),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id varchar(36) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  auto_save boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canvas_templates (
  id varchar(36) PRIMARY KEY,
  user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  cols integer NOT NULL,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT canvas_templates_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS spells (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  level integer NOT NULL,
  school varchar(100) NOT NULL DEFAULT '',
  casting_time varchar(100) NOT NULL DEFAULT '',
  range varchar(100) NOT NULL DEFAULT '',
  duration varchar(100) NOT NULL DEFAULT '',
  verbal boolean NOT NULL DEFAULT false,
  somatic boolean NOT NULL DEFAULT false,
  material boolean NOT NULL DEFAULT false,
  material_desc varchar(500) NOT NULL DEFAULT '',
  ritual boolean NOT NULL DEFAULT false,
  concentration boolean NOT NULL DEFAULT false,
  description varchar(10000) NOT NULL DEFAULT '',
  upcast_desc varchar(5000) NOT NULL DEFAULT '',
  damage_dice_count integer,
  damage_die_type varchar(10),
  damage_type_name varchar(100),
  attack_type varchar(20),
  dc_save_stat varchar(10),
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS classes (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  hit_die varchar(10) NOT NULL DEFAULT 'd8',
  spellcasting_stat varchar(10),
  spell_slot_progression varchar(20) NOT NULL DEFAULT 'none',
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_spell_slots (
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  level integer NOT NULL,
  slot_1 integer NOT NULL DEFAULT 0,
  slot_2 integer NOT NULL DEFAULT 0,
  slot_3 integer NOT NULL DEFAULT 0,
  slot_4 integer NOT NULL DEFAULT 0,
  slot_5 integer NOT NULL DEFAULT 0,
  slot_6 integer NOT NULL DEFAULT 0,
  slot_7 integer NOT NULL DEFAULT 0,
  slot_8 integer NOT NULL DEFAULT 0,
  slot_9 integer NOT NULL DEFAULT 0,
  PRIMARY KEY (class_id, level)
);

CREATE TABLE IF NOT EXISTS class_spells (
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  spell_id varchar(100) NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, spell_id)
);

CREATE TABLE IF NOT EXISTS backgrounds (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  skill_grants jsonb,
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS races (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  speed integer,
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subraces (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  race_id varchar(100) NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  equipment_category varchar(100) NOT NULL,
  description varchar(10000),
  weight double precision,
  cost varchar(50),
  weapon_category varchar(50),
  weapon_range varchar(20),
  damage_dice_count integer,
  damage_die_type varchar(10),
  damage_type varchar(50),
  two_handed_dice_count integer,
  two_handed_die_type varchar(10),
  two_handed_damage_type varchar(50),
  properties varchar(500),
  range_normal integer,
  range_long integer,
  armor_category varchar(20),
  ac_base integer,
  ac_dex_bonus boolean DEFAULT true,
  ac_max_dex integer,
  stealth_disadvantage boolean DEFAULT false,
  str_minimum integer,
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_features (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  level integer NOT NULL,
  name varchar(255) NOT NULL,
  description varchar(10000) NOT NULL DEFAULT '',
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS race_traits (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  race_id varchar(100) REFERENCES races(id) ON DELETE CASCADE,
  subrace_id varchar(100) REFERENCES subraces(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description varchar(10000) NOT NULL DEFAULT '',
  source varchar(50) NOT NULL DEFAULT 'srd'
);

CREATE TABLE IF NOT EXISTS class_proficiencies (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  prof_type varchar(50) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'srd'
);

CREATE TABLE IF NOT EXISTS class_skill_choices (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  skill_key varchar(60) NOT NULL,
  choose_count integer NOT NULL
);

CREATE TABLE IF NOT EXISTS languages (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'srd'
);

CREATE TABLE IF NOT EXISTS subclasses (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  subclass_flavor varchar(100),
  description varchar(10000) NOT NULL DEFAULT '',
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS race_ability_bonuses (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  race_id varchar(100) REFERENCES races(id) ON DELETE CASCADE,
  subrace_id varchar(100) REFERENCES subraces(id) ON DELETE CASCADE,
  ability_score varchar(10) NOT NULL,
  bonus integer NOT NULL
);

CREATE TABLE IF NOT EXISTS race_ability_bonus_options (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  race_id varchar(100) NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  ability_score varchar(10) NOT NULL,
  bonus integer NOT NULL,
  choose_count integer NOT NULL
);

CREATE TABLE IF NOT EXISTS race_skill_choices (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  race_id varchar(100) NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  skill_key varchar(60) NOT NULL,
  choose_count integer NOT NULL
);

CREATE TABLE IF NOT EXISTS feats (
  id varchar(100) PRIMARY KEY,
  system varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  description varchar(10000) NOT NULL DEFAULT '',
  source varchar(50) NOT NULL DEFAULT 'srd',
  user_id varchar(36) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_starting_equipment (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  item_id varchar(100) NOT NULL,
  item_name varchar(255) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  equipment_category varchar(100) NOT NULL DEFAULT 'Adventuring Gear',
  weight double precision
);

CREATE TABLE IF NOT EXISTS class_starting_equipment_options (
  id varchar(150) PRIMARY KEY,
  system varchar(50) NOT NULL,
  class_id varchar(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  choice_index integer NOT NULL,
  description varchar(1000) NOT NULL,
  choose_count integer NOT NULL DEFAULT 1,
  options_json varchar(10000) NOT NULL
);
