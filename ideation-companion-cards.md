# Companion Cards - design your own printable companion cards

> **Status:** Draft v0.1 (ideation). Not yet implemented. **Built after the Item Cards POC.**
> Sibling of `ideation-item-cards.md`. Everything generic (physical format, printing, card theme with fonts / colours
> / sizes, Text Style controls, editor engine, generic boxes, data envelope) is defined in
> **`ideation-cards-shared.md`** and is not repeated here.
>
> **Build order:** item POC first → refine → refactor the generic parts into shared modules (shared spec section 7)
> → build Companion Cards on top of them. This document only describes what is specific to companions.

---

## 1. Goal

Characters often travel with a creature: a familiar, a mount, a ranger's beast companion, a summoned spirit, a
sidekick. Companion Cards lets a user design a **physical, printable card** for each companion: picture, name,
statblock on the front; traits and actions on the back. Same fixed card format and editor as Item Cards.

As with all Print2Play output, the card is for **paper**: play-time values (current HP, uses of an ability) print as
empty fields to fill in with a pencil.

### 1.1 Reference

"Warhorse - Gerard" (shared in the project thread), landscape, orange rounded frame:

- **Front:** title bar with species ("WARHORSE", small caps) on the left and given name ("Gerard") on the right.
  Image on the left half. Right half is a parchment statblock: AC 11, Hit Points 19 (3d10+3), Speed 60 ft.; the six
  ability scores with modifiers in a 3 × 2 grid; Passive Perception 11, Languages -, Challenge 1/2 (100 XP),
  Proficiency Bonus +2.
- **Back:** background image fills the side, a parchment Text Panel with section headings **Traits** (Trampling
  Charge) and **Actions** (Hooves: melee weapon attack) in accent colour with an underline. Trait / action names are
  bold-italic, followed by the rules text.

### 1.2 Scope

- **In scope:** creating, editing, listing, deleting and printing companion cards. Companion-specific boxes
  (statblock and its parts, traits, actions, ...). Computed ability modifiers.
- **Out of scope (for now):** linking a companion to a character, scaling with the owner's level, running combat or
  tracking HP digitally, full monster / NPC sheets (open question 9.2).

---

## 2. Entry Points & Routing

Mirrors Item Cards (`ideation-item-cards.md` section 2):

- **Dashboard:** a **"Create companion"** button next to "Create character" and "Create item". Companions get a
  dashboard like items (list, open, delete, multi-select for batch printing).
- **Standalone:** a companion belongs to a user, not to a character (for now).
- **Two pages:** **Companion Forge** (e.g. `companion-forge/[id]`) for all data and **Companion Canvas**
  (e.g. `companion-canvas/[id]`) for the card layout, with the same header switch.

---

## 3. Physical Format & Visual Style

Fully shared: `ideation-cards-shared.md` sections 1 (format, orientation, print modes) and 2 - 3 (theme, fonts,
colours, sizes, Text Style). Companions add nothing of their own, except the default template (5.1).

---

## 4. Companion Data Model

Edited on the **Companion Forge**, built from the shared Forge fields (markdown, tag field, text blocks, image
upload). The Forge is the single source of truth (shared 4.2).

### 4.1 Identity

| Field        | Type      | Notes                                                                        |
| ------------ | --------- | ---------------------------------------------------------------------------- |
| `name`       | string?   | Given name, e.g. "Gerard". Optional: an unnamed "Warhorse" is fine.          |
| `species`    | string    | Required. E.g. "Warhorse", "Owl", "Wolf". The card title uses `name` and/or `species`. |
| `size`       | enum      | Tiny, Small, Medium, Large, Huge, Gargantuan.                                |
| `creatureType` | string  | Free text with suggestions: Beast, Fey, Fiend, Celestial, Elemental, ...     |
| `alignment`  | string?   | E.g. "Unaligned".                                                            |
| `role`       | string?   | Free text with suggestions: Familiar, Mount, Beast Companion, Summon, Sidekick. |
| `companionImage` | image ref? | Uploaded picture.                                                        |

### 4.2 Statblock

Plain values, **no Base + Stack** (companions don't get item modifiers). Only modifiers are computed.

| Field             | Type                         | Notes                                                              |
| ----------------- | ---------------------------- | ------------------------------------------------------------------ |
| `armorClass`      | `{ value, note? }`           | Note e.g. "natural armor".                                         |
| `hitPoints`       | `{ max, formula? }`          | E.g. `{ max: 19, formula: "3d10+3" }`. **Current HP always prints blank.** |
| `speed`           | `{ walk, fly?, swim?, climb?, burrow?, hover? }` | In ft. Rendered as "60 ft., fly 30 ft.".       |
| `abilities`       | `{ str, dex, con, int, wis, cha }` | Scores. Modifier = `floor((score - 10) / 2)`, reusing `lib/character/calculations.ts`. |
| `proficiencyBonus`| number                       | Defaults from CR (table in `ideation.md` / rules), editable.       |
| `savingThrows`    | `{ ability, bonus? }[]`      | Proficient saves; bonus computed (mod + PB) unless overridden.     |
| `skills`          | `{ skill, bonus?, expertise? }[]` | E.g. Perception +3. Computed unless overridden.               |
| `damageVulnerabilities` | string[]               | Tag field, suggestions from the damage types.                      |
| `damageResistances`     | string[]               | Tag field.                                                         |
| `damageImmunities`      | string[]               | Tag field.                                                         |
| `conditionImmunities`   | string[]               | Tag field, suggestions from the conditions list.                   |
| `senses`          | `{ sense, range }[]` + `passivePerception` | Darkvision 60 ft., ... Passive Perception computed (10 + Wis + Perception) unless overridden. |
| `languages`       | string[]                     | Empty renders as "-".                                              |
| `challenge`       | `{ rating, xp? }`            | E.g. `{ rating: "1/2", xp: 100 }`. XP from CR by default.          |
| `initiative`      | number?                      | 2024 statblocks show it; computed from Dex unless overridden.      |

**Computed vs. typed:** every computed value (modifiers, saves, skills, passive perception, PB, XP) shows its
computed value in the Forge and can be **overridden** with a typed value. A typed override is clearly marked.

### 4.3 Features

Lists of named rules blocks. Each entry: `{ id, name, description (markdown), uses? }`.

| Field             | Notes                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| `traits`          | Passive features, e.g. "Trampling Charge".                                  |
| `actions`         | E.g. "Hooves. Melee Weapon Attack: +6 to hit, ...".                         |
| `bonusActions`    | Optional section.                                                           |
| `reactions`       | Optional section.                                                           |

- `uses` is optional: `{ max, recharge }`, e.g. `{ max: 1, recharge: "short rest" }` or a "Recharge 5-6" note.
  Rendered with the shared Tracker (blank pips / `____ / 1`).
- **Attack helper (optional):** an action can be entered as structured attack (`{ kind: melee | ranged, toHit?,
  reach / range, damage, damageType }`) and rendered in the standard wording. To-hit and damage bonus are computed
  from the abilities + PB unless overridden. Free markdown is always allowed instead.

### 4.4 Shared fields

`textBlocks`, `source`, and the card theme / layout: see shared section 6.

---

## 5. The Card Editor

Fully the shared engine (shared section 4): grid per side, centralised data, inline edits write back, undo / redo,
overflow warning, Text Style toolbar on every text box.

### 5.1 Default Template

Based on the reference card:

- **Front:** Title bar (species left, name right) across the top. Companion Image on the left half. On the right a
  Text Panel with Core Stats (AC / HP / Speed), Ability Scores (3 × 2 grid), and a details block (senses,
  languages, challenge, PB).
- **Back:** background only plus a Text Panel with the **Traits** and **Actions** sections.

### 5.2 Rule-set variants

2014 and 2024 statblocks differ (2024 puts saves in the ability table and adds Initiative). Each companion has a
`ruleset` (`2014 | 2024`, default from the user's last choice). Boxes that differ, mainly **Ability Scores**, render
in the matching style. See open question 9.2.

---

## 6. Box Library (Palette)

The generic boxes (Title, Text Box, Image, Text Panel, Section Heading, Divider, Tracker, Source, Notes) come from
`ideation-cards-shared.md` section 5. Every box that shows text gets the shared Text Style toolbar; multi-part boxes
expose text parts (e.g. `label` / `value`) as in shared section 3.2.

### 6.1 How companions use the generic boxes

| Box                  | Bound to                     | Notes                                                    |
| -------------------- | ---------------------------- | -------------------------------------------------------- |
| Title                | `species`, `name`            | Variants: species only, name only, "species - name" split left / right (reference). |
| Image                | `companionImage`             |                                                          |
| HP Tracker (Tracker) | `hitPoints.max`              | `____ / 19`, or a row of boxes for small HP pools. Current value always blank. |
| Uses (Tracker)       | a feature's `uses`           | Pips per limited-use trait or action.                    |

### 6.2 Companion boxes

| Box                 | Bound to                                      | Printed output                                                    |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Creature Line       | `size`, `creatureType`, `alignment`           | "Large beast, unaligned".                                         |
| Core Stats          | `armorClass`, `hitPoints`, `speed` (+ `initiative` in 2024) | "AC 11 / Hit Points 19 (3d10+3) / Speed 60 ft." Stacked or one line. |
| Ability Scores      | `abilities` (+ saves in 2024)                 | Score + modifier. Variants: 3 × 2 grid (reference), 6 × 1 row, 2024 table with save column. |
| Saving Throws       | `savingThrows`                                | "Str +6, Con +3".                                                 |
| Skills              | `skills`                                      | "Athletics +6, Perception +3".                                    |
| Proficiencies       | `savingThrows`, `skills`                      | Combined saves + skills block, for small cards.                   |
| Vulnerabilities     | `damageVulnerabilities`                       | "Damage Vulnerabilities fire". Hidden in print when empty.        |
| Resistances         | `damageResistances`                           | Same pattern.                                                     |
| Immunities          | `damageImmunities`, `conditionImmunities`     | Damage and condition immunities, one box with two lines.          |
| Defenses            | all four lists above                          | Combined box for small cards.                                     |
| Senses              | `senses`, `passivePerception`                 | "Darkvision 60 ft., Passive Perception 11".                       |
| Languages           | `languages`                                   | "Languages -".                                                    |
| Challenge           | `challenge`, `proficiencyBonus`               | "Challenge 1/2 (100 XP) / Proficiency Bonus +2".                  |
| Details             | senses, languages, challenge, PB              | The combined block from the reference (bottom right of the front).|
| Traits              | `traits`                                      | Optional "Traits" heading + entries (name bold-italic, then text). |
| Actions             | `actions`                                     | Same, heading "Actions".                                          |
| Bonus Actions       | `bonusActions`                                | Same.                                                             |
| Reactions           | `reactions`                                   | Same.                                                             |
| Feature             | one entry from any feature list              | A single trait / action as its own box, to split long lists over both sides. |
| Full Statblock      | everything in 4.2                             | One composite box in classic statblock order, for quick layouts.  |

**Empty-field rule:** boxes bound to empty optional data (e.g. no vulnerabilities) show a hint in the editor and
render nothing in print.

---

## 7. Storage

- Same envelope as items (shared section 6) with `kind: "companion"`.
- Table: `companion_cards` mirroring `item_cards`, **or** a generic `cards` table decided during the refactor (9.2).
- Server actions `lib/actions/companion-card.ts` (or the generic card actions after the refactor), store
  `lib/store/companion-card-store.ts` on top of the shared card editor store.

```json
{
  "kind": "companion",
  "data": {
    "name": "Gerard", "species": "Warhorse", "size": "large", "creatureType": "Beast", "alignment": "Unaligned",
    "role": "Mount", "ruleset": "2014",
    "armorClass": { "value": 11 }, "hitPoints": { "max": 19, "formula": "3d10+3" }, "speed": { "walk": 60 },
    "abilities": { "str": 18, "dex": 12, "con": 13, "int": 2, "wis": 12, "cha": 7 },
    "proficiencyBonus": 2, "savingThrows": [], "skills": [],
    "damageVulnerabilities": [], "damageResistances": [], "damageImmunities": [], "conditionImmunities": [],
    "senses": [], "passivePerception": null, "languages": [], "challenge": { "rating": "1/2", "xp": 100 },
    "traits": [{ "id": "t1", "name": "Trampling Charge", "description": "If the horse moves at least 20 feet ..." }],
    "actions": [{ "id": "a1", "name": "Hooves", "description": "*Melee Weapon Attack:* +6 to hit, ..." }],
    "bonusActions": [], "reactions": [], "textBlocks": [], "source": "", "companionImage": "<ref>"
  },
  "theme": { "...": "see ideation-cards-shared.md section 6" },
  "layout": { "orientation": "landscape", "cols": 12, "front": { "widgets": [] }, "back": { "widgets": [] } }
}
```

---

## 8. Suggested Implementation Phases

0. **Prerequisite:** item POC refined and its generic parts refactored into shared modules (shared section 7).
1. **Data & routing:** storage, server actions, store, "Create companion" button, empty Forge and Canvas pages.
2. **Companion Forge:** identity, statblock with computed values + overrides, features lists, image upload.
3. **Card editor:** companion boxes on the shared engine, default template from the reference.
4. **Polish:** 2024 variants, attack helper, Full Statblock box, SRD pre-fill (if chosen), batch printing.

---

## 9. Decisions Log & Open Questions

### 9.1 Decided (2026-11-06)

| Topic               | Decision                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| Concept             | Same as Item Cards (Forge + Canvas, image upload, drag boxes), companion boxes instead of item boxes. |
| Shared design       | Fonts, sizes, colours and text box controls come from one central spec (`ideation-cards-shared.md`). Every text box offers them. |
| Build order         | Item POC first, refine, refactor generic parts, then Companion Cards.          |
| Format              | Same as items: A6 sides, A5 fold, landscape default (reference is landscape).  |

### 9.2 Open

1. **SRD pre-fill:** start from an SRD creature (e.g. "Warhorse", "Owl")? There is **no monsters / creatures table**
   in the seeded SRD data yet (`lib/db/schema.ts`), so this means a new seed for both rule sets.
2. **Rule set:** support both 2014 and 2024 statblock styles (5.2), or one style for now?
3. **Link to a character:** later, should a companion be attachable to a character (e.g. ranger's Primal Companion
   whose AC / HP / attack scale with the owner's level and PB)? Out of scope now, but it affects whether we want
   formulas like "5 × ranger level" in the data model.
4. **Scope beyond companions:** should this tool also cover NPCs / monsters for the DM (bigger statblocks, legendary
   actions), or stay strictly companions?
5. **Storage:** `companion_cards` next to `item_cards`, or one generic `cards` table with `kind` after the refactor?
6. **Dashboards:** separate item and companion dashboards, or one "Cards" dashboard with a filter per kind?
7. **Large statblocks:** when traits / actions don't fit on the back, is a third side (an extra card) acceptable, or
   is fitting on two sides always the user's job (overflow warning + font size)?
