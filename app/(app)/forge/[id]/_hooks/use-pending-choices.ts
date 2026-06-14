"use client";

import { useMemo } from "react";
import type { CharacterData } from "@/lib/types/character";
import type { SrdData } from "./use-srd-data";
import {
  derivePendingChoices,
  deriveRacePendingChoices,
  deriveRaceLanguagePendingChoices,
  deriveRaceToolPendingChoices,
  deriveRaceCantripPendingChoices,
  deriveEquipmentPendingChoices,
  deriveBackgroundPendingChoices,
  type PendingChoice,
  type RacePendingChoice,
  type RaceLanguagePendingChoice,
  type RaceToolPendingChoice,
  type RaceCantripPendingChoice,
  type EquipmentPendingChoice,
  type BackgroundPendingChoice,
} from "@/lib/character/derive-pending-choices";
import {
  deriveMulticlassWarnings,
  getMulticlassWarningKey,
  type MulticlassWarning,
} from "@/lib/character/multiclass-prereqs";

type SrdSlice = Pick<
  SrdData,
  | "availableRaces"
  | "availableSubraces"
  | "availableBackgrounds"
  | "availableRaceCantrips"
  | "allClassFeatureRows"
  | "allClassSkillChoiceRows"
  | "allClassStartEquipOptionRows"
  | "allRaceAsiOptionRows"
  | "allRaceSkillChoiceRows"
  | "allRaceLanguageChoiceRows"
>;

export type PendingChoicesResult = {
  pendingChoices: PendingChoice[];
  equipmentPendingChoices: EquipmentPendingChoice[];
  multiclassWarnings: MulticlassWarning[];
  racePendingChoices: RacePendingChoice[];
  raceLanguagePendingChoices: RaceLanguagePendingChoice[];
  raceToolPendingChoices: RaceToolPendingChoice[];
  raceCantripPendingChoices: RaceCantripPendingChoice[];
  backgroundPendingChoices: BackgroundPendingChoice[];
};

export function usePendingChoices(
  character: CharacterData | null,
  srd: SrdSlice,
): PendingChoicesResult {
  const matchedRace = useMemo(
    () =>
      character?.identity.race && srd.availableRaces.length > 0
        ? srd.availableRaces.find(
            (r) => r.name.toLowerCase() === character.identity.race.toLowerCase(),
          )
        : undefined,
    [character, srd.availableRaces],
  );

  const matchedSubrace = useMemo(
    () =>
      character?.identity.subrace && srd.availableSubraces.length > 0
        ? srd.availableSubraces.find(
            (s) => s.name.toLowerCase() === character.identity.subrace!.toLowerCase(),
          )
        : undefined,
    [character, srd.availableSubraces],
  );

  const pendingChoices = useMemo<PendingChoice[]>(() => {
    if (!character || srd.allClassFeatureRows.length === 0 || srd.allClassSkillChoiceRows.length === 0) return [];
    return derivePendingChoices(character, character.identity.classes, srd.allClassFeatureRows, srd.allClassSkillChoiceRows);
  }, [character, srd.allClassFeatureRows, srd.allClassSkillChoiceRows]);

  const equipmentPendingChoices = useMemo<EquipmentPendingChoice[]>(() => {
    if (!character || srd.allClassStartEquipOptionRows.length === 0) return [];
    return deriveEquipmentPendingChoices(character, character.identity.classes, srd.allClassStartEquipOptionRows);
  }, [character, srd.allClassStartEquipOptionRows]);

  const multiclassWarnings = useMemo<MulticlassWarning[]>(() => {
    if (!character) return [];
    const dismissed = character.dismissedMulticlassWarningKeys ?? [];
    return deriveMulticlassWarnings(character.identity.classes, character.attributes)
      .filter((w) => !dismissed.includes(getMulticlassWarningKey(w.classId)));
  }, [character]);

  const racePendingChoices = useMemo<RacePendingChoice[]>(() => {
    if (!character || srd.availableRaces.length === 0) return [];
    return deriveRacePendingChoices(character, matchedRace, srd.allRaceAsiOptionRows, srd.allRaceSkillChoiceRows);
  }, [character, matchedRace, srd.availableRaces, srd.allRaceAsiOptionRows, srd.allRaceSkillChoiceRows]);

  const raceLanguagePendingChoices = useMemo<RaceLanguagePendingChoice[]>(() => {
    if (!character || srd.availableRaces.length === 0) return [];
    return deriveRaceLanguagePendingChoices(character, matchedRace, matchedSubrace, srd.allRaceLanguageChoiceRows);
  }, [character, matchedRace, matchedSubrace, srd.availableRaces, srd.allRaceLanguageChoiceRows]);

  const raceToolPendingChoices = useMemo<RaceToolPendingChoice[]>(() => {
    if (!character || srd.availableRaces.length === 0) return [];
    return deriveRaceToolPendingChoices(character, matchedRace, matchedSubrace);
  }, [character, matchedRace, matchedSubrace, srd.availableRaces]);

  const raceCantripPendingChoices = useMemo<RaceCantripPendingChoice[]>(() => {
    if (!character || srd.availableRaces.length === 0) return [];
    return deriveRaceCantripPendingChoices(character, matchedRace, matchedSubrace, srd.availableRaceCantrips);
  }, [character, matchedRace, matchedSubrace, srd.availableRaces, srd.availableRaceCantrips]);

  const backgroundPendingChoices = useMemo<BackgroundPendingChoice[]>(() => {
    if (!character || srd.availableBackgrounds.length === 0) return [];
    const matchedBg = character.identity.background
      ? srd.availableBackgrounds.find((b) => b.name.toLowerCase() === character.identity.background.toLowerCase())
      : undefined;
    return deriveBackgroundPendingChoices(character, matchedBg);
  }, [character, srd.availableBackgrounds]);

  return {
    pendingChoices,
    equipmentPendingChoices,
    multiclassWarnings,
    racePendingChoices,
    raceLanguagePendingChoices,
    raceToolPendingChoices,
    raceCantripPendingChoices,
    backgroundPendingChoices,
  };
}
