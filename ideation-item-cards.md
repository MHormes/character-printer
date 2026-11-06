# Item Cards - design your own printable magic item cards

> **Status:** Draft v0.2 (ideation). Not yet implemented. Decisions from review are recorded in section 9.
> Companion to `ideation.md` (character sheets). Reuses the Canvas engine described there in section 12.

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

The size of a card is **fixed**. It never grows or shrinks with its content.

| Concept      | Size                       | Notes                                                   |
| ------------ | -------------------------- | ------------------------------------------------------- |
| Card side    | A6, 148 × 105 mm           | One face of the card (front or back).                   |
| Card (sheet) | A5, 210 × 148 mm           | Front and back placed next to each other; fold in half. |

### 3.1 Orientation

- **Default: landscape** card sides (148 × 105 mm), as in the reference card. Front and back are stacked on an A5
  **portrait** sheet and folded horizontally.
- **Toggle to portrait:** a single click rotates the card to portrait sides (105 × 148 mm), placed next to each other
  on an A5 **landscape** sheet and folded vertically.
- Orientation is stored per item. Switching orientation swaps the grid's columns / rows; boxes that no longer fit are
  clamped to the grid and get the overflow warning (5.4).

### 3.2 Print Modes

The physical card size is the same in every mode. Cards are never scaled up to fill the paper.

- **A5 fold mode:** one card per A5 sheet. Front and back next to each other with a fold line between them.
- **A4 fold mode:** two A5 cards on one A4 sheet, with cut lines between them and a fold line through each card.
- **Duplex mode:** fronts on one page and backs on the next, with the backs mirrored so they line up when printed
  double-sided. No fold line.

### 3.3 Printing One or Many

- **Single item (default path):** the Print / Export button on the Item Canvas prints just that card. This must stay a
  one-click action.
- **Batch:** on the item dashboard the user can select several items and print them in one job. Cards are packed into
  the chosen mode (e.g. 4 items in A4 fold mode = 2 sheets). Selection is optional and never in the way of printing
  a single card.
- **Output:** browser print and **PDF export**, reusing the approach of `lib/canvas/export-pdf.ts`.

### 3.4 Print Marks

- Fold line: thin dashed line between front and back (fold modes only).
- Cut lines: crop marks or a thin dashed line between cards on A4.
- Margins: a small safe area inside each side, so content is not lost to printer margins or the fold.

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
| `background`         | object      | `{ kind: "color", value }` or `{ kind: "image", ref }`.                     |

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

- **The Item Forge is the single source of truth.** Every piece of content (name, description, stats, and also
  free-text blocks) is stored in the item data, never only inside a box.
- **Boxes are views.** A box references a field or a text block by id. Removing a box from the card never deletes the
  content: it stays in the Forge and can be dragged back on.
- **Free-text blocks:** the Forge has a list of named text blocks (e.g. "Flavour", "Active: Calm Emotions"). The
  Canvas palette lists them, and a Text Box is bound to one of them. Unused blocks are visibly marked as "not on card".
- **Inline editing:** the Canvas may allow editing text directly in a box for convenience, but the edit writes back to
  the Forge field. There is no box-local content.
- **Undo / redo:** Ctrl+Z / Ctrl+Shift+Z within a session, for layout changes on the Item Canvas. Follow the
  character canvas implementation in `lib/store/canvas-store.ts` (snapshot `history` / `future` stacks, `MAX_HISTORY`).
  No persistent version history.

### 5.1 Layout

- **Left:** box palette (section 6), with a section listing the item's fields and text blocks to drag on.
- **Center:** the card, front and back shown next to each other at real aspect ratio.
- **Top bar:** print mode toggle (A5 / A4), print / export button, save state.

### 5.2 Grid & Placement

- Each side has its own grid with square cells, same mechanics as the character canvas: snap-to-grid, drag to move,
  resize, lock, delete (ideation.md 11.3 - 11.5).
- **Grid size:** not decided yet. Keep it in one constant (e.g. `ITEM_CARD_GRID_COLS` next to `DEFAULT_CANVAS_COLS`
  in `lib/types/canvas.ts`) with rows derived from the side's aspect ratio, so it can be tuned later. Hardcoded is
  fine, but never spread through components.
- Box rotation: not needed initially.
- Reuse the dnd-kit setup and widget patterns from `components/canvas` where possible. A shared grid component is
  preferred over a copy.

### 5.3 Data Binding

- Boxes are bound to the item's fields: editing the name in the Item Forge updates the Name box, and inline edits on
  the Canvas write back to the Forge (see 5.0).
- A field can appear on either side. The user decides how much text goes on the front.

### 5.4 Overflow & Font Size

- Because the card size is fixed, text can be too long for its box.
- Text is **clipped** at the box edge, never auto-shrunk without the user asking.
- When a box's content overflows, the box shows a **visible warning** in the editor (e.g. a warning icon and outline
  in the destructive color). The warning is never printed.
- Every text box has a **font size control** in its toolbar, so the user can fix overflow themselves.
- Optional **"Fit text"** button: sets the largest font size at which the content fits. A one-off action, not a live
  auto-fit.

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

| Box                | Bound to                         | Printed output                                                         |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------- |
| Name               | `name`                           | Large title in the card heading font.                                  |
| Type Line          | `type`, `subtype`, `rarity`, `requiresAttunement` | E.g. "Light armor (studded leather), rare (requires attunement)". |
| Properties         | `properties`                     | Comma-separated list or chips.                                         |
| Stat Line          | `statLine`                       | E.g. "AC 12 + Dex".                                                    |
| Item Image         | `itemImage`                      | Framed picture.                                                        |
| Text Box           | one Forge text block (`textBlocks[id]`) | Open text, for anything. Content lives in the Forge.           |
| Description        | `description`                    | Rendered markdown.                                                     |
| Charges Counter    | `charges`                        | `____ / 3` plus recharge text. The used number is **always blank**.    |
| Charge Pips        | `charges`                        | Optional alternative: a row of empty circles to tick off.              |
| Text Panel         | -                                | A framed, readable panel that sits on top of a background image.      |
| Weight             | `weight`                         | E.g. "13 lb."                                                          |
| Source             | `source`                         | Small footer text.                                                     |
| Divider            | -                                | Decorative line.                                                       |

**Charges rule:** the counter shows the maximum but leaves the current value empty, because it is filled in with a
pencil during play. This matches the `Blank` print state of the character canvas.

---

## 7. Visual Style

- **Background:** one background per card, either a solid color or an uploaded image, applied to both sides.
- **Back side option:** the back can also be left with only the background (no boxes), for a clean card back.
- **Frame:** a border around each side (the reference uses a brown rounded frame). Frame color selectable.
- **Fonts:** a heading font for the name and a readable body font. Pick from a small curated set.
- **Colors in the app UI** follow `AGENTS.md`: CSS variables from `app/globals.css` only, no `dark:` variants.
  Card colors chosen by the user are **content** (stored in the item data), not app theme colors, and must not be
  affected by dark mode.

### 7.1 Reference

- Draft armor card "Gloomwrought Studded Leather Armor" (shared in the project thread): landscape, name + type line +
  stat line next to the image on the front; description, charges, source and weight on a text panel over a tavern
  background on the back.
- A Mythcover card with text on the front will be added as a second reference.

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
            "source": "BMT, page 67", "itemImage": "<ref>",
            "background": { "kind": "image", "ref": "<ref>" } },
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

1. **Second reference:** a Mythcover card with text on the front will be added; it may influence the default
   template (5.5) and box styling.
2. **Fonts and frames:** which curated fonts and frame styles to offer.

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
