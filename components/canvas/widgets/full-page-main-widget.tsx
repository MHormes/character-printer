"use client";

import { useCharacterStore } from "@/lib/store/character-store";
import { CharacterNameWidget } from "./character-name-widget";
import { CharacterInfoDetailedWidget } from "./character-info-detailed-widget";
import { CoreStatsWidget } from "./core-stats-widget";
import { InspirationWidget } from "./inspiration-widget";
import { ProficiencyWidget } from "./proficiency-widget";
import { SavingThrowsWidget } from "./saving-throws-widget";
import { SkillsWidget } from "./skills-widget";
import { PassivePerceptionWidget } from "./passive-perception-widget";
import { ToolProficienciesWidget } from "./tool-proficiencies-widget";
import { OtherProficienciesWidget } from "./other-proficiencies-widget";
import { ArmorClassWidget } from "./armor-class-widget";
import { InitiativeWidget } from "./initiative-widget";
import { SpeedWidget } from "./speed-widget";
import { CurrentHpWidget } from "./current-hp-widget";
import { TempHpWidget } from "./temp-hp-widget";
import { HitDiceWidget } from "./hit-dice-widget";
import { DeathSavesWidget } from "./death-saves-widget";
import { AttacksWidget } from "./attacks-widget";
import { EquipmentWidget } from "./equipment-widget";
import { FeaturesWidget } from "./features-widget";
import { TrackersWidget } from "./tracker-widget";

export function FullPageMainWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  return (
    <div className="h-full w-full flex flex-col p-4 overflow-auto">
      {/* Top Section: Name and Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-1">
          <CharacterNameWidget />
        </div>
        <div className="col-span-1">
          <CharacterInfoDetailedWidget />
        </div>
      </div>

      {/* Middle Section: Core Stats, HP, AC, Initiative, Speed */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="col-span-1">
          <CoreStatsWidget />
        </div>
        <div className="col-span-1">
          <InspirationWidget />
        </div>
        <div className="col-span-1">
          <ProficiencyWidget />
        </div>
        <div className="col-span-1">
          <PassivePerceptionWidget />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="col-span-1">
          <ArmorClassWidget />
        </div>
        <div className="col-span-1">
          <InitiativeWidget />
        </div>
        <div className="col-span-1">
          <SpeedWidget />
        </div>
        <div className="col-span-2"> {/* colspan to make it wider */}
            <CurrentHpWidget />
            <TempHpWidget />
            <HitDiceWidget />
            <DeathSavesWidget />
        </div>
      </div>


      {/* Lower Section: Skills, Saves, Proficiencies, etc. */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-1">
          <SavingThrowsWidget />
        </div>
        <div className="col-span-1">
          <SkillsWidget />
        </div>
        <div className="col-span-1">
          <ToolProficienciesWidget />
          <OtherProficienciesWidget />
        </div>
      </div>

      {/* Bottom Section: Actions, Inventory, Features, Trackers */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-1">
          <AttacksWidget />
        </div>
        <div className="col-span-1">
          <EquipmentWidget />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-1">
          <FeaturesWidget />
        </div>
        <div className="col-span-1">
          <TrackersWidget />
        </div>
      </div>
    </div>
  );
}
