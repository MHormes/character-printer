# Item Cards - design your own printable magic item cards

> **Status:** Draft v0.3 (ideation). Not yet implemented. Decisions from review are recorded in section 9.
> Companion to `ideation.md` (character sheets). Reuses the Canvas engine described there in section 12.
>
> **Shared parts:** physical format, printing, card theme (fonts, colours, sizes), text style controls, the editor
> engine and the generic boxes are defined once in **`ideation-cards-shared.md`**, used by both Item Cards and
> Companion Cards (`ideation-companion-cards.md`). This document only covers what is specific to items. The item
> POC is built first; its generic parts are then refactored into shared modules (shared spec, section 0 and 7).

---

## 1. Goal

DMs regularly hand out custom items with descriptions, active abilities and charges. Item Cards lets a user design a
**physical, printable card** for each item: an image, the name, its properties and the rules text, laid out on a
front and a back side and printed at a fixed size.

As with the character sheet, the output is meant for **paper**. Anything that changes during play (charges used,
notes) is printed as an empty field to fill in with a pencil.

### 1.1 Scope

- **In scope:** creating, editing, listing, deleting and printing item cards. A drag-and-drop card editor with a
  library of card-specific boxes. Pre-filling from SRD items.
- **Out of scope (for now):** linking a card to a character or its inventory, sharing cards between users, NPC sheets.

---

## 2. Entry Points & Routing

- **Dashboard:** next to the existing "Create character" button there is a **"Create item"** button. Items get their
  own **item dashboard**, built like the character dashboard (list of cards with open / delete actions).
- **Item cards are standalone:** they belong to a user, not to a character.
- **Two pages per item**, mirroring the character Forge / Canvas split (names provisional, follow the existing
  `forge/[id]` and `canvas/[id]` pattern under `app/(app)/`):
  - **Item Forge** (e.g. `item-forge/[id]`) - full data-entry page for everything about the item (section 4).
  - **Item Canvas** (e.g. `item-canvas/[id]`) - the drag-and-drop card editor (section 5).
  - A switch in the header moves between the two, as for characters.
- Read `node_modules/next/dist/docs/` before building the route, per `AGENTS.md`.

---

## 3. Physical Format

Fixed A6 card sides on a folded A5, landscape by default with a portrait toggle, A5 / A4 fold and duplex print modes,
single and batch printing, PDF export and print marks: all defined in **`ideation-cards-shared.md` section 1**.

Item-specific: batch printing is started from the **item dashboard**.

---

## 4. Item Data Model

Each item card is one record owned by a user. Like characters, the item is stored as a relational row with a JSON
blob for the item data and the layout (see section 8).

All fields are edited on the **Item Forge** page, a full data-entry page like the character Forge, built from the
same section / field components in `components/forge` where possible.

### 4.1 Core Fields

| Field                | Type        | Notes                                                                       |
| -------------------- | ----------- | --------------------------------------------------------------------------- |
| `name`               | string      | Required.                                                                   |
| `type`               | string      | Free text with suggestions: Weapon, Armor, Wondrous Item, Ring, Potion, ... |
| `subtype`            | string?     | E.g. "studded leather armor", "longsword".                                  |
| `rarity`             | enum?       | Common, Uncommon, Rare, Very Rare, Legendary, Artifact.                     |
| `requiresAttunement` | boolean     | Toggle. Optional free-text qualifier (e.g. "by a wizard").                  |
| `weight`             | decimal?    | In lb.                                                                      |
| `properties`         | string[]    | Tag field, see 4.2.                                                         |
| `statLine`           | string?     | E.g. "AC 12 + Dex", "1d8 slashing (1d10 versatile)".                        |
| `charges`            | object?     | `{ max: number, recharge?: string }`, e.g. `{ max: 3, recharge: "1d3 at dawn" }`. |
| `description`        | markdown    | Main rules and flavour text. Markdown: bold, italic, paragraphs, lists.     |
| `textBlocks`         | list        | Extra named free-text blocks: `{ id, label, content }`. Shown on the card via Text Boxes. |
| `source`             | string?     | E.g. "BMT, page 67".                                                        |
| `itemImage`          | image ref?  | Uploaded picture of the item.                                               |
| `background`         | -           | Moved to the shared card theme (`ideation-cards-shared.md` section 2).      |

### 4.2 Properties (Tag Field)

- Free text, entered as tags.
- Autocomplete suggestions come from the existing SRD item properties (`items.properties` in `lib/db/schema.ts`:
  Finesse, Versatile, Light, Heavy, Two-Handed, Thrown, ...).
- Users can add any custom property that is not in the list.

### 4.3 Pre-fill from an SRD Item

- When creating an item, the user can optionally **start from an SRD item** (search, e.g. "Longsword").
- This copies name, type, weight, properties, damage / two-handed (versatile) dice and armor values into the card's
  fields. The stat line is generated from them (e.g. "AC 12 + Dex").
- After copying, every field is editable. There is no live link to the SRD item.
- The search covers **both rule sets** at once. Results are labelled, e.g. "Longsword (2014)" and "Longsword (2024)".

---

## 5. The Card Editor

The editor follows the Canvas idea from the character printer: a **grid per card side** on which the user drags boxes
from a palette. All item data lives in the Item Forge (section 4); the Canvas only decides where it goes.

### 5.0 Centralised Data Principle

See **`ideation-cards-shared.md` section 4.2**: the Item Forge is the single source of truth, boxes are views,
free-text blocks live in the Forge, inline edits write back, session undo / redo.

### 5.1 Layout

See **shared section 4.4**. The palette's domain group holds the item boxes from section 6.

### 5.2 Grid & Placement

See **shared section 4.1**. The grid constant is shared between card tools.

### 5.3 Data Binding

- Boxes are bound to the item's fields: editing the name in the Item Forge updates the Name box, and inline edits on
  the Canvas write back to the Forge (see 5.0).
- A field can appear on either side. The user decides how much text goes on the front.

### 5.4 Overflow & Font Size

See **shared section 4.3** (clip + warning, "Fit text") and **section 3** (every text box offers the full Text Style
toolbar: font, size, colour, ...).

### 5.5 Templates

- A new item starts from a **default template** so the user does not face an empty card. Proposal, based on the
  reference card:
  - **Front:** Name (top), type / rarity / attunement line, Item Image (right), Stat Line (bottom left).
  - **Back:** Background fills the side, a Text Panel on top with the Description, Charges and a footer with
    Source and Weight.
- Later: user-saved card templates, similar to canvas templates (`lib/actions/canvas-template.ts`).

---

## 6. Box Library (Palette)

As with the character printer, there should be many box types. Each is a ready-to-fill template.

The **generic boxes** (Title, Text Box, Image, Text Panel, Section Heading, Divider, Tracker, Source, Notes) are
defined in **`ideation-cards-shared.md` section 5**. The table below lists how items use them plus the item-specific
boxes. Every box that shows text gets the shared Text Style toolbar (shared section 3).

| Box                | Bound to                         | Printed output                                                         |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------- |
| Name (generic Title) | `name`                         | Large title in the card heading font.                                  |
| Type Line          | `type`, `subtype`, `rarity`, `requiresAttunement` | E.g. "Light armor (studded leather), rare (requires attunement)". |
| Properties         | `properties`                     | Comma-separated list or chips.                                         |
| Stat Line          | `statLine`                       | E.g. "AC 12 + Dex".                                                    |
| Item Image         | `itemImage`                      | Framed picture.                                                        |
| Text Box           | one Forge text block (`textBlocks[id]`) | Open text, for anything. Content lives in the Forge.           |
| Description        | `description`                    | Rendered markdown.                                                     |
| Charges (generic Tracker) | `charges`                   | `____ / 3` plus recharge text. The used number is **always blank**. Pips variant: a row of empty circles. |
| Text Panel         | -                                | A framed, readable panel that sits on top of a background image.      |
| Weight             | `weight`                         | E.g. "13 lb."                                                          |
| Source             | `source`                         | Small footer text.                                                     |
| Divider            | -                                | Decorative line.                                                       |

**Charges rule:** the counter shows the maximum but leaves the current value empty, because it is filled in with a
pencil during play. This matches the `Blank` print state of the character canvas.

---

## 7. Visual Style

Background, frame, fonts, colours and sizes are part of the shared **card theme** and **Text Style**
(`ideation-cards-shared.md` sections 2 and 3). Items add nothing of their own here.

### 7.1 Reference

- Draft armor card "Gloomwrought Studded Leather Armor" (shared in the project thread): landscape, name + type line +
  stat line next to the image on the front; description, charges, source and weight on a text panel over a tavern
  background on the back.
- "Mythcarver (Awakened)" weapon card: same layout. Front has name, type line ("Legendary (requires attunement by a
  bard)"), damage stat line ("1d8 slashing") and properties ("Finesse, versatile (1d10), Vestige"); back has a
  semi-transparent text panel with markdown-style bold keywords. Confirms the default template; no spec changes.

---

## 8. Storage & Images

- **New table** `item_cards` (SQLite + Postgres, like `characters`): `id`, `userId`, `name`, `data` (JSON blob with
  item fields + layout), `createdAt`, `updatedAt`. The `name` column is duplicated for listing.
- **JSON blob shape (draft):**

```json
{
  "item": { "name": "...", "type": "...", "rarity": "rare", "requiresAttunement": true, "weight": 13,
            "properties": [], "statLine": "AC 12 + Dex", "charges": { "max": 3, "recharge": "1d3 at dawn" },
            "description": "...", "textBlocks": [{ "id": "tb1", "label": "Flavour", "content": "..." }],
            "source": "BMT, page 67", "itemImage": "<ref>" },
  "theme": { "...": "see ideation-cards-shared.md section 6" },
  "layout": {
    "orientation": "landscape",
    "cols": 12,
    "front": { "widgets": [] },
    "back":  { "widgets": [], "backgroundOnly": false }
  }
}
```

- **Images:** item image and background image are uploaded through the existing image storage (S3 / AIStor, see
  `lib/actions/character-image.ts` and `app/api/character-images`). Generalise or mirror it for item images.
- **Server actions** in `lib/actions/item-card.ts`: create, update (auto-save), delete, list for the current user.
- **Store:** a dedicated Zustand store `lib/store/item-card-store.ts`, single source of truth for the editor.

---

## 9. Decisions Log & Remaining Gaps

### 9.1 Decided (review 2026-11-06)

| Topic              | Decision                                                                             |
| ------------------ | ------------------------------------------------------------------------------------ |
| Orientation        | Landscape by default, one-click toggle to portrait (3.1).                            |
| Duplex             | Supported as a print mode (3.2).                                                     |
| Export             | Browser print and PDF (3.3).                                                         |
| Batch printing     | Yes, from the item dashboard, without slowing down single-card printing (3.3).      |
| SRD search         | Searches 2014 and 2024 together, results labelled by rule set (4.3).                 |
| Description        | Markdown (4.1).                                                                      |
| Overflow           | Clip + warning, per-box font size, optional "Fit text" (5.4).                        |
| Background         | One background for the whole card (7).                                               |
| Dashboard          | Separate item dashboard, like the character dashboard (2).                           |
| Grid               | To be tuned later; single constant, not spread through code (5.2).                   |
| History            | Session undo / redo like the character canvas; no saved versions (5.0).              |
| Out of scope       | Inventory link, sharing with the party, NPC sheets.                                  |

### 9.2 Still Open

1. **Fonts and frames:** moved to the shared open questions (`ideation-cards-shared.md` section 8).
2. **Storage:** keep `item_cards`, or move to a generic `cards` table with a `kind` column during the refactor?

---

## 10. Suggested Implementation Phases

1. **Data & routing:** `item_cards` table + migration, server actions, store, dashboard "Create item" button, empty
   Item Forge and Item Canvas pages.
2. **Item Forge:** core fields, text blocks, properties tag field, image uploads, background.
3. **Card editor:** front/back grids reusing the canvas engine, default template, core boxes (Name, Type Line,
   Image, Description, Stat Line, Charges Counter, Text Box).
4. **Print:** A5 / A4 fold modes, orientation toggle, single-card print and PDF export.
5. **Polish:** SRD pre-fill, overflow warnings and font controls, remaining boxes, duplex, batch printing from the
   dashboard, saved templates.
