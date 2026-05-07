"use client";

import { use, useState, useEffect, useRef } from "react";
import { useCharacterStore } from "@/lib/store/character-store";
import { loadCharacter, saveCharacter } from "@/lib/actions/character";
import { StringField } from "@/components/forge/string-field";
import { ClassesField } from "@/components/forge/classes-field";
import { StatBlock } from "@/components/forge/stat-block";
import { SaveBlock } from "@/components/forge/save-block";
import { SkillsBlock } from "@/components/forge/skills-block";
import { OtherProficienciesBlock } from "@/components/forge/other-proficiencies-block";
import { CombatBlock } from "@/components/forge/combat-block";
import { InventoryBlock } from "@/components/forge/inventory-block";
import { ActionsBlock } from "@/components/forge/actions-block";
import { FeaturesBlock } from "@/components/forge/features-block";
import { TrackersBlock } from "@/components/forge/trackers-block";
import { StatBoxesBlock } from "@/components/forge/stat-boxes-block";
import { SpellsBlock } from "@/components/forge/spells-block";
import { ForgeSection } from "@/components/forge/forge-section";
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  Circle,
  X,
  Plus,
  Lock,
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Layout,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import type {
  AttributeKey,
  ModifierEntry,
} from "@/lib/types/character";

import {
  resolvePb,
  resolveAttributeMod,
} from "@/lib/character/calculations";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];
const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};
const SAVE_LABELS: Record<AttributeKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export default function ForgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [globalSaveExpanded, setGlobalSaveExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const clearCharacter = useCharacterStore((s) => s.clearCharacter);
  const character = useCharacterStore((s) => s.character);
  const autoSave = useCharacterStore((s) => s.autoSave);
  const setAutoSave = useCharacterStore((s) => s.setAutoSave);
  const isDirty = useCharacterStore((s) => s.isDirty);
  const updateIdentityField = useCharacterStore((s) => s.updateIdentityField);
  const updateAttributeBase = useCharacterStore((s) => s.updateAttributeBase);
  const setAttributeStack = useCharacterStore((s) => s.setAttributeStack);
  const setAttributeOverride = useCharacterStore((s) => s.setAttributeOverride);
  const setSaveProficiency = useCharacterStore((s) => s.setSaveProficiency);
  const setSaveStack = useCharacterStore((s) => s.setSaveStack);
  const setSaveOverride = useCharacterStore((s) => s.setSaveOverride);
  const setGlobalSaveStack = useCharacterStore((s) => s.setGlobalSaveStack);
  const setSkillState = useCharacterStore((s) => s.setSkillState);
  const setSkillOverride = useCharacterStore((s) => s.setSkillOverride);
  const setPassivePerceptionStack = useCharacterStore(
    (s) => s.setPassivePerceptionStack,
  );
  const setPassivePerceptionOverride = useCharacterStore(
    (s) => s.setPassivePerceptionOverride,
  );
  const setClasses = useCharacterStore((s) => s.setClasses);
  const setOtherProficiencies = useCharacterStore(
    (s) => s.setOtherProficiencies,
  );
  const setGlobalSkillStack = useCharacterStore((s) => s.setGlobalSkillStack);
  const setJackOfAllTrades = useCharacterStore((s) => s.setJackOfAllTrades);
  const setAc = useCharacterStore((s) => s.setAc);
  const setInitiative = useCharacterStore((s) => s.setInitiative);
  const setSpeed = useCharacterStore((s) => s.setSpeed);
  const setHp = useCharacterStore((s) => s.setHp);
  const setInventory = useCharacterStore((s) => s.setInventory);
  const setActions = useCharacterStore((s) => s.setActions);
  const setFeatures = useCharacterStore((s) => s.setFeatures);
  const setTrackers = useCharacterStore((s) => s.setTrackers);
  const setStatBoxes = useCharacterStore((s) => s.setStatBoxes);
  const setSpellCastingStat = useCharacterStore((s) => s.setSpellCastingStat);
  const setSpellSlots = useCharacterStore((s) => s.setSpellSlots);
  const setSpellList = useCharacterStore((s) => s.setSpellList);

  useEffect(() => {
    clearCharacter();
    loadCharacter(id).then((res) => {
      if (res) setCharacter(res.data, res.autoSave);
    });
  }, [id, clearCharacter, setCharacter]);

  // Auto-save on change with 1.5s debounce
  useEffect(() => {
    if (!character || !isDirty || !autoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      await saveCharacter(id, character, autoSave);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [character, isDirty, autoSave, id]);

  async function handleSave() {
    if (!character) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    await saveCharacter(id, character, autoSave);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  async function handleToggleAutoSave(checked: boolean) {
    setAutoSave(checked);
    // Persist immediately when toggling
    if (character) {
      await saveCharacter(id, character, checked);
    }
  }

  if (!character)
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );

  const {
    identity,
    attributes,
    saves,
    saveGlobalStack,
    skills,
    skillGlobalStack,
    passivePerception,
    jackOfAllTrades,
    otherProficiencies,
    combat,
    inventory,
    actions,
    features,
    trackers,
    statBoxes,
    spells,
  } = character;
  const pb = resolvePb(character);

  return (
    <main className="space-y-10 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/characters"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Characters
          </Link>
          <h1 className="text-lg font-semibold">Forge</h1>
          <Link
            href={`/canvas/${id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Layout className="size-4" />
            Open Canvas
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => handleToggleAutoSave(e.target.checked)}
              className="h-3.5 w-3.5 accent-foreground"
            />
            Auto-save
          </label>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="size-3 text-green-600" />
                Saved
              </>
            )}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            <Save />
            Save
          </Button>
        </div>
      </div>

      <ForgeSection title="Identity" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          <StringField
            label="Name"
            value={identity.name}
            onChange={(v) => updateIdentityField("name", v)}
            placeholder="Character name"
          />
          <StringField
            label="Race"
            value={identity.race}
            onChange={(v) => updateIdentityField("race", v)}
            placeholder="e.g. Human"
          />
          <StringField
            label="Subrace"
            value={identity.subrace}
            onChange={(v) => updateIdentityField("subrace", v)}
            placeholder="e.g. High Elf"
          />
          <StringField
            label="Background"
            value={identity.background}
            onChange={(v) => updateIdentityField("background", v)}
            placeholder="e.g. Soldier"
          />
          <StringField
            label="Deity"
            value={identity.deity}
            onChange={(v) => updateIdentityField("deity", v)}
            placeholder="e.g. Tyr"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Alignment
            </label>
            <select
              value={identity.alignment}
              onChange={(e) => updateIdentityField("alignment", e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">—</option>
              <option value="Lawful Good">Lawful Good</option>
              <option value="Neutral Good">Neutral Good</option>
              <option value="Chaotic Good">Chaotic Good</option>
              <option value="Lawful Neutral">Lawful Neutral</option>
              <option value="True Neutral">True Neutral</option>
              <option value="Chaotic Neutral">Chaotic Neutral</option>
              <option value="Lawful Evil">Lawful Evil</option>
              <option value="Neutral Evil">Neutral Evil</option>
              <option value="Chaotic Evil">Chaotic Evil</option>
            </select>
          </div>
          <div className="col-span-2">
            <ClassesField
              classes={identity.classes}
              onChange={setClasses}
              proficiencyBonus={pb}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          <StringField
            label="Age"
            value={identity.age}
            onChange={(v) => updateIdentityField("age", v)}
            placeholder="e.g. 25"
          />
          <StringField
            label="Gender"
            value={identity.gender}
            onChange={(v) => updateIdentityField("gender", v)}
            placeholder="e.g. Male"
          />
          <StringField
            label="Height"
            value={identity.height}
            onChange={(v) => updateIdentityField("height", v)}
            placeholder="e.g. 5'10&quot;"
          />
          <StringField
            label="Weight"
            value={identity.weight}
            onChange={(v) => updateIdentityField("weight", v)}
            placeholder="e.g. 160 lbs"
          />
          <StringField
            label="Eyes"
            value={identity.eyes}
            onChange={(v) => updateIdentityField("eyes", v)}
            placeholder="e.g. Blue"
          />
          <StringField
            label="Hair"
            value={identity.hair}
            onChange={(v) => updateIdentityField("hair", v)}
            placeholder="e.g. Brown"
          />
          <StringField
            label="Skin"
            value={identity.skin}
            onChange={(v) => updateIdentityField("skin", v)}
            placeholder="e.g. Tanned"
          />
        </div>
      </ForgeSection>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Core stats + saves stacked */}
        <div className="w-full xl:w-1/4 flex flex-col gap-4">
          <ForgeSection title="Core Stats">
            <div className="grid grid-cols-3 gap-3">
              {ATTRIBUTE_KEYS.map((attr) => (
                <StatBlock
                  key={attr}
                  label={ATTRIBUTE_LABELS[attr]}
                  data={attributes[attr]}
                  onBaseChange={(v) => updateAttributeBase(attr, v)}
                  onStackChange={(stack: ModifierEntry[]) =>
                    setAttributeStack(attr, stack)
                  }
                  onOverrideChange={(override) =>
                    setAttributeOverride(attr, override)
                  }
                />
              ))}
            </div>
          </ForgeSection>

          <ForgeSection title="Saving Throws">
            <div className="grid grid-cols-3 gap-3">
              {ATTRIBUTE_KEYS.map((attr) => (
                <SaveBlock
                  key={attr}
                  label={SAVE_LABELS[attr]}
                  data={saves[attr]}
                  attrMod={resolveAttributeMod(attributes[attr])}
                  proficiencyBonus={pb}
                  globalStack={saveGlobalStack}
                  attrKey={attr}
                  onProficiencyChange={(p) => setSaveProficiency(attr, p)}
                  onStackChange={(stack) => setSaveStack(attr, stack)}
                  onOverrideChange={(override) =>
                    setSaveOverride(attr, override)
                  }
                />
              ))}
            </div>

            {/* Global save modifier */}
            <button
              type="button"
              onClick={() => setGlobalSaveExpanded((v) => !v)}
              className="flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {globalSaveExpanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              Global modifier
              {!globalSaveExpanded && saveGlobalStack.length > 0 && (
                <span className="ml-auto tabular-nums">
                  {saveGlobalStack
                    .filter((m) => m.isActive)
                    .reduce((s, m) => s + m.value, 0) >= 0
                    ? `+${saveGlobalStack.filter((m) => m.isActive).reduce((s, m) => s + m.value, 0)}`
                    : saveGlobalStack
                        .filter((m) => m.isActive)
                        .reduce((s, m) => s + m.value, 0)}
                </span>
              )}
            </button>
            {globalSaveExpanded && (
              <div className="flex flex-col gap-1.5">
                {saveGlobalStack.map((mod) =>
                  mod.sourceId ? (
                    <div
                      key={mod.id}
                      className={`flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5${!mod.isActive ? " opacity-40" : ""}`}
                    >
                      <Lock className="size-2.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {mod.source}
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-foreground">
                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                      </span>
                      {mod.isActive ? (
                        <CircleDot className="size-2.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Circle className="size-2.5 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  ) : (
                    <div key={mod.id} className="flex items-start gap-1">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Input
                          type="text"
                          value={mod.source}
                          placeholder="Source"
                          className="h-6 text-xs"
                          onChange={(e) =>
                            setGlobalSaveStack(
                              saveGlobalStack.map((m) =>
                                m.id === mod.id
                                  ? { ...m, source: e.target.value }
                                  : m,
                              ),
                            )
                          }
                        />
                        <div className="flex h-6 items-center rounded-md border border-input bg-background focus-within:border-ring">
                          <span className="select-none pl-2 text-xs text-muted-foreground">
                            +
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={mod.value === 0 ? "" : String(mod.value)}
                            placeholder="0"
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setGlobalSaveStack(
                                  saveGlobalStack.map((m) =>
                                    m.id === mod.id ? { ...m, value: 0 } : m,
                                  ),
                                );
                                return;
                              }
                              if (raw === "-") return;
                              const n = parseInt(raw, 10);
                              if (!isNaN(n))
                                setGlobalSaveStack(
                                  saveGlobalStack.map((m) =>
                                    m.id === mod.id ? { ...m, value: n } : m,
                                  ),
                                );
                            }}
                            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-xs placeholder:text-foreground/30 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalSaveStack(
                              saveGlobalStack.filter((m) => m.id !== mod.id),
                            )
                          }
                          className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalSaveStack(
                              saveGlobalStack.map((m) =>
                                m.id === mod.id
                                  ? { ...m, isActive: !m.isActive }
                                  : m,
                              ),
                            )
                          }
                          className="flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {mod.isActive ? (
                            <CircleDot className="size-2.5" />
                          ) : (
                            <Circle className="size-2.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setGlobalSaveStack([
                      ...saveGlobalStack,
                      {
                        id: crypto.randomUUID(),
                        source: "",
                        value: 0,
                        isActive: true,
                      },
                    ])
                  }
                  className="flex h-6 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="size-3" />
                  Add modifier
                </button>
              </div>
            )}
          </ForgeSection>
        </div>

        {/* Skills */}
        <ForgeSection title="Skills" className="w-full xl:w-62 shrink-0">
          <SkillsBlock
            skills={skills}
            attributes={attributes}
            proficiencyBonus={pb}
            jackOfAllTrades={jackOfAllTrades}
            globalStack={skillGlobalStack}
            passivePerception={passivePerception}
            onStateChange={setSkillState}
            onOverrideChange={setSkillOverride}
            onJackOfAllTradesChange={setJackOfAllTrades}
            onGlobalStackChange={setGlobalSkillStack}
            onPassivePerceptionStackChange={setPassivePerceptionStack}
            onPassivePerceptionOverrideChange={setPassivePerceptionOverride}
          />
        </ForgeSection>

        {/* Other Proficiencies */}
        <ForgeSection
          title="Other Proficiencies"
          className="w-full xl:w-72 min-w-0"
        >
          <OtherProficienciesBlock
            proficiencies={otherProficiencies}
            attributes={attributes}
            proficiencyBonus={pb}
            onChange={setOtherProficiencies}
          />
        </ForgeSection>

        {/* Combat */}
        <div className="w-full xl:flex-1 min-w-0 flex flex-col gap-4">
          <ForgeSection title="Combat">
            <CombatBlock
              data={combat}
              attributes={attributes}
              classes={identity.classes}
              proficiencyBonus={pb}
              jackOfAllTrades={jackOfAllTrades}
              onAcChange={setAc}
              onInitiativeChange={setInitiative}
              onSpeedChange={setSpeed}
              onHpChange={setHp}
            />
          </ForgeSection>

          <ForgeSection title="Attacks & Actions">
            <ActionsBlock
              actions={actions}
              castingStat={spells.globalCastingStat}
              attributes={attributes}
              proficiencyBonus={pb}
              attackStack={spells.attackStack}
              dcStack={spells.dcStack}
              onChange={setActions}
              onCastingStatChange={setSpellCastingStat}
            />
          </ForgeSection>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <ForgeSection title="Features & Traits" className="flex-1 min-w-0">
          <FeaturesBlock features={features} onChange={setFeatures} />
        </ForgeSection>

        <ForgeSection title="Trackers" className="flex-1 min-w-0">
          <TrackersBlock trackers={trackers} onChange={setTrackers} />
        </ForgeSection>

        <ForgeSection title="Custom Stats" className="w-full md:w-72 shrink-0">
          <StatBoxesBlock statBoxes={statBoxes ?? []} onChange={setStatBoxes} />
        </ForgeSection>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <ForgeSection title="Inventory" className="w-full md:w-1/3">
          <InventoryBlock inventory={inventory} onChange={setInventory} />
        </ForgeSection>

        <ForgeSection title="Spellcasting" className="w-full md:w-2/3">
          <SpellsBlock
            slots={spells.slots}
            list={spells.list}
            castingStat={spells.globalCastingStat}
            attributes={attributes}
            proficiencyBonus={pb}
            attackStack={spells.attackStack}
            dcStack={spells.dcStack}
            onSlotsChange={setSpellSlots}
            onListChange={setSpellList}
          />
        </ForgeSection>
      </div>
    </main>
  );
}
