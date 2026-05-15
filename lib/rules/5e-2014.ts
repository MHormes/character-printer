import type { RuleSet } from "./types";

export const rules2014: RuleSet = {
  edition: "2014",
  srdSystem: "dnd5e",
  labels: {
    race: "Race",
    subrace: "Subrace",
    background: "Background",
  },
  skills: [
    { key: "acrobatics",     label: "Acrobatics",     attr: "dex" },
    { key: "animalHandling", label: "Animal Handling", attr: "wis" },
    { key: "arcana",         label: "Arcana",          attr: "int" },
    { key: "athletics",      label: "Athletics",       attr: "str" },
    { key: "deception",      label: "Deception",       attr: "cha" },
    { key: "history",        label: "History",         attr: "int" },
    { key: "insight",        label: "Insight",         attr: "wis" },
    { key: "intimidation",   label: "Intimidation",    attr: "cha" },
    { key: "investigation",  label: "Investigation",   attr: "int" },
    { key: "medicine",       label: "Medicine",        attr: "wis" },
    { key: "nature",         label: "Nature",          attr: "int" },
    { key: "perception",     label: "Perception",      attr: "wis" },
    { key: "performance",    label: "Performance",     attr: "cha" },
    { key: "persuasion",     label: "Persuasion",      attr: "cha" },
    { key: "religion",       label: "Religion",        attr: "int" },
    { key: "sleightOfHand",  label: "Sleight of Hand", attr: "dex" },
    { key: "stealth",        label: "Stealth",         attr: "dex" },
    { key: "survival",       label: "Survival",        attr: "wis" },
  ],
  jackOfAllTradesAppliesTo: ["skills", "initiative"],
  backgroundGrantsAsi: false,
  backgroundGrantsFeat: false,
};
