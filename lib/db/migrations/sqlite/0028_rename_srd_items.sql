-- Rename SRD items from "Category, Qualifier" to "Category - Qualifier"
-- Only the first ", " in each name is replaced; compound qualifiers like "+1, +2, or +3" are preserved.
UPDATE items SET name = 'Crossbow - light' WHERE name = 'Crossbow, light';
--> statement-breakpoint
UPDATE items SET name = 'Crossbow - hand' WHERE name = 'Crossbow, hand';
--> statement-breakpoint
UPDATE items SET name = 'Crossbow - heavy' WHERE name = 'Crossbow, heavy';
--> statement-breakpoint
UPDATE items SET name = 'Hammer - sledge' WHERE name = 'Hammer, sledge';
--> statement-breakpoint
UPDATE items SET name = 'Bottle - glass' WHERE name = 'Bottle, glass';
--> statement-breakpoint
UPDATE items SET name = 'Bottle - Glass' WHERE name = 'Bottle, Glass';
--> statement-breakpoint
UPDATE items SET name = 'Bullets - Firearm' WHERE name = 'Bullets, Firearm';
--> statement-breakpoint
UPDATE items SET name = 'Bullets - Sling' WHERE name = 'Bullets, Sling';
--> statement-breakpoint
UPDATE items SET name = 'Case - crossbow bolt' WHERE name = 'Case, crossbow bolt';
--> statement-breakpoint
UPDATE items SET name = 'Case - map or scroll' WHERE name = 'Case, map or scroll';
--> statement-breakpoint
UPDATE items SET name = 'Case - Crossbow Bolt' WHERE name = 'Case, Crossbow Bolt';
--> statement-breakpoint
UPDATE items SET name = 'Case - Map or Scroll' WHERE name = 'Case, Map or Scroll';
--> statement-breakpoint
UPDATE items SET name = 'Clothes - common' WHERE name = 'Clothes, common';
--> statement-breakpoint
UPDATE items SET name = 'Clothes - costume' WHERE name = 'Clothes, costume';
--> statement-breakpoint
UPDATE items SET name = 'Clothes - fine' WHERE name = 'Clothes, fine';
--> statement-breakpoint
UPDATE items SET name = 'Clothes - Fine' WHERE name = 'Clothes, Fine';
--> statement-breakpoint
UPDATE items SET name = 'Clothes - traveler''s' WHERE name = 'Clothes, traveler''s';
--> statement-breakpoint
UPDATE items SET name = 'Clothes - Traveler''s' WHERE name = 'Clothes, Traveler''s';
--> statement-breakpoint
UPDATE items SET name = 'Lantern - bullseye' WHERE name = 'Lantern, bullseye';
--> statement-breakpoint
UPDATE items SET name = 'Lantern - Bullseye' WHERE name = 'Lantern, Bullseye';
--> statement-breakpoint
UPDATE items SET name = 'Lantern - hooded' WHERE name = 'Lantern, hooded';
--> statement-breakpoint
UPDATE items SET name = 'Lantern - Hooded' WHERE name = 'Lantern, Hooded';
--> statement-breakpoint
UPDATE items SET name = 'Mirror - steel' WHERE name = 'Mirror, steel';
--> statement-breakpoint
UPDATE items SET name = 'Pick - miner''s' WHERE name = 'Pick, miner''s';
--> statement-breakpoint
UPDATE items SET name = 'Poison - basic (vial)' WHERE name = 'Poison, basic (vial)';
--> statement-breakpoint
UPDATE items SET name = 'Poison - Basic' WHERE name = 'Poison, Basic';
--> statement-breakpoint
UPDATE items SET name = 'Pot - iron' WHERE name = 'Pot, iron';
--> statement-breakpoint
UPDATE items SET name = 'Pot - Iron' WHERE name = 'Pot, Iron';
--> statement-breakpoint
UPDATE items SET name = 'Ram - portable' WHERE name = 'Ram, portable';
--> statement-breakpoint
UPDATE items SET name = 'Ram - Portable' WHERE name = 'Ram, Portable';
--> statement-breakpoint
UPDATE items SET name = 'Rope - hempen (50 feet)' WHERE name = 'Rope, hempen (50 feet)';
--> statement-breakpoint
UPDATE items SET name = 'Rope - silk (50 feet)' WHERE name = 'Rope, silk (50 feet)';
--> statement-breakpoint
UPDATE items SET name = 'Scale - merchant''s' WHERE name = 'Scale, merchant''s';
--> statement-breakpoint
UPDATE items SET name = 'Spell Scroll - Cantrip' WHERE name = 'Spell Scroll, Cantrip';
--> statement-breakpoint
UPDATE items SET name = 'Spell Scroll - Level 1' WHERE name = 'Spell Scroll, Level 1';
--> statement-breakpoint
UPDATE items SET name = 'Spike - iron' WHERE name = 'Spike, iron';
--> statement-breakpoint
UPDATE items SET name = 'Spikes - Iron' WHERE name = 'Spikes, Iron';
--> statement-breakpoint
UPDATE items SET name = 'Tent - two-person' WHERE name = 'Tent, two-person';
--> statement-breakpoint
UPDATE items SET name = 'Horse - draft' WHERE name = 'Horse, draft';
--> statement-breakpoint
UPDATE items SET name = 'Horse - riding' WHERE name = 'Horse, riding';
--> statement-breakpoint
UPDATE items SET name = 'Saddle - Exotic' WHERE name = 'Saddle, Exotic';
--> statement-breakpoint
UPDATE items SET name = 'Saddle - Military' WHERE name = 'Saddle, Military';
--> statement-breakpoint
UPDATE items SET name = 'Saddle - Pack' WHERE name = 'Saddle, Pack';
--> statement-breakpoint
UPDATE items SET name = 'Saddle - Riding' WHERE name = 'Saddle, Riding';
--> statement-breakpoint
UPDATE items SET name = 'Ammunition - +1, +2, or +3' WHERE name = 'Ammunition, +1, +2, or +3';
--> statement-breakpoint
UPDATE items SET name = 'Ammunition - +1' WHERE name = 'Ammunition, +1';
--> statement-breakpoint
UPDATE items SET name = 'Ammunition - +2' WHERE name = 'Ammunition, +2';
--> statement-breakpoint
UPDATE items SET name = 'Ammunition - +3' WHERE name = 'Ammunition, +3';
--> statement-breakpoint
UPDATE items SET name = 'Armor - +1, +2, or +3' WHERE name = 'Armor, +1, +2, or +3';
--> statement-breakpoint
UPDATE items SET name = 'Armor - +1' WHERE name = 'Armor, +1';
--> statement-breakpoint
UPDATE items SET name = 'Armor - +2' WHERE name = 'Armor, +2';
--> statement-breakpoint
UPDATE items SET name = 'Armor - +3' WHERE name = 'Armor, +3';
--> statement-breakpoint
UPDATE items SET name = 'Wand of the War Mage - +1, +2, or +3' WHERE name = 'Wand of the War Mage, +1, +2, or +3';
--> statement-breakpoint
UPDATE items SET name = 'Wand of the War Mage - +1' WHERE name = 'Wand of the War Mage, +1';
--> statement-breakpoint
UPDATE items SET name = 'Wand of the War Mage - +2' WHERE name = 'Wand of the War Mage, +2';
--> statement-breakpoint
UPDATE items SET name = 'Wand of the War Mage - +3' WHERE name = 'Wand of the War Mage, +3';
--> statement-breakpoint
UPDATE items SET name = 'Weapon - +1, +2, or +3' WHERE name = 'Weapon, +1, +2, or +3';
--> statement-breakpoint
UPDATE items SET name = 'Weapon - +1' WHERE name = 'Weapon, +1';
--> statement-breakpoint
UPDATE items SET name = 'Weapon - +2' WHERE name = 'Weapon, +2';
--> statement-breakpoint
UPDATE items SET name = 'Weapon - +3' WHERE name = 'Weapon, +3';
