import { create } from "zustand"
import { persist } from "zustand/middleware"

type TourState = {
  active: boolean
  step: number
  demoCharacterId: string | null
  startTour: (characterId: string) => void
  nextStep: (totalSteps: number) => void
  prevStep: () => void
  skipTour: () => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      active: false,
      step: 0,
      demoCharacterId: null,
      startTour: (characterId) =>
        set({ active: true, step: 0, demoCharacterId: characterId }),
      nextStep: (totalSteps) =>
        set((s) =>
          s.step < totalSteps - 1
            ? { step: s.step + 1 }
            : { active: false, step: 0 },
        ),
      prevStep: () =>
        set((s) => (s.step > 0 ? { step: s.step - 1 } : s)),
      skipTour: () => set({ active: false, step: 0 }),
    }),
    {
      name: "character-printer:tour",
      skipHydration: true,
    },
  ),
)
