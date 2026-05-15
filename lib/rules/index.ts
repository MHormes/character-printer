import type { Edition, RuleSet } from "./types";
import { rules2014 } from "./5e-2014";
import { rules2024 } from "./5e-2024";

export { rules2014, rules2024 };
export type { Edition, RuleSet };

export function getRuleSet(edition: Edition): RuleSet {
  return edition === "2024" ? rules2024 : rules2014;
}
