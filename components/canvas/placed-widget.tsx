"use client";

import { useDraggable } from "@dnd-kit/core";
import { Lock, Unlock, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import type { CanvasWidget, WidgetType } from "@/lib/types/canvas";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useCharacterStore } from "@/lib/store/character-store";
import { searchSpells } from "@/lib/actions/5e-data";
import type { SpellRow } from "@/lib/actions/5e-data";
import { featureCardGridH } from "@/components/canvas/widgets/feature-card-widget";
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
import { FullPageFeaturesWidget } from "@/components/canvas/widgets/full-page-features-widget";
import { FullPageMainWidget } from "@/components/canvas/widgets/full-page-main-widget";
import { FullPageSpellCardWidget } from "@/components/canvas/widgets/full-page-spell-cards-widget"
import { SpellCardWidget } from "@/components/canvas/widgets/spell-card-widget";
import { SpellcastingInfoWidget } from "@/components/canvas/widgets/spellcasting-info-widget";
import {
  SpellLevel0Widget, SpellLevel1Widget, SpellLevel2Widget, SpellLevel3Widget,
  SpellLevel4Widget, SpellLevel5Widget, SpellLevel6Widget, SpellLevel7Widget,
  SpellLevel8Widget, SpellLevel9Widget,
} from "@/components/canvas/widgets/spell-level-widget";
import { FullPageSpellSheetWidget } from "@/components/canvas/widgets/full-page-spell-sheet-widget";
import { CharacterNameWidget } from "@/components/canvas/widgets/character-name-widget";
import { CharacterInfoDetailedWidget } from "@/components/canvas/widgets/character-info-detailed-widget";
import { CharacterInfoCompactWidget } from "@/components/canvas/widgets/character-info-compact-widget";
import { CharacterAppearanceWidget } from "@/components/canvas/widgets/character-appearance-widget";
import { CharacterPortraitWidget } from "@/components/canvas/widgets/character-portrait-widget";
import { StatBoxWidget } from "@/components/canvas/widgets/stat-box-widget"
import { SingleTrackerWidget } from "@/components/canvas/widgets/single-tracker-widget";
import { CharacteristicsWidget } from "@/components/canvas/widgets/characteristics-widget";
import { CharacteristicCardWidget, characteristicCardSvgH, CHAR_CARD_SOURCES } from "@/components/canvas/widgets/characteristic-card-widget";
import { BioTextWidget, bioTextSvgH, BIO_SOURCES } from "@/components/canvas/widgets/bio-text-widget";
import { FullPageBioWidget } from "@/components/canvas/widgets/full-page-bio-widget";

function WidgetContent({ type, spellId, spellStartIndex, spellCount, featureId, statId, trackerId, textSource }: { type: WidgetType; spellId?: string; spellStartIndex?: number; spellCount?: number; featureId?: string; statId?: string; trackerId?: string; textSource?: string }) {
  if (type === "CoreStats") return <CoreStatsWidget />;
  if (type === "Inspiration") return <InspirationWidget />;
  if (type === "Proficiency") return <ProficiencyWidget />;
  if (type === "SavingThrows") return <SavingThrowsWidget />;
  if (type === "Skills") return <SkillsWidget />;
  if (type === "PassivePerception") return <PassivePerceptionWidget />;
  if (type === "ToolProficiencies") return <ToolProficienciesWidget />;
  if (type === "OtherProficiencies") return <OtherProficienciesWidget />;
  if (type === "SlimToolProf") return <SlimToolProfWidget />;
  if (type === "SlimOtherProf") return <SlimOtherProfWidget />;
  if (type === "ArmorClass") return <ArmorClassWidget />;
  if (type === "Initiative") return <InitiativeWidget />;
  if (type === "Speed") return <SpeedWidget />;
  if (type === "CurrentHp") return <CurrentHpWidget />;
  if (type === "TempHp") return <TempHpWidget />;
  if (type === "HitDice") return <HitDiceWidget />;
  if (type === "DeathSaves") return <DeathSavesWidget />;
  if (type === "Attacks") return <AttacksWidget />;
  if (type === "SlimAttacks") return <SlimAttacksWidget />;
  if (type === "Equipment") return <EquipmentWidget />;
  if (type === "Trackers") return <TrackerWidget />;
  if (type === "Features") return <FeaturesWidget />;
  if (type === "FeatureCard") return <FeatureCardWidget featureId={featureId} />;
  if (type === "FullPageMain")        return <FullPageMainWidget />;
  if (type === "FullPageFeatures")   return <FullPageFeaturesWidget />;
  if (type === "FullPageSpells")     return <FullPageSpellCardWidget startIndex={spellStartIndex} count={spellCount} />;
  if (type === "SpellcastingInfo")   return <SpellcastingInfoWidget />;
  if (type === "SpellLevel0")        return <SpellLevel0Widget />;
  if (type === "SpellLevel1")        return <SpellLevel1Widget />;
  if (type === "SpellLevel2")        return <SpellLevel2Widget />;
  if (type === "SpellLevel3")        return <SpellLevel3Widget />;
  if (type === "SpellLevel4")        return <SpellLevel4Widget />;
  if (type === "SpellLevel5")        return <SpellLevel5Widget />;
  if (type === "SpellLevel6")        return <SpellLevel6Widget />;
  if (type === "SpellLevel7")        return <SpellLevel7Widget />;
  if (type === "SpellLevel8")        return <SpellLevel8Widget />;
  if (type === "SpellLevel9")        return <SpellLevel9Widget />;
  if (type === "FullPageSpellSheet") return <FullPageSpellSheetWidget />;
  if (type === "CharacterName") return <CharacterNameWidget />;
  if (type === "CharacterInfoDetailed") return <CharacterInfoDetailedWidget />;
  if (type === "CharacterInfoCompact") return <CharacterInfoCompactWidget />;
  if (type === "CharacterAppearance") return <CharacterAppearanceWidget />;
  if (type === "CharacterPortrait") return <CharacterPortraitWidget />;
  if (type === "SpellCard") return <SpellCardWidget spellId={spellId} />;
  if (type === "StatBox") return <StatBoxWidget statId={statId} />;
  if (type === "TrackerCard") return <SingleTrackerWidget trackerId={trackerId} />;
  if (type === "Characteristics") return <CharacteristicsWidget />;
  if (type === "CharacteristicCard") return <CharacteristicCardWidget source={textSource} />;
  if (type === "BioText") return <BioTextWidget source={textSource} />;
  if (type === "FullPageBio") return <FullPageBioWidget />;
  if (type === "TemplatePage1") return null;
  if (type === "TemplatePage2") return null;
  if (type === "TemplateSpellCards") return null;
  if (type === "TemplateFeatures") return null;
  if (type === "TemplateBio") return null;
  return null;
}

type Props = {
  widget: CanvasWidget;
  cols: number;
  rows: number;
  selected: boolean;
  isToolbarHost: boolean;
  printMode?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onRotate: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
};

export function PlacedWidget({
  widget,
  cols,
  rows,
  selected,
  isToolbarHost,
  printMode,
  onSelect,
  onToggleLock,
  onDelete,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const updateWidgetData = useCanvasStore((s) => s.updateWidgetData);
  const character = useCharacterStore((s) => s.character);
  const charSpells = character?.spells.list ?? [];
  const features = useCharacterStore((s) => s.character?.features ?? []);
  const statBoxes = useCharacterStore((s) => s.character?.statBoxes ?? []);
  const trackers = useCharacterStore((s) => s.character?.trackers ?? []);

  const [spellSearch, setSpellSearch] = useState("");
  const [spellResults, setSpellResults] = useState<SpellRow[]>([]);

  const q = spellSearch.toLowerCase();
  const filteredCharSpells = charSpells
    .filter((s) => !q || s.name.toLowerCase().includes(q))
    .sort((a, b) => a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name));
  const charSpellNames = new Set(charSpells.map((s) => s.name.toLowerCase()));
  const dedupedDbSpells = spellResults.filter((s) => !charSpellNames.has(s.name.toLowerCase()));


  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setSpellSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen || widget.type !== "SpellCard") return;
    const t = setTimeout(() => {
      searchSpells({ name: spellSearch || undefined }).then(setSpellResults);
    }, 200);
    return () => clearTimeout(t);
  }, [pickerOpen, spellSearch, widget.type]);

  const { setNodeRef, listeners, attributes, isDragging } =
    useDraggable({
      id: widget.id,
      data: { source: "canvas", widgetId: widget.id },
      disabled: widget.locked || !!printMode,
    });

  const posStyle: React.CSSProperties = {
    position: "absolute",
    left: `${(widget.col / cols) * 100}%`,
    top: `${(widget.row / rows) * 100}%`,
    width: `${(widget.w / cols) * 100}%`,
    height: `${(widget.h / rows) * 100}%`,
  };

  if (printMode) {
    if (
      widget.type === "FullPageMain" ||
      widget.type === "FullPageFeatures" ||
      widget.type === "FullPageSpells" ||
      widget.type === "FullPageSpellSheet" ||
      widget.type === "FullPageBio"
    ) {
      return <WidgetContent type={widget.type} spellId={widget.spellId} spellStartIndex={widget.spellStartIndex} spellCount={widget.spellCount} featureId={widget.featureId} statId={widget.statId} trackerId={widget.trackerId} textSource={widget.textSource} />;
    }
    return (
      <div style={posStyle} className="overflow-hidden">
        <WidgetContent type={widget.type} spellId={widget.spellId} spellStartIndex={widget.spellStartIndex} spellCount={widget.spellCount} featureId={widget.featureId} statId={widget.statId} trackerId={widget.trackerId} textSource={widget.textSource} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...(widget.locked ? {} : listeners)}
      {...attributes}
      style={{
        ...posStyle,
        zIndex: selected ? 30 : 1,
        opacity: isDragging ? 0.25 : 1,
      }}
      onClick={onSelect}
    >
      <div
        className={cn(
          "relative h-full w-full rounded border-2 bg-card/80 transition-colors overflow-hidden",
          selected ? "border-primary" : "border-border",
          !widget.locked && "cursor-grab active:cursor-grabbing",
        )}
      >
        <WidgetContent type={widget.type} spellId={widget.spellId} spellStartIndex={widget.spellStartIndex} spellCount={widget.spellCount} featureId={widget.featureId} statId={widget.statId} trackerId={widget.trackerId} textSource={widget.textSource} />
        {widget.locked && (
          <Lock className="absolute left-1 top-1 size-3 text-muted-foreground" />
        )}
        {selected && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded bg-primary/15" />
        )}
      </div>

      {isToolbarHost && (
        <div className="absolute -top-7 left-0 z-20 flex items-center gap-0.5 rounded border border-border bg-card px-1 py-0.5 shadow-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            title={widget.locked ? "Unlock" : "Lock"}
          >
            {widget.locked ? (
              <Unlock className="size-3" />
            ) : (
              <Lock className="size-3" />
            )}
          </button>
          {!widget.locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="size-3" />
            </button>
          )}
          {(widget.type === "SpellCard" || widget.type === "FeatureCard" || widget.type === "StatBox" || widget.type === "BioText" || widget.type === "CharacteristicCard" || widget.type === "TrackerCard") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen((v) => { if (v) setSpellSearch(""); return !v; });
              }}
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
              title={widget.type === "SpellCard" ? "Choose spell" : widget.type === "StatBox" ? "Choose stat" : widget.type === "BioText" ? "Choose bio field" : widget.type === "CharacteristicCard" ? "Choose characteristic" : widget.type === "TrackerCard" ? "Choose tracker" : "Choose feature"}
            >
              <Settings className="size-3" />
            </button>
          )}
        </div>
      )}

      {pickerOpen && widget.type === "SpellCard" && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 w-56 rounded border border-border bg-card shadow-md"
          style={{ top: "calc(100% + 2px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border px-2 py-1.5">
            <input
              type="text"
              value={spellSearch}
              onChange={(e) => setSpellSearch(e.target.value)}
              placeholder="Search all spells…"
              className="w-full rounded bg-background px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredCharSpells.length === 0 && dedupedDbSpells.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No spells found</p>
            )}
            {filteredCharSpells.length > 0 && (
              <>
                <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Your spells</p>
                {filteredCharSpells.map((spell) => (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateWidgetData(widget.id, { spellId: spell.id });
                      setPickerOpen(false);
                      setSpellSearch("");
                    }}
                    className={cn(
                      "flex w-full flex-col px-3 py-1.5 text-left transition-colors hover:bg-accent",
                      widget.spellId === spell.id && "bg-accent"
                    )}
                  >
                    <span className="text-xs font-medium text-foreground">{spell.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} · {spell.school}
                    </span>
                  </button>
                ))}
              </>
            )}
            {dedupedDbSpells.length > 0 && (
              <>
                <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">SRD spells</p>
                {dedupedDbSpells.map((spell) => (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateWidgetData(widget.id, { spellId: spell.id });
                      setPickerOpen(false);
                      setSpellSearch("");
                    }}
                    className={cn(
                      "flex w-full flex-col px-3 py-1.5 text-left transition-colors hover:bg-accent",
                      widget.spellId === spell.id && "bg-accent"
                    )}
                  >
                    <span className="text-xs font-medium text-foreground">{spell.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} · {spell.school}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {pickerOpen && widget.type === "FeatureCard" && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 w-52 rounded border border-border bg-card shadow-md"
          style={{ top: "calc(100% + 2px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {features.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No features found</p>
            )}
            {features.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newH = Math.min(
                    featureCardGridH(feature.description, widget.w, cols, rows),
                    rows
                  );
                  updateWidgetData(widget.id, { featureId: feature.id, h: newH });
                  setPickerOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col px-3 py-1.5 text-left transition-colors hover:bg-accent",
                  widget.featureId === feature.id && "bg-accent"
                )}
              >
                <span className="text-xs font-medium text-foreground">{feature.name}</span>
                {feature.source && (
                  <span className="text-[10px] text-muted-foreground">{feature.source}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {pickerOpen && widget.type === "StatBox" && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 w-48 rounded border border-border bg-card shadow-md"
          style={{ top: "calc(100% + 2px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {statBoxes.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No stats defined</p>
            )}
            {statBoxes.map((stat) => (
              <button
                key={stat.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateWidgetData(widget.id, { statId: stat.id });
                  setPickerOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-accent",
                  widget.statId === stat.id && "bg-accent"
                )}
              >
                <span className="text-xs font-medium text-foreground">{stat.title || "Untitled"}</span>
                <span className="text-xs text-muted-foreground">{stat.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pickerOpen && widget.type === "TrackerCard" && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 w-48 rounded border border-border bg-card shadow-md"
          style={{ top: "calc(100% + 2px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {trackers.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No trackers defined</p>
            )}
            {trackers.map((tracker) => (
              <button
                key={tracker.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateWidgetData(widget.id, { trackerId: tracker.id });
                  setPickerOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-accent",
                  widget.trackerId === tracker.id && "bg-accent"
                )}
              >
                <span className="text-xs font-medium text-foreground">{tracker.name}</span>
                <span className="text-[10px] text-muted-foreground">{tracker.reset}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pickerOpen && widget.type === "CharacteristicCard" && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 w-48 rounded border border-border bg-card shadow-md"
          style={{ top: "calc(100% + 2px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {CHAR_CARD_SOURCES.map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const text = (character?.characteristics as Record<string, string> | undefined)?.[src.id] ?? "";
                  const newH = Math.min(
                    Math.max(2, Math.round((characteristicCardSvgH(text) * widget.w * rows * 210) / (cols * 297 * 96))),
                    rows
                  );
                  updateWidgetData(widget.id, { textSource: src.id, h: newH });
                  setPickerOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-1.5 text-left transition-colors hover:bg-accent",
                  widget.textSource === src.id && "bg-accent"
                )}
              >
                <span className="text-xs font-medium text-foreground">{src.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pickerOpen && widget.type === "BioText" && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 w-48 rounded border border-border bg-card shadow-md"
          style={{ top: "calc(100% + 2px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {BIO_SOURCES.map((src) => {
              const text = (character?.bio as Record<string, string> | undefined)?.[src.id] ?? "";
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newH = Math.min(
                      Math.max(3, Math.round((bioTextSvgH(text) * widget.w * rows * 210) / (cols * 297 * 96))),
                      rows
                    );
                    updateWidgetData(widget.id, { textSource: src.id, h: newH });
                    setPickerOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-left transition-colors hover:bg-accent",
                    widget.textSource === src.id && "bg-accent"
                  )}
                >
                  <span className="text-xs font-medium text-foreground">{src.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
