"use client";

import { useState, useEffect } from "react";
import {
  getClasses,
  getClassSpellSlots,
  getRaces,
  getSubraces,
  getSubclasses,
  getBackgrounds,
  getAllClassFeatures,
  getAllClassProficiencies,
  getAllRaceTraits,
  getAllClassSkillChoices,
  getAllRaceAbilityBonuses,
  getAllRaceAbilityBonusOptions,
  getAllRaceSkillChoices,
  getAllRaceLanguageChoices,
  getAllRaceProficiencies,
  getLanguages,
  getTools,
  getCantripsByClass,
  searchFeats,
  getAllClassStartingEquipment,
  getAllClassStartingEquipmentOptions,
} from "@/lib/actions/5e-data";
import type {
  ClassRow,
  RaceRow,
  SubraceRow,
  SubclassRow,
  BackgroundRow,
  SpellSlotRow,
  ItemRow,
  SpellRow,
  ClassFeatureRow,
  ClassProficiencyRow,
  RaceTraitRow,
  ClassSkillChoiceRow,
  FeatRow,
  RaceAbilityBonusRow,
  RaceAbilityBonusOptionRow,
  RaceSkillChoiceRow,
  RaceLanguageChoiceRow,
  RaceProficiencyRow,
  LanguageRow,
  ClassStartingEquipmentRow,
  ClassStartingEquipmentOptionRow,
} from "@/lib/actions/5e-data";

export type SrdData = {
  availableClasses: ClassRow[];
  availableSpellSlotRows: SpellSlotRow[];
  availableRaces: RaceRow[];
  availableSubraces: SubraceRow[];
  availableSubclasses: SubclassRow[];
  availableBackgrounds: BackgroundRow[];
  allClassFeatureRows: ClassFeatureRow[];
  allClassProfRows: ClassProficiencyRow[];
  allRaceTraitRows: RaceTraitRow[];
  allClassSkillChoiceRows: ClassSkillChoiceRow[];
  allRaceAsiBonusRows: RaceAbilityBonusRow[];
  allRaceAsiOptionRows: RaceAbilityBonusOptionRow[];
  allRaceSkillChoiceRows: RaceSkillChoiceRow[];
  allRaceLanguageChoiceRows: RaceLanguageChoiceRow[];
  allRaceProficiencyRows: RaceProficiencyRow[];
  availableLanguages: LanguageRow[];
  availableTools: ItemRow[];
  availableFeats: FeatRow[];
  allClassStartEquipRows: ClassStartingEquipmentRow[];
  allClassStartEquipOptionRows: ClassStartingEquipmentOptionRow[];
  availableRaceCantrips: SpellRow[];
};

export function useSrdData(
  srdSystem: string | null,
  characterRace: string,
  characterSubrace: string,
): SrdData {
  const [availableClasses, setAvailableClasses] = useState<ClassRow[]>([]);
  const [availableSpellSlotRows, setAvailableSpellSlotRows] = useState<SpellSlotRow[]>([]);
  const [availableRaces, setAvailableRaces] = useState<RaceRow[]>([]);
  const [availableSubraces, setAvailableSubraces] = useState<SubraceRow[]>([]);
  const [availableSubclasses, setAvailableSubclasses] = useState<SubclassRow[]>([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundRow[]>([]);
  const [allClassFeatureRows, setAllClassFeatureRows] = useState<ClassFeatureRow[]>([]);
  const [allClassProfRows, setAllClassProfRows] = useState<ClassProficiencyRow[]>([]);
  const [allRaceTraitRows, setAllRaceTraitRows] = useState<RaceTraitRow[]>([]);
  const [allClassSkillChoiceRows, setAllClassSkillChoiceRows] = useState<ClassSkillChoiceRow[]>([]);
  const [allRaceAsiBonusRows, setAllRaceAsiBonusRows] = useState<RaceAbilityBonusRow[]>([]);
  const [allRaceAsiOptionRows, setAllRaceAsiOptionRows] = useState<RaceAbilityBonusOptionRow[]>([]);
  const [allRaceSkillChoiceRows, setAllRaceSkillChoiceRows] = useState<RaceSkillChoiceRow[]>([]);
  const [allRaceLanguageChoiceRows, setAllRaceLanguageChoiceRows] = useState<RaceLanguageChoiceRow[]>([]);
  const [allRaceProficiencyRows, setAllRaceProficiencyRows] = useState<RaceProficiencyRow[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageRow[]>([]);
  const [availableTools, setAvailableTools] = useState<ItemRow[]>([]);
  const [availableFeats, setAvailableFeats] = useState<FeatRow[]>([]);
  const [allClassStartEquipRows, setAllClassStartEquipRows] = useState<ClassStartingEquipmentRow[]>([]);
  const [allClassStartEquipOptionRows, setAllClassStartEquipOptionRows] = useState<ClassStartingEquipmentOptionRow[]>([]);
  const [availableRaceCantrips, setAvailableRaceCantrips] = useState<SpellRow[]>([]);

  useEffect(() => {
    if (!srdSystem) return;
    getClasses(srdSystem).then(setAvailableClasses);
    getClassSpellSlots(srdSystem).then(setAvailableSpellSlotRows);
    getRaces(srdSystem).then(setAvailableRaces);
    getSubraces(undefined, srdSystem).then(setAvailableSubraces);
    getSubclasses(undefined, srdSystem).then(setAvailableSubclasses);
    getBackgrounds(srdSystem).then(setAvailableBackgrounds);
    getAllClassFeatures(srdSystem).then(setAllClassFeatureRows);
    getAllClassProficiencies(srdSystem).then(setAllClassProfRows);
    getAllRaceTraits(srdSystem).then(setAllRaceTraitRows);
    getAllClassSkillChoices(srdSystem).then(setAllClassSkillChoiceRows);
    getAllRaceAbilityBonuses(srdSystem).then(setAllRaceAsiBonusRows);
    getAllRaceAbilityBonusOptions(srdSystem).then(setAllRaceAsiOptionRows);
    getAllRaceSkillChoices(srdSystem).then(setAllRaceSkillChoiceRows);
    getAllRaceLanguageChoices(srdSystem).then(setAllRaceLanguageChoiceRows);
    getAllRaceProficiencies(srdSystem).then(setAllRaceProficiencyRows);
    getLanguages(srdSystem).then(setAvailableLanguages);
    getTools(srdSystem).then(setAvailableTools);
    searchFeats(undefined, srdSystem).then(setAvailableFeats);
    getAllClassStartingEquipment(srdSystem).then(setAllClassStartEquipRows);
    getAllClassStartingEquipmentOptions(srdSystem).then(setAllClassStartEquipOptionRows);
  }, [srdSystem]);

  useEffect(() => {
    if (availableRaces.length === 0) return;
    const matchedRace = characterRace
      ? availableRaces.find((r) => r.name.toLowerCase() === characterRace.toLowerCase())
      : undefined;
    const matchedSubrace = characterSubrace && availableSubraces.length > 0
      ? availableSubraces.find((s) => s.name.toLowerCase() === characterSubrace.toLowerCase())
      : undefined;
    const needsCantrips = !!(matchedRace?.cantripChoicesJson || matchedSubrace?.cantripChoicesJson);
    if (!needsCantrips) { Promise.resolve().then(() => setAvailableRaceCantrips([])); return; }
    const json = matchedSubrace?.cantripChoicesJson ?? matchedRace?.cantripChoicesJson;
    let classId = "dnd5e:wizard";
    try { const parsed = JSON.parse(json!); if (parsed[0]?.classId) classId = parsed[0].classId; } catch { /* ignore */ }
    getCantripsByClass(classId).then(setAvailableRaceCantrips);
  }, [characterRace, characterSubrace, availableRaces, availableSubraces]);

  return {
    availableClasses,
    availableSpellSlotRows,
    availableRaces,
    availableSubraces,
    availableSubclasses,
    availableBackgrounds,
    allClassFeatureRows,
    allClassProfRows,
    allRaceTraitRows,
    allClassSkillChoiceRows,
    allRaceAsiBonusRows,
    allRaceAsiOptionRows,
    allRaceSkillChoiceRows,
    allRaceLanguageChoiceRows,
    allRaceProficiencyRows,
    availableLanguages,
    availableTools,
    availableFeats,
    allClassStartEquipRows,
    allClassStartEquipOptionRows,
    availableRaceCantrips,
  };
}
