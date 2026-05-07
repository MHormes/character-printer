"use client";

import type { CSSProperties } from "react";
import { useCharacterStore } from "@/lib/store/character-store";
import { CoreStatsWidget } from "./core-stats-widget";
import { InspirationWidget } from "./inspiration-widget";
import { ProficiencyWidget } from "./proficiency-widget";
import { SavingThrowsWidget } from "./saving-throws-widget";
import { SkillsWidget } from "./skills-widget";
import { PassivePerceptionWidget } from "./passive-perception-widget";
import { SlimToolProfWidget } from "./slim-tool-prof-widget";
import { SlimOtherProfWidget } from "./slim-other-prof-widget";
import { ArmorClassWidget } from "./armor-class-widget";
import { InitiativeWidget } from "./initiative-widget";
import { SpeedWidget } from "./speed-widget";
import { TrackerWidget } from "./tracker-widget";
import { CurrentHpWidget } from "./current-hp-widget";
import { TempHpWidget } from "./temp-hp-widget";
import { HitDiceWidget } from "./hit-dice-widget";
import { DeathSavesWidget } from "./death-saves-widget";
import { SlimAttacksWidget } from "./slim-attacks-widget";
import { FeaturesWidget } from "./features-widget";
import { EquipmentWidget } from "./equipment-widget";

// Mirrors TEMPLATE_PAGE1_WIDGETS exactly (28 cols × 40 rows, A4 ratio)
const C = 28;
const R = 40;

function slot(col: number, row: number, w: number, h: number): CSSProperties {
  return {
    position: "absolute",
    left: `${(col / C) * 100}%`,
    top: `${(row / R) * 100}%`,
    width: `${(w / C) * 100}%`,
    height: `${(h / R) * 100}%`,
  };
}

export function FullPageMainWidget() {
  const character = useCharacterStore((s) => s.character);
  if (!character) return null;

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div style={slot(0, 0, 3, 18)}><CoreStatsWidget /></div>
      <div style={slot(3, 0, 7, 2)}><InspirationWidget /></div>
      <div style={slot(3, 2, 7, 2)}><ProficiencyWidget /></div>
      <div style={slot(3, 4, 5, 4)}><SavingThrowsWidget /></div>
      <div style={slot(3, 8, 7, 13)}><SkillsWidget /></div>
      <div style={slot(0, 21, 8, 2)}><PassivePerceptionWidget /></div>
      <div style={slot(0, 23, 10, 3)}><SlimToolProfWidget /></div>
      <div style={slot(0, 26, 10, 4)}><SlimOtherProfWidget /></div>
      <div style={slot(10, 0, 3, 4)}><ArmorClassWidget /></div>
      <div style={slot(13, 0, 3, 4)}><InitiativeWidget /></div>
      <div style={slot(16, 0, 3, 4)}><SpeedWidget /></div>
      <div style={slot(19, 0, 6, 7)}><TrackerWidget /></div>
      <div style={slot(10, 4, 4, 4)}><CurrentHpWidget /></div>
      <div style={slot(15, 4, 4, 4)}><TempHpWidget /></div>
      <div style={slot(10, 8, 4, 4)}><HitDiceWidget /></div>
      <div style={slot(15, 8, 4, 4)}><DeathSavesWidget /></div>
      <div style={slot(10, 12, 9, 3)}><SlimAttacksWidget /></div>
      <div style={slot(19, 7, 6, 19)}><FeaturesWidget /></div>
      <div style={slot(10, 15, 9, 25)}><EquipmentWidget /></div>
    </div>
  );
}
