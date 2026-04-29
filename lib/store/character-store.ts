"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CharacterData, AttributeKey } from "@/lib/types/character";

type CharacterStore = {
  character: CharacterData | null;
  isDirty: boolean;
  setCharacter: (data: CharacterData) => void;
  updateIdentityField: (field: keyof CharacterData["identity"], value: string | number) => void;
  updateAttributeBase: (attr: AttributeKey, value: number) => void;
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
        state.isDirty = true;
      }),
  }))
);
