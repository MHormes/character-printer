"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CharacterData, AttributeKey, SkillState, FeatureEntry, TrackerEntry, SpellEntry } from "@/lib/types/character";
import { syncInventoryToStacks } from "@/lib/character/modifier-sync";

type CharacterStore = {
  character: CharacterData | null;
  isDirty: boolean;
  setCharacter: (data: CharacterData) => void;
  clearCharacter: () => void;
  updateIdentityField: (field: keyof CharacterData["identity"], value: string | number) => void;
  updateAttributeBase: (attr: AttributeKey, value: number) => void;
  setAttributeStack: (attr: AttributeKey, stack: CharacterData["attributes"][AttributeKey]["stack"]) => void;
  setAttributeOverride: (attr: AttributeKey, override: number | null) => void;
  setSaveProficiency: (attr: AttributeKey, proficient: boolean) => void;
  setSaveStack: (attr: AttributeKey, stack: CharacterData["saves"][AttributeKey]["stack"]) => void;
  setSaveOverride: (attr: AttributeKey, override: number | null) => void;
  setGlobalSaveStack: (stack: CharacterData["saveGlobalStack"]) => void;
  setSkillState: (key: string, state: SkillState) => void;
  setSkillOverride: (key: string, override: number | null) => void;
  setClasses: (classes: CharacterData["identity"]["classes"]) => void;
  setOtherProficiencies: (list: CharacterData["otherProficiencies"]) => void;
  setGlobalSkillStack: (stack: CharacterData["skillGlobalStack"]) => void;
  setJackOfAllTrades: (value: boolean) => void;
  setAc: (ac: CharacterData["combat"]["ac"]) => void;
  setInitiative: (initiative: CharacterData["combat"]["initiative"]) => void;
  setSpeed: (speed: CharacterData["combat"]["speed"]) => void;
  setHp: (hp: CharacterData["combat"]["hp"]) => void;
  setInventory: (list: CharacterData["inventory"]) => void;
  setActions: (list: CharacterData["actions"]) => void;
  setFeatures: (list: FeatureEntry[]) => void;
  setTrackers: (list: TrackerEntry[]) => void;
  setSpellCastingStat: (stat: AttributeKey | null) => void;
  setSpellSlots: (slots: CharacterData["spells"]["slots"]) => void;
  setSpellList: (list: SpellEntry[]) => void;
};

export const useCharacterStore = create<CharacterStore>()(
  immer((set) => ({
    character: null,
    isDirty: false,

    setCharacter: (data) =>
      set((state) => {
        state.character = data;
        state.isDirty = false;
      }),

    clearCharacter: () =>
      set((state) => {
        state.character = null;
        state.isDirty = false;
      }),

    updateIdentityField: (field, value) =>
      set((state) => {
        if (!state.character) return;
        // @ts-expect-error dynamic field assignment
        state.character.identity[field] = value;
        state.isDirty = true;
      }),

    updateAttributeBase: (attr, value) =>
      set((state) => {
        if (!state.character) return;
        state.character.attributes[attr].base = value;
        state.character.attributes[attr].override = null;
        state.isDirty = true;
      }),

    setAttributeStack: (attr, stack) =>
      set((state) => {
        if (!state.character) return;
        state.character.attributes[attr].stack = stack;
        state.character.attributes[attr].override = null;
        state.isDirty = true;
      }),

    setAttributeOverride: (attr, override) =>
      set((state) => {
        if (!state.character) return;
        state.character.attributes[attr].override = override;
        state.isDirty = true;
      }),

    setSaveProficiency: (attr, proficient) =>
      set((state) => {
        if (!state.character) return;
        state.character.saves[attr].proficient = proficient;
        state.isDirty = true;
      }),

    setSaveStack: (attr, stack) =>
      set((state) => {
        if (!state.character) return;
        state.character.saves[attr].stack = stack;
        state.character.saves[attr].override = null;
        state.isDirty = true;
      }),

    setSaveOverride: (attr, override) =>
      set((state) => {
        if (!state.character) return;
        state.character.saves[attr].override = override;
        state.isDirty = true;
      }),

    setGlobalSaveStack: (stack) =>
      set((state) => {
        if (!state.character) return;
        state.character.saveGlobalStack = stack;
        state.isDirty = true;
      }),

    setSkillState: (key, state) =>
      set((s) => {
        if (!s.character) return;
        s.character.skills[key].state = state;
        s.isDirty = true;
      }),

    setSkillOverride: (key, override) =>
      set((s) => {
        if (!s.character) return;
        s.character.skills[key].override = override;
        s.isDirty = true;
      }),

    setClasses: (classes) =>
      set((state) => {
        if (!state.character) return;
        state.character.identity.classes = classes;
        state.character.identity.level = classes.reduce((sum, c) => sum + c.level, 0) || 1;
        state.isDirty = true;
      }),

    setOtherProficiencies: (list) =>
      set((state) => {
        if (!state.character) return;
        state.character.otherProficiencies = list;
        state.isDirty = true;
      }),

    setGlobalSkillStack: (stack) =>
      set((state) => {
        if (!state.character) return;
        state.character.skillGlobalStack = stack;
        state.isDirty = true;
      }),

    setJackOfAllTrades: (value) =>
      set((state) => {
        if (!state.character) return;
        state.character.jackOfAllTrades = value;
        state.isDirty = true;
      }),

    setAc: (ac) =>
      set((state) => {
        if (!state.character) return;
        state.character.combat.ac = ac;
        state.isDirty = true;
      }),

    setInitiative: (initiative) =>
      set((state) => {
        if (!state.character) return;
        state.character.combat.initiative = initiative;
        state.isDirty = true;
      }),

    setSpeed: (speed) =>
      set((state) => {
        if (!state.character) return;
        state.character.combat.speed = speed;
        state.isDirty = true;
      }),

    setHp: (hp) =>
      set((state) => {
        if (!state.character) return;
        state.character.combat.hp = hp;
        state.isDirty = true;
      }),

    setInventory: (list) =>
      set((state) => {
        if (!state.character) return;
        state.character.inventory = list;
        syncInventoryToStacks(state.character as unknown as CharacterData, list);
        state.isDirty = true;
      }),

    setActions: (list) =>
      set((state) => {
        if (!state.character) return;
        state.character.actions = list;
        state.isDirty = true;
      }),

    setFeatures: (list) =>
      set((state) => {
        if (!state.character) return;
        state.character.features = list;
        state.isDirty = true;
      }),

    setTrackers: (list) =>
      set((state) => {
        if (!state.character) return;
        state.character.trackers = list;
        state.isDirty = true;
      }),

    setSpellCastingStat: (stat) =>
      set((state) => {
        if (!state.character) return;
        state.character.spells.globalCastingStat = stat;
        state.isDirty = true;
      }),

    setSpellSlots: (slots) =>
      set((state) => {
        if (!state.character) return;
        state.character.spells.slots = slots;
        state.isDirty = true;
      }),

    setSpellList: (list) =>
      set((state) => {
        if (!state.character) return;
        state.character.spells.list = list;
        state.isDirty = true;
      }),
  }))
);
