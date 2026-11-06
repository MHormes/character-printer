# Item Cards - design your own printable magic item cards

> **Status:** Draft v0.1 (ideation). Not yet implemented. Open questions are collected in section 9.
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

- **Dashboard:** next to the existing "Create character" button there is a **"Create item"** button. The list shows
  characters and items (as separate sections or a filter, see open questions).
- **Item cards are standalone:** they belong to a user, not to a character.
- **New pages** under `app/(app)/` (names provisional, follow the existing `forge/[id]` and `canvas/[id]` pattern):
  - `items/[id]` - the card editor (data + layout on one page, see section 5).
- Read `node_modules/next/dist/docs/` before building the route, per `AGENTS.md`.

---

## 3. Physical Format

The size of a card is **fixed**. It never grows or shrinks with its content.

| Concept      | Size                         | Notes                                                    |
| ------------ | ---------------------------- | -------------------------------------------------------- |
| Card side    | A6 landscape, 148 × 105 mm   | One face of the card (front or back).                    |
| Card (sheet) | A5 landscape, 210 × 148 mm\* | Front and back placed next to each other; fold in half.  |

\* See open question 9.1: front and back side by side on A5 landscape gives two A6 **portrait** halves
(105 × 148 mm), while the reference card is landscape. To be decided.

### 3.1 Print Modes

The user toggles between two print modes. The physical card size is the same in both.

- **A5 mode:** one card per A5 sheet. Front and back next to each other with a fold line in the middle.
- **A4 mode:** two A5 cards on one A4 sheet (stacked), with cut lines between them and fold lines through each card.
  Cards are **not** scaled up to fill the A4.

### 3.2 Print Marks

- Fold line: thin dashed line between front and back.
- Cut lines (A4 mode): crop marks or a thin dashed line between the two cards.
- Margins: a small safe area inside each side, so content is not lost to printer margins or the fold.

---

## 4. Item Data Model

Each item card is one record owned by a user. Like characters, the item is stored as a relational row with a JSON
blob for the item data and the layout (see section 8).

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
| `description`        | rich text   | Main rules and flavour text. Basic formatting (bold, italic, paragraphs).   |
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
- Both rule sets (2014 / 2024) should be searchable, see open question 9.5.

---

## 5. The Card Editor

The editor follows the Canvas idea from the character printer: a **grid per card side** on which the user drags boxes
from a palette. Data entry and layout live on the same page, because a card is small enough to edit in one view.

### 5.1 Layout

- **Left:** box palette (section 6) and the item data form (section 4), e.g. as two tabs.
- **Center:** the card, front and back shown next to each other at real aspect ratio.
- **Top bar:** print mode toggle (A5 / A4), print / export button, save state.

### 5.2 Grid & Placement

- Each side has its own grid with square cells, same mechanics as the character canvas: snap-to-grid, drag to move,
  resize, lock, delete (ideation.md 11.3 - 11.5).
- Rotation is probably not needed on cards (open question).
- Reuse the dnd-kit setup and widget patterns from `components/canvas` where possible. A shared grid component is
  preferred over a copy.

### 5.3 Data Binding

- Boxes are bound to the item's fields: editing the name in the form updates the Name box, and the other way around
  if inline editing is added.
- A field can appear on either side. The user decides how much text goes on the front.

### 5.4 Overflow Warning

- Because the card size is fixed, text can be too long for its box.
- When a box's content overflows, the box shows a **visible warning** in the editor (e.g. a warning icon and outline
  in the destructive color). The warning is never printed.
- The text is clipped, not auto-shrunk (open question: offer an optional auto-fit font size).

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
| Text Box           | free text (per box)              | Open text, for anything.                                               |
| Description        | `description`                    | Rich text.                                                             |
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

- **Background:** per card, either a solid color or an uploaded image. Applies to front and back. Open question:
  a separate background per side?
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
            "description": "...", "source": "BMT, page 67", "itemImage": "<ref>",
            "background": { "kind": "image", "ref": "<ref>" } },
  "layout": {
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

## 9. Open Questions & Gaps

1. **Orientation vs. fold:** the reference card is landscape (148 × 105 mm per side). Two landscape A6 sides form an
   A5 **portrait** sheet folded horizontally, or an A5 landscape sheet gives two portrait sides. Which one? Are both
   orientations needed?
2. **Double-sided printing:** besides the fold layout, should there be a mode that prints fronts and backs on
   separate pages for duplex printing (mirrored alignment)?
3. **Export:** browser print only, or also PDF export as with the character canvas (`lib/canvas/export-pdf.ts`)?
4. **Multiple cards per print job:** print a selection of items in one go (e.g. 4 items = 2 A4 sheets)?
5. **SRD rule set:** search both 2014 and 2024 items, or let the user pick?
6. **Rich text:** how much formatting does the description need (bold, italic, lists, inline dice like **1d3**)?
7. **Overflow:** clip with warning only, or also an optional auto-fit font size?
8. **Background per side:** one background for the whole card, or separately for front and back?
9. **Dashboard:** one combined list with a filter, or separate sections for characters and items?
10. **Card grid:** how many columns per side? Is rotation of boxes needed?
11. **Future:** add a card to a character's inventory (and generate modifiers), share items with the party, NPC sheets.

---

## 10. Suggested Implementation Phases

1. **Data & routing:** `item_cards` table + migration, server actions, store, dashboard "Create item" button, empty
   editor page.
2. **Item form:** core fields, properties tag field, image uploads, background.
3. **Card editor:** front/back grids reusing the canvas engine, default template, core boxes (Name, Type Line,
   Image, Description, Stat Line, Charges Counter, Text Box).
4. **Print:** A5 and A4 modes with fold and cut lines.
5. **Polish:** SRD pre-fill, overflow warnings, remaining boxes, saved templates.
