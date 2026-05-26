"use client";

import type { WidgetType } from "@/lib/types/canvas";
import { CoreStatsWidget } from "@/components/canvas/widgets/core-stats-widget";
import { InspirationWidget } from "@/components/canvas/widgets/inspiration-widget";
import { ProficiencyWidget } from "@/components/canvas/widgets/proficiency-widget";
import { SavingThrowsWidget } from "@/components/canvas/widgets/saving-throws-widget";
import { SkillsWidget } from "@/components/canvas/widgets/skills-widget";
import { PassivePerceptionWidget } from "@/components/canvas/widgets/passive-perception-widget";
import { ToolProficienciesWidget } from "@/components/canvas/widgets/tool-proficiencies-widget";
import { OtherProficienciesWidget } from "@/components/canvas/widgets/other-proficiencies-widget";
import { SlimToolProfWidget } from "@/components/canvas/widgets/slim-tool-prof-widget";
import { SlimOtherProfWidget } from "@/components/canvas/widgets/slim-other-prof-widget";
import { ArmorClassWidget } from "@/components/canvas/widgets/armor-class-widget";
import { InitiativeWidget } from "@/components/canvas/widgets/initiative-widget";
import { SpeedWidget } from "@/components/canvas/widgets/speed-widget";
import { CurrentHpWidget } from "@/components/canvas/widgets/current-hp-widget";
import { TempHpWidget } from "@/components/canvas/widgets/temp-hp-widget";
import { HitDiceWidget } from "@/components/canvas/widgets/hit-dice-widget";
import { DeathSavesWidget } from "@/components/canvas/widgets/death-saves-widget";
import { AttacksWidget } from "@/components/canvas/widgets/attacks-widget";
import { SlimAttacksWidget } from "@/components/canvas/widgets/slim-attacks-widget";
import { EquipmentWidget } from "@/components/canvas/widgets/equipment-widget";
import { TrackerWidget } from "@/components/canvas/widgets/tracker-widget";
import { FeaturesWidget } from "@/components/canvas/widgets/features-widget";
import { FeatureCardWidget } from "@/components/canvas/widgets/feature-card-widget";
import { SpellCardWidget } from "@/components/canvas/widgets/spell-card-widget";
import { SpellcastingInfoWidget } from "@/components/canvas/widgets/spellcasting-info-widget";
import {
  SpellLevel0Widget, SpellLevel1Widget, SpellLevel2Widget, SpellLevel3Widget,
  SpellLevel4Widget, SpellLevel5Widget, SpellLevel6Widget, SpellLevel7Widget,
  SpellLevel8Widget, SpellLevel9Widget,
} from "@/components/canvas/widgets/spell-level-widget";
import { CharacterNameWidget } from "@/components/canvas/widgets/character-name-widget";
import { CharacterInfoDetailedWidget } from "@/components/canvas/widgets/character-info-detailed-widget";
import { CharacterInfoCompactWidget } from "@/components/canvas/widgets/character-info-compact-widget";
import { CharacterAppearanceWidget } from "@/components/canvas/widgets/character-appearance-widget";
import { CharacterPortraitWidget } from "@/components/canvas/widgets/character-portrait-widget";
import { StatBoxWidget } from "@/components/canvas/widgets/stat-box-widget"
import { SingleTrackerWidget } from "@/components/canvas/widgets/single-tracker-widget";
import { CharacteristicsWidget } from "@/components/canvas/widgets/characteristics-widget";
import { CharacteristicCardWidget } from "@/components/canvas/widgets/characteristic-card-widget";
import { BioTextWidget } from "@/components/canvas/widgets/bio-text-widget";
import { FullPageBioWidget } from "@/components/canvas/widgets/full-page-bio-widget";

function WidgetPreviewContent({ type }: { type: WidgetType }) {
  if (type === "CoreStats")              return <CoreStatsWidget />;
  if (type === "Inspiration")            return <InspirationWidget />;
  if (type === "Proficiency")            return <ProficiencyWidget />;
  if (type === "SavingThrows")           return <SavingThrowsWidget />;
  if (type === "Skills")                 return <SkillsWidget />;
  if (type === "PassivePerception")      return <PassivePerceptionWidget />;
  if (type === "ToolProficiencies")      return <ToolProficienciesWidget />;
  if (type === "OtherProficiencies")     return <OtherProficienciesWidget />;
  if (type === "SlimToolProf")           return <SlimToolProfWidget />;
  if (type === "SlimOtherProf")          return <SlimOtherProfWidget />;
  if (type === "ArmorClass")             return <ArmorClassWidget />;
  if (type === "Initiative")             return <InitiativeWidget />;
  if (type === "Speed")                  return <SpeedWidget />;
  if (type === "CurrentHp")             return <CurrentHpWidget />;
  if (type === "TempHp")                return <TempHpWidget />;
  if (type === "HitDice")               return <HitDiceWidget />;
  if (type === "DeathSaves")            return <DeathSavesWidget />;
  if (type === "Attacks")               return <AttacksWidget />;
  if (type === "SlimAttacks")           return <SlimAttacksWidget />;
  if (type === "Equipment")             return <EquipmentWidget />;
  if (type === "Trackers")              return <TrackerWidget />;
  if (type === "Features")              return <FeaturesWidget />;
  if (type === "FeatureCard")           return <FeatureCardWidget />;
  if (type === "SpellcastingInfo")      return <SpellcastingInfoWidget />;
  if (type === "SpellLevel0")           return <SpellLevel0Widget />;
  if (type === "SpellLevel1")           return <SpellLevel1Widget />;
  if (type === "SpellLevel2")           return <SpellLevel2Widget />;
  if (type === "SpellLevel3")           return <SpellLevel3Widget />;
  if (type === "SpellLevel4")           return <SpellLevel4Widget />;
  if (type === "SpellLevel5")           return <SpellLevel5Widget />;
  if (type === "SpellLevel6")           return <SpellLevel6Widget />;
  if (type === "SpellLevel7")           return <SpellLevel7Widget />;
  if (type === "SpellLevel8")           return <SpellLevel8Widget />;
  if (type === "SpellLevel9")           return <SpellLevel9Widget />;
  if (type === "CharacterName")         return <CharacterNameWidget />;
  if (type === "CharacterInfoDetailed") return <CharacterInfoDetailedWidget />;
  if (type === "CharacterInfoCompact")  return <CharacterInfoCompactWidget />;
  if (type === "CharacterAppearance")   return <CharacterAppearanceWidget />;
  if (type === "CharacterPortrait")     return <CharacterPortraitWidget />;
  if (type === "SpellCard")             return <SpellCardWidget />;
  if (type === "StatBox")               return <StatBoxWidget />;
  if (type === "TrackerCard")           return <SingleTrackerWidget />;
  if (type === "Characteristics")       return <CharacteristicsWidget />;
  if (type === "CharacteristicCard")    return <CharacteristicCardWidget />;
  if (type === "BioText")               return <BioTextWidget />;
  if (type === "FullPageBio")           return <FullPageBioWidget />;
  return null;
}

type WidgetPreviewProps = {
  type: WidgetType;
  w: number;
  h: number;
};

export function WidgetPreview({ type, w, h }: WidgetPreviewProps) {
  return (
    <div
      style={{
        aspectRatio: `${w}/${h}`,
        maxWidth: "100%",
        maxHeight: "100%",
        pointerEvents: "none",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <WidgetPreviewContent type={type} />
    </div>
  );
}
