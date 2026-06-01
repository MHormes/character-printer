// Driver-agnostic table references.
// Import from here instead of schema.ts — picks sqlite or pg based on DB_DRIVER at runtime.
// TypeScript sees sqlite types (value-compatible with pg); Drizzle uses correct serialization per driver.

import {
  sqliteUsers, sqliteCharacters, sqliteCanvasTemplates,
  sqliteSpells, sqliteClasses, sqliteClassSpells, sqliteClassSpellSlots,
  sqliteRaces, sqliteSubraces, sqliteBackgrounds, sqliteItems,
  sqliteClassFeatures, sqliteRaceTraits, sqliteClassProficiencies,
  sqliteClassSkillChoices, sqliteLanguages, sqliteSubclasses, sqliteFeats,
  sqliteRaceAbilityBonuses, sqliteRaceAbilityBonusOptions,
  sqliteRaceSkillChoices, sqliteRaceLanguageChoices, sqliteRaceProficiencies,
  sqliteClassStartingEquipment, sqliteClassStartingEquipmentOptions,
  pgUsers, pgCharacters, pgCanvasTemplates,
  pgSpells, pgClasses, pgClassSpells, pgClassSpellSlots,
  pgRaces, pgSubraces, pgBackgrounds, pgItems,
  pgClassFeatures, pgRaceTraits, pgClassProficiencies,
  pgClassSkillChoices, pgLanguages, pgSubclasses, pgFeats,
  pgRaceAbilityBonuses, pgRaceAbilityBonusOptions,
  pgRaceSkillChoices, pgRaceLanguageChoices, pgRaceProficiencies,
  pgClassStartingEquipment, pgClassStartingEquipmentOptions,
} from "./schema";

const isPg = process.env.DB_DRIVER === "postgres";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pick<S, P>(s: S, p: P): S { return (isPg ? p : s) as any; }

export const dbUsers                         = pick(sqliteUsers,                         pgUsers);
export const dbCharacters                    = pick(sqliteCharacters,                    pgCharacters);
export const dbCanvasTemplates               = pick(sqliteCanvasTemplates,               pgCanvasTemplates);
export const dbSpells                        = pick(sqliteSpells,                        pgSpells);
export const dbClasses                       = pick(sqliteClasses,                       pgClasses);
export const dbClassSpells                   = pick(sqliteClassSpells,                   pgClassSpells);
export const dbClassSpellSlots               = pick(sqliteClassSpellSlots,               pgClassSpellSlots);
export const dbRaces                         = pick(sqliteRaces,                         pgRaces);
export const dbSubraces                      = pick(sqliteSubraces,                      pgSubraces);
export const dbBackgrounds                   = pick(sqliteBackgrounds,                   pgBackgrounds);
export const dbItems                         = pick(sqliteItems,                         pgItems);
export const dbClassFeatures                 = pick(sqliteClassFeatures,                 pgClassFeatures);
export const dbRaceTraits                    = pick(sqliteRaceTraits,                    pgRaceTraits);
export const dbClassProficiencies            = pick(sqliteClassProficiencies,            pgClassProficiencies);
export const dbClassSkillChoices             = pick(sqliteClassSkillChoices,             pgClassSkillChoices);
export const dbLanguages                     = pick(sqliteLanguages,                     pgLanguages);
export const dbSubclasses                    = pick(sqliteSubclasses,                    pgSubclasses);
export const dbFeats                         = pick(sqliteFeats,                         pgFeats);
export const dbRaceAbilityBonuses            = pick(sqliteRaceAbilityBonuses,            pgRaceAbilityBonuses);
export const dbRaceAbilityBonusOptions       = pick(sqliteRaceAbilityBonusOptions,       pgRaceAbilityBonusOptions);
export const dbRaceSkillChoices              = pick(sqliteRaceSkillChoices,              pgRaceSkillChoices);
export const dbRaceLanguageChoices           = pick(sqliteRaceLanguageChoices,           pgRaceLanguageChoices);
export const dbRaceProficiencies             = pick(sqliteRaceProficiencies,             pgRaceProficiencies);
export const dbClassStartingEquipment        = pick(sqliteClassStartingEquipment,        pgClassStartingEquipment);
export const dbClassStartingEquipmentOptions = pick(sqliteClassStartingEquipmentOptions, pgClassStartingEquipmentOptions);
