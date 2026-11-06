# Printable Cards - shared design system & card engine

> **Status:** Draft v0.1 (ideation). Not yet implemented.
> Central spec for everything that **all printable card tools** share. Referenced by:
> - `ideation-item-cards.md` (Item Cards)
> - `ideation-companion-cards.md` (Companion Cards)
>
> **Rule:** if a setting or behaviour applies to more than one card tool, it is defined **here**, once. The tool
> specs only describe what is specific to them (data model, domain boxes, default template).

---

## 0. How This Gets Built

1. The **Item Cards POC** is built first, straight from `ideation-item-cards.md` + this document, and refined.
2. Before the Companion tool is built, the generic parts of the item implementation are **refactored into shared
   modules** (section 7). This document is the target for that refactor.
3. The Companion tool is then built on those shared modules, adding only its own data model and boxes.

While building the item POC it is fine to keep code item-specific, but anything listed in this document should be
written so it can be lifted out later (no item fields hardcoded inside the text style toolbar, the grid, print, etc.).

---

## 1. Physical Format & Printing

Identical for every card tool.

| Concept      | Size                       | Notes                                                   |
| ------------ | -------------------------- | ------------------------------------------------------- |
| Card side    | A6, 148 × 105 mm           | One face of the card (front or back).                   |
| Card (sheet) | A5, 210 × 148 mm           | Front and back placed next to each other; fold in half. |

- **Fixed size.** A card never grows or shrinks with its content.
- **Orientation:** landscape sides by default (stacked on A5 portrait, folded horizontally), one-click toggle to
  portrait sides (side by side on A5 landscape, folded vertically). Stored per card. Switching swaps the grid's
  columns / rows; boxes that no longer fit are clamped and get the overflow warning (4.3).
- **Print modes:** A5 fold (one card per sheet), A4 fold (two cards per A4 with cut lines), Duplex (fronts and
  mirrored backs on consecutive pages, no fold line). Cards are never scaled to fill the paper.
- **Single + batch:** one-click print of the open card; optional multi-select print from the tool's dashboard.
  Batch printing may later mix card kinds (e.g. a companion and its items in one job).
- **Output:** browser print and PDF export, based on `lib/canvas/export-pdf.ts`.
- **Print marks:** dashed fold line (fold modes), crop marks / dashed cut lines on A4, a safe-area margin inside each
  side.

---

## 2. Card Theme (card-level design settings)

Every card has one **theme**: the card-wide design choices. All boxes inherit from it. The theme is **content**
(stored in the card data), never app UI colours, and is not affected by app dark mode.

| Setting           | Type                     | Notes                                                                    |
| ----------------- | ------------------------ | ------------------------------------------------------------------------ |
| `headingFont`     | font id                  | Titles and section headings (e.g. "Traits", the item / companion name).  |
| `bodyFont`        | font id                  | Running text, stat lines, lists.                                         |
| `textColor`       | colour                   | Default text colour.                                                     |
| `accentColor`     | colour                   | Section headings, heading underlines, dividers, table header row.        |
| `panelColor`      | colour + opacity         | Fill of Text Panels and framed boxes (the parchment panel in references).|
| `frame`           | `{ color, width, radius }` | Border around each side (the orange / brown rounded frame).            |
| `background`      | `{ kind: "color", value } \| { kind: "image", ref, fit }` | One background for the whole card, both sides. |
| `backBackgroundOnly` | boolean               | Back side shows only the background (clean card back).                  |

- **Theme presets:** a small set of ready-made themes (e.g. "Parchment", "Dark Tome", "Plain Print") so users don't
  start from zero. Later: user-saved themes, usable by every card kind.

### 2.1 Fonts

- One **curated font list**, shared by all tools and all text boxes. No tool has its own list.
- Each font entry: `{ id, label, family, role: "heading" | "body" | "both", weights[] }`.
- Fonts are bundled / self-hosted (`next/font` or local files) so PDF export renders exactly what the editor shows.
- The list lives in one module (e.g. `lib/cards/fonts.ts`); adding a font is a one-line change.

### 2.2 Colours

- A single **colour picker** component used everywhere a card colour is chosen: theme settings, box overrides,
  frame, panel.
- It offers: the current theme's colours first (text, accent, panel), then a small fixed swatch set, then a custom
  value. Stored as hex (plus opacity where relevant).
- The picker's own UI follows `AGENTS.md` (CSS variables, no `dark:`); the **chosen values** are card content.

### 2.3 Sizes & Units

- Font sizes in **pt** (print unit), with a shared scale: 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40.
  Custom values allowed in 0.5 pt steps.
- Layout units are grid cells (section 4.1); the mm size of a cell is derived, never typed by the user.

---

## 3. Text Style (box-level design settings)

**Every box that shows text offers the same Text Style controls.** No exceptions: if a box renders text, it gets the
full toolbar. This is the "a text area always offers font choices" rule.

```ts
type TextStyle = {
  font?: "heading" | "body" | FontId; // theme role or a specific font
  size?: number;                      // pt
  weight?: "regular" | "medium" | "bold";
  italic?: boolean;
  color?: Colour;                     // defaults to theme textColor
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;                // multiplier
  smallCaps?: boolean;                // for titles like the reference "WARHORSE"
};
```

### 3.1 Inheritance

`card theme` → `box type default` → `box override`.

- Each box type declares sensible defaults (e.g. a Name box uses `font: "heading"`, 20 pt; a Source box uses
  `font: "body"`, 7 pt, italic).
- A box stores only what the user changed. "Reset style" clears the override.
- Changing the theme's heading font updates every box that still uses `"heading"`.

### 3.2 Multi-part boxes

Some boxes have more than one text part (a statblock has labels and values, a text box has a heading and a body).
These boxes expose **named text parts**, each with its own `TextStyle`, e.g. `{ title, body }` or
`{ label, value }`. The toolbar shows a part selector. The set of parts is declared per box type.

### 3.3 The Text Style toolbar

- One shared component, shown when a text box is selected: font, size, weight, italic, colour, alignment, line
  height, small caps, part selector (when relevant), "Fit text" and "Reset style".
- Box types never build their own font / size controls.

---

## 4. Card Editor Engine

### 4.1 Grid & placement

- A grid of square cells per card side; snap-to-grid, drag to move, resize, lock, delete (ideation.md 11.3 - 11.5).
- Grid size in one constant (e.g. `CARD_GRID_COLS` in `lib/types/canvas.ts`), rows derived from the side's aspect
  ratio. To be tuned during the item POC.
- Reuse the dnd-kit setup and widget patterns from `components/canvas`; a shared grid component is preferred over a
  copy.
- No box rotation initially.

### 4.2 Centralised data

- The tool's **Forge page is the single source of truth.** Boxes are views that reference a field or a free-text
  block by id. Removing a box never deletes content.
- **Free-text blocks** (`textBlocks: { id, label, content }`) exist in every card kind; a Text Box binds to one.
  Unused blocks are marked "not on card" in the palette.
- Inline editing on the canvas writes back to the Forge field.
- **Undo / redo** per session (Ctrl+Z / Ctrl+Shift+Z), following `lib/store/canvas-store.ts` (`history` / `future`,
  `MAX_HISTORY`). No persistent version history.

### 4.3 Overflow

- Text is **clipped**, never auto-shrunk without the user asking.
- An overflowing box shows a warning in the editor (icon + outline in the destructive colour), never printed.
- Fix via the Text Style size control or the one-off **"Fit text"** action (largest size that fits).

### 4.4 Editor layout

- **Left:** box palette with two groups: **generic boxes** (section 5) and the tool's **domain boxes**, plus the
  list of the card's fields and text blocks.
- **Center:** front and back at real aspect ratio.
- **Top bar:** orientation toggle, print mode, print / export, save state, theme settings.

### 4.5 Print state of fields

As on the character canvas, play-time values print **blank** for pencil use (charges used, current HP, ...). A
shared "blank field" renderer (`____ / 19`, empty pips, empty boxes) is used by all tools.

---

## 5. Generic Box Library

These boxes exist in **every** card tool, with identical behaviour. Tool specs only add domain boxes.

| Box          | Bound to                        | Notes                                                              |
| ------------ | ------------------------------- | ------------------------------------------------------------------ |
| Title        | the card's main name field      | Heading font, large. Each tool decides which field is the title.   |
| Text Box     | one `textBlocks[id]`            | Optional heading + markdown body. Text parts `{ title, body }`.     |
| Image        | an image field of the card      | Fit: cover / contain; optional frame.                               |
| Text Panel   | -                               | Framed panel in `panelColor`, sits on top of the background; other boxes are placed on it. |
| Section Heading | -                            | A heading in accent colour with underline, e.g. "Traits".          |
| Divider      | -                               | Decorative line in accent colour.                                  |
| Tracker      | a numeric max field             | Blank counter `____ / max`, pips or boxes (variant). Used for charges, HP, uses per day. |
| Source       | `source`                        | Small footer text.                                                  |
| Notes        | -                               | Empty ruled lines to write on.                                      |

---

## 6. Shared Data Shape

Every card kind stores the same envelope; only `data` differs.

```json
{
  "kind": "item | companion",
  "data": { "...tool-specific fields...": "", "textBlocks": [], "source": "", "images": {} },
  "theme": { "headingFont": "cinzel", "bodyFont": "crimson", "textColor": "#2b1d0e",
             "accentColor": "#8b1e1e", "panelColor": { "value": "#f3e3c0", "opacity": 0.9 },
             "frame": { "color": "#f28c28", "width": 2, "radius": 4 },
             "background": { "kind": "image", "ref": "<ref>", "fit": "cover" }, "backBackgroundOnly": false },
  "layout": {
    "orientation": "landscape",
    "cols": 12,
    "front": { "widgets": [] },
    "back":  { "widgets": [] }
  }
}
```

- Widgets store `{ id, type, binding, x, y, w, h, locked, style: { [part]: TextStyle } }`.
- Images go through the existing image storage (`lib/actions/character-image.ts`, `app/api/character-images`),
  generalised to a card image upload.
- **Storage table:** the item POC uses `item_cards`. During the refactor, decide between one table per kind or one
  generic `cards` table with a `kind` column (see the open questions in both tool specs).

---

## 7. Refactor Targets (after the item POC)

Candidates to move into shared modules once the item POC is refined. Names are suggestions.

| Shared module                        | Contents                                                              |
| ------------------------------------ | --------------------------------------------------------------------- |
| `lib/cards/fonts.ts`                 | Curated font list (2.1).                                              |
| `lib/cards/theme.ts`                 | Theme type, presets, style inheritance resolver (2, 3.1).             |
| `lib/types/card.ts`                  | Card envelope, widget, `TextStyle` types (3, 6).                      |
| `components/cards/card-side-grid`    | Grid, snapping, drag / resize (4.1).                                  |
| `components/cards/text-style-toolbar`| The one Text Style toolbar (3.3).                                     |
| `components/cards/colour-picker`     | The one colour picker (2.2).                                          |
| `components/cards/boxes/*`           | Generic boxes (5).                                                    |
| `components/cards/overflow`          | Overflow detection, warning, "Fit text" (4.3).                        |
| `lib/cards/print.ts`                 | Print modes, marks, PDF export (1).                                   |
| `lib/store/card-editor-store.ts`     | Layout state + undo / redo, parameterised by card kind (4.2).         |
| `components/forge/*`                 | Markdown field, tag field, text block list, image upload: shared Forge fields. |

---

## 8. Open Questions (shared)

1. Which fonts go in the curated list, and which theme presets do we ship?
2. Frame styles: only colour / width / radius, or also decorative frame images (corners, ornaments)?
3. Should the theme be per card only, or can a user set a **default theme** for all new cards (of any kind)?
