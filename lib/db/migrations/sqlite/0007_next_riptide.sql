ALTER TABLE `classes` ADD `spell_slot_progression` text DEFAULT 'none' NOT NULL;
UPDATE `classes`
SET `spell_slot_progression` = 'full'
WHERE `id` IN (
  'dnd5e:bard',
  'dnd5e:cleric',
  'dnd5e:druid',
  'dnd5e:sorcerer',
  'dnd5e:wizard'
);
UPDATE `classes`
SET `spell_slot_progression` = 'half'
WHERE `id` IN ('dnd5e:paladin', 'dnd5e:ranger');
