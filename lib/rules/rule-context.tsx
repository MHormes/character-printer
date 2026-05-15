"use client";

import { createContext, useContext } from "react";
import { rules2014, getRuleSet } from "./index";
import type { Edition, RuleSet } from "./types";

const RuleSetContext = createContext<RuleSet>(rules2014);

export function RuleSetProvider({
  edition,
  children,
}: {
  edition: Edition;
  children: React.ReactNode;
}) {
  return (
    <RuleSetContext.Provider value={getRuleSet(edition)}>
      {children}
    </RuleSetContext.Provider>
  );
}

export function useRuleSet(): RuleSet {
  return useContext(RuleSetContext);
}
