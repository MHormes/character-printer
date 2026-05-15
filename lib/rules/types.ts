import type { AttributeKey, Edition } from "@/lib/types/character";

export type { Edition };

export type SkillDefinition = {
  key: string;
  label: string;
  attr: AttributeKey;
};

export type RuleSet = {
  edition: Edition;
  srdSystem: string;
  labels: {
    race: string;
    subrace: string;
    background: string;
  };
  skills: SkillDefinition[];
  jackOfAllTradesAppliesTo: ("skills" | "initiative" | "saves")[];
  backgroundGrantsAsi: boolean;
  backgroundGrantsFeat: boolean;
};
