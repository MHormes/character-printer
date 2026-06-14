/**
 * Directly applies SRD item renames to dev.db via libSQL.
 * Run when migration file didn't apply all statements.
 */

import { createClient } from "@libsql/client";

const client = createClient({ url: "file:dev.db" });

const renames = [
  ["Crossbow, light",                  "Crossbow - light"],
  ["Crossbow, hand",                   "Crossbow - hand"],
  ["Crossbow, heavy",                  "Crossbow - heavy"],
  ["Hammer, sledge",                   "Hammer - sledge"],
  ["Bottle, glass",                    "Bottle - glass"],
  ["Bottle, Glass",                    "Bottle - Glass"],
  ["Bullets, Firearm",                 "Bullets - Firearm"],
  ["Bullets, Sling",                   "Bullets - Sling"],
  ["Case, crossbow bolt",              "Case - crossbow bolt"],
  ["Case, map or scroll",              "Case - map or scroll"],
  ["Case, Crossbow Bolt",              "Case - Crossbow Bolt"],
  ["Case, Map or Scroll",              "Case - Map or Scroll"],
  ["Clothes, common",                  "Clothes - common"],
  ["Clothes, costume",                 "Clothes - costume"],
  ["Clothes, fine",                    "Clothes - fine"],
  ["Clothes, Fine",                    "Clothes - Fine"],
  ["Clothes, traveler's",              "Clothes - traveler's"],
  ["Clothes, Traveler's",              "Clothes - Traveler's"],
  ["Lantern, bullseye",                "Lantern - bullseye"],
  ["Lantern, Bullseye",                "Lantern - Bullseye"],
  ["Lantern, hooded",                  "Lantern - hooded"],
  ["Lantern, Hooded",                  "Lantern - Hooded"],
  ["Mirror, steel",                    "Mirror - steel"],
  ["Pick, miner's",                    "Pick - miner's"],
  ["Poison, basic (vial)",             "Poison - basic (vial)"],
  ["Poison, Basic",                    "Poison - Basic"],
  ["Pot, iron",                        "Pot - iron"],
  ["Pot, Iron",                        "Pot - Iron"],
  ["Ram, portable",                    "Ram - portable"],
  ["Ram, Portable",                    "Ram - Portable"],
  ["Rope, hempen (50 feet)",           "Rope - hempen (50 feet)"],
  ["Rope, silk (50 feet)",             "Rope - silk (50 feet)"],
  ["Scale, merchant's",                "Scale - merchant's"],
  ["Spell Scroll, Cantrip",            "Spell Scroll - Cantrip"],
  ["Spell Scroll, Level 1",            "Spell Scroll - Level 1"],
  ["Spike, iron",                      "Spike - iron"],
  ["Spikes, Iron",                     "Spikes - Iron"],
  ["Tent, two-person",                 "Tent - two-person"],
  ["Horse, draft",                     "Horse - draft"],
  ["Horse, riding",                    "Horse - riding"],
  ["Saddle, Exotic",                   "Saddle - Exotic"],
  ["Saddle, Military",                 "Saddle - Military"],
  ["Saddle, Pack",                     "Saddle - Pack"],
  ["Saddle, Riding",                   "Saddle - Riding"],
  ["Ammunition, +1, +2, or +3",        "Ammunition - +1, +2, or +3"],
  ["Ammunition, +1",                   "Ammunition - +1"],
  ["Ammunition, +2",                   "Ammunition - +2"],
  ["Ammunition, +3",                   "Ammunition - +3"],
  ["Armor, +1, +2, or +3",             "Armor - +1, +2, or +3"],
  ["Armor, +1",                        "Armor - +1"],
  ["Armor, +2",                        "Armor - +2"],
  ["Armor, +3",                        "Armor - +3"],
  ["Wand of the War Mage, +1, +2, or +3", "Wand of the War Mage - +1, +2, or +3"],
  ["Wand of the War Mage, +1",         "Wand of the War Mage - +1"],
  ["Wand of the War Mage, +2",         "Wand of the War Mage - +2"],
  ["Wand of the War Mage, +3",         "Wand of the War Mage - +3"],
  ["Weapon, +1, +2, or +3",            "Weapon - +1, +2, or +3"],
  ["Weapon, +1",                       "Weapon - +1"],
  ["Weapon, +2",                       "Weapon - +2"],
  ["Weapon, +3",                       "Weapon - +3"],
];

let updated = 0;
for (const [from, to] of renames) {
  const result = await client.execute({
    sql: "UPDATE items SET name = ? WHERE name = ?",
    args: [to, from],
  });
  if (result.rowsAffected > 0) {
    console.log(`  ${result.rowsAffected}x  "${from}" → "${to}"`);
    updated += result.rowsAffected;
  }
}

console.log(`\nTotal rows updated: ${updated}`);

const remaining = await client.execute(
  "SELECT COUNT(*) as n FROM items WHERE name LIKE '%,%' AND name NOT LIKE '%ball%' AND name NOT LIKE '%Ball%'"
);
console.log("Remaining non-ball comma items:", remaining.rows[0].n);
