export type TourStep = {
  id: string
  targetSelector: string | null
  position: "top" | "right" | "bottom" | "left" | "center"
  title: string
  description: string
  requiredSection?: string
  actionAdvances?: boolean
  flags?: {
    openGainedPanel?: boolean
    openChoicesPanel?: boolean
    openDismissed?: boolean
    enableManual?: boolean
    expandModifiers?: boolean
  }
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: null,
    position: "center",
    title: "Welcome to the Forge",
    description:
      "We'll use Aria Brightblade, a pre-built character, to tour the key features. Use the arrows or keyboard to navigate.",
  },
  {
    id: "identity-section-header",
    targetSelector: "[data-tour-id=\"identity-section-header\"]",
    position: "bottom",
    title: "Collapsible Sections",
    description:
      "Each panel is collapsible — click the header to expand or hide it. Your collapse state is saved per character so the layout is yours.",
  },
  {
    id: "identity-race",
    targetSelector: "[data-tour-id=\"identity-race\"]",
    position: "right",
    title: "SRD Automation",
    description:
      "Pick a race, class, or background and the sheet fills itself — traits, proficiencies, ASI bonuses, and more appear automatically.",
    requiredSection: "Identity",
  },
  {
    id: "gained-benefits",
    targetSelector: "[data-tour-id=\"gained-benefits\"]",
    position: "right",
    title: "Gained Benefits",
    description:
      "Everything automation granted lives here. Expand this panel to see racial traits, class features, and background perks.",
    requiredSection: "Identity",
    flags: { openGainedPanel: true },
  },
  {
    id: "dismiss-button",
    targetSelector: "[data-tour-id=\"dismiss-button\"]",
    position: "right",
    title: "Dismiss a Grant",
    description:
      "Don't want a specific auto-granted benefit? Hit Dismiss. The sheet won't re-apply it on refresh.",
    requiredSection: "Identity",
    actionAdvances: true,
    flags: { openChoicesPanel: true },
  },
  {
    id: "revert-button",
    targetSelector: "[data-tour-id=\"revert-button\"]",
    position: "left",
    title: "Revert a Dismissal",
    description:
      "Changed your mind? The Dismissed toggle shows what you've dismissed. Click Revert to restore any of them.",
    requiredSection: "Identity",
    actionAdvances: true,
    flags: { openGainedPanel: true, openDismissed: true },
  },
  {
    id: "manual-toggle",
    targetSelector: "[data-tour-id=\"manual-toggle\"]",
    position: "bottom",
    title: "Manual Controls (Global)",
    description:
      "This master toggle enables the manual system. It doesn't show the math directly — instead it reveals a per-section toggle inside each panel header so you control which sections show detail.",
    flags: { enableManual: true },
  },
  {
    id: "corestat-manual-toggle",
    targetSelector: "[data-tour-id=\"corestat-manual-toggle\"]",
    position: "left",
    title: "Section-Level Toggle",
    description:
      "Here's one of those per-section toggles. \"Show manual\" expands base values, modifier stacks, and the override field for Core Stats only. Sections you don't need stay clean.",
    requiredSection: "Core Stats",
    flags: { enableManual: true },
  },
  {
    id: "str-modifier-stack",
    targetSelector: "[data-tour-id=\"str-modifier-stack\"]",
    position: "right",
    title: "Modifier Stack",
    description:
      "Each stat has a modifier stack — a named list of bonuses that add up to the total. Click the Modifiers row to expand it and see each source.",
    requiredSection: "Core Stats",
    flags: { enableManual: true, expandModifiers: true },
  },
  {
    id: "str-modifier-list",
    targetSelector: "[data-tour-id=\"str-modifier-list\"]",
    position: "right",
    title: "Reading the Stack",
    description:
      "Lock icon = automation-granted (read-only). The dot toggles a modifier on or off. Add your own with the + button — give it a fixed value, or hit Σ to base it on a stat, level, or proficiency bonus (e.g. half level × 5).",
    requiredSection: "Core Stats",
    flags: { enableManual: true, expandModifiers: true },
  },
  {
    id: "str-override",
    targetSelector: "[data-tour-id=\"str-override\"]",
    position: "right",
    title: "Override Total",
    description:
      "Lock the total with an override. If you later toggle modifiers on or off, the override adjusts automatically — no manual recalculation needed.",
    requiredSection: "Core Stats",
    flags: { enableManual: true, expandModifiers: true },
  },
  {
    id: "save-proficiency",
    targetSelector: "[data-tour-id=\"save-proficiency\"]",
    position: "right",
    title: "Proficiency Toggles",
    description:
      "Toggle proficiency on saves and skills. Automation-granted ones show a lock icon; any you add manually stay fully editable.",
    requiredSection: "Saving Throws",
  },
  {
    id: "done",
    targetSelector: null,
    position: "center",
    title: "You're All Set!",
    description:
      "Combat, Spells, Trackers, and Inventory all follow the same patterns. Enjoy building Aria — or delete her and start fresh.",
  },
]
