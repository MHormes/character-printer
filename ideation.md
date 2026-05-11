# D&D character sheet fixing - easy to update, easy to print

Roll20 character sheet clone (but better!)

## Ideas

Main character section - race, class, stats, expertise, inventory etc -> start plain input, move to premade options (5e & 5.5 support?)
Desgin section - dragable elements (e.g. main stats, skills, inventory, gold, feature list). Filled & synced by main character section. Placeable on grid

## Technical

- **Framework:** Next.js (App Router) - Provides a unified stack for Frontend (React) and Backend (API Routes/Server Actions).
- **ORM:** Drizzle ORM - Type-safe, lightweight, and supports both SQLite and PostgreSQL.
- **Database:**
  - **Development:** SQLite (Local file-based, fast iteration).
  - **Production:** PostgreSQL (Robust, scalable).
- **Storage Strategy (Hybrid Relational/JSON):**
  - **Relational Tables:** Used for top-level entities (Users, Characters) to ensure referential integrity.
  - **JSON Blob Storage:** The complex "Data Forge" and "Canvas Layout" will be stored as structured JSON objects. This allows for high-performance "single-load" of the entire character state, avoiding complex JOINs.
- **State Management:** **Zustand** - Acts as the "Single Source of Truth" in the browser. It ensures that any change in the Data Forge (e.g., updating a stat) reactively and instantly updates all linked widgets on the Canvas.
- **Styling & UI:** **shadcn/ui** (with **Tailwind CSS**) - For a modern, accessible UI and rapid component development.
- **Drag-and-Drop:** **dnd-kit** - A modular, accessible drag-and-drop library for React that will handle widget placement and reordering on the grid.
- **Authentication:** NextAuth.js or Clerk (TBD) for account-based character management.

---

## 1. Identity & Scaling (Top-Level Selection)

This section acts as the primary character header and the "engine" for proficiency-based calculations.

### 1.1 Identity Fields

Standard string inputs for character documentation. These do not affect mechanics but are mapped to the Canvas widgets:

- **Character Name**, **Alignment**, **Deity/Patron**, **Background Name**, **Race**, **Class**.
- **Initial Phase:** All fields are manual text inputs.
- **Future Improvement:** Race and Class fields will link to the compendium.

### 1.2 Level & Class Scaling

- **Character Level (Integer):** Automatically calculates **Proficiency Bonus**: `2 + floor((Level - 1) / 4)`.
- **Class Management:**
  - Supports multi-classing via an "Add Class" interface.
  - Each entry stores `Class Name`, `Class Level`, and `Hit Die` (d6 / d8 / d10 / d12 select, defaults to d8).
  - Hit Die is informational in the Classes section but drives the Max HP formula in Section 5.
  - **Future Improvement:** Hit Die auto-filled when selecting a Class from the compendium.

### 1.3 Selection Logic

- **Initial Phase:** User manually types Race and Class. No automated injection occurs.
- **Future Improvement (Compendium Hooks):** Selecting a Race or Class from the compendium automatically triggers the injection of relevant modifiers into the **Attribute Modifier Stacks & Saving Throw Modifier Stack** (Section 2).
- **Custom/Homebrew:** Users can always bypass compendium logic by selecting "Custom," allowing for manual entry of all identity-based bonuses (this remains the default in the Initial Phase).

---

## 2. Core Attribute System & Saving Throws

This section handles the "Base + Stack" model for the character's physical and mental foundation. Saving Throws are included here as they are tightly coupled with Core Attributes.

### 2.1 Data Structure (Attributes & Saves)

Each of the six stats (Str, Dex, Con, Int, Wis, Cha) and their corresponding Saving Throws contain:

- **Base Score (Integer):** The raw value (for Attributes) or the starting calculation (for Saves).
- **The Modifier Stack (List of Objects):** Labeled bonuses that sum to the total.
  - `Source Name`: (e.g., "Dwarf", "ASI Level 4", "Cloak of Protection").
  - `Value`: (Integer).
  - `Is_Active`: (Boolean): Toggle to enable/disable without deleting.
- **Proficiency Toggle (Boolean):** (Saves Only) Adds the Proficiency Bonus to the stack if enabled.
- **Manual Override (Nullable Integer):** A priority field to force a specific total.

### 2.2 Calculation & Resolution

- **Attribute Total:**
  - If `Override` is active → Use `Override Value`.
  - Otherwise → `Base Score` + `Sum(Active Modifiers)`.
- **Attribute Modifier:** `floor((Total - 10) / 2)`.
- **Saving Throw Total:**
  - If `Override` is active → Use `Override Value`.
  - Otherwise → `Attribute Modifier` + `Sum(Active Modifiers)` + (if `Proficient` ? `Proficiency Bonus` : 0).

### 2.3 User Interaction

- **Transparent Math:** Clicking (or hover over) any Total Score expands the stack to show exactly where every +1 originates.
- **Instant Overwrite:** Typing into a "Ghost Value" field enables the `Manual Override`.
- **Initial Phase:** Users manually add all entries to the stack (e.g., "+2 Racial").
- **Future Improvement (Smart Item Link):** Equipped items that grant +1 to All Saves or specific Stats automatically push labeled entries to the relevant stacks.
- **Sync/Revert:** A one-click icon to clear manual overrides and snap back to the "Standard" math.

---

## 3. Skills & Proficiencies

This section manages trained abilities. To minimize "choice-path" bugs, it provides a flat list of skills with manual proficiency toggles and automated calculations.

### 3.1 Skill Data Structure

Each Skill (e.g., Athletics, Stealth) contains:

- **State (Enum):** `None`, `Proficient`, or `Expertise`.
- **Attribute Link:** A hard link to the standard Core Attribute (e.g., Perception -> Wis).
- **Modifier Stack (List of ModifierEntry):** System-managed bonuses pushed by equipped inventory items (e.g., Boots of Elvenkind → Stealth +5). These entries are read-only in the UI; they cannot be deleted or edited directly — only by modifying the source item in the inventory.
- **Manual Override (Nullable Integer):** A priority field for the final bonus (auto enables override toggle).
- **Override Toggle (Boolean):** Flag to bypass automation.

`CharacterData` also stores two skill-wide settings:

- **Jack of All Trades (Boolean):** When enabled, adds `floor(Proficiency Bonus / 2)` to all skills in `None` state (Bard class feature). Does not affect `Proficient` or `Expertise` skills.
- **Skill Global Modifier Stack (List of ModifierEntry):** A shared bonus applied to every skill's ghost value (e.g., a Ring of Skill). Works identically to the Saving Throw global stack in Section 2.

### 3.2 Calculation Logic

The system displays a "Ghost Number" based on the following:

1.  **Base:** The current **Resolved Attribute Modifier** from Section 2.
2.  **Proficiency:**
    - If `Proficient` → Add `Proficiency Bonus`.
    - If `Expertise` → Add `Proficiency Bonus * 2`.
    - If `None` and **Jack of All Trades** is enabled → Add `floor(Proficiency Bonus / 2)`.
3.  **Global Modifier:** Add `Sum(Active Global Skill Modifiers)`.
4.  **Resolution:** If `Override Toggle` is TRUE, use the `Manual Override`; otherwise, use the calculated sum.

### 3.3 User Interaction

- **Simple Toggles:** Users manually select their proficiency level.
- **Jack of All Trades Toggle:** Single button at the top of the Skills section to enable/disable the Bard feature globally.
- **Global Modifier Stack:** Collapsable list of labeled bonuses beneath the skill list. Any active entry shifts every skill's ghost value.
- **Initial Phase:** All toggles are manual based on the user's knowledge of their Class/Background.
- **Future Improvement:** Auto-toggling based on Class/Background choices.
- **Re-binding (Optional/Edge Case):** While skills are linked to default attributes, users wanting "Strength (Intimidation)" should use the **Manual Override** to set the correct total for that specific printout.
- **Sync/Revert:** A one-click icon to clear manual overrides and snap back to the "Standard" math.

---

## 4. Tools & Other Proficiencies

This section tracks specialized knowledge such as Artisan Tools, Gaming Sets, Musical Instruments, Vehicles, and Languages. It is a dynamic list that allows for infinite expansion.

### 4.1 Data Structure

Each entry in this list is a standalone object containing:

- **Name (String):** (e.g., "Thieves' Tools", "Dwarvish").
- **Category (Enum):** [Tool, Language, Vehicle, Weapon, Armor].
- **Training State (Enum):** `Proficient` or `Expertise`.
- **Stat used (Nullable Enum):** Which of the base stats should be used to calculate the total modifier value (null can be used to only use training state).
- **Modifier (Integer):** Modifier value based on training state and selected stat to be used.
- **Manual Override (Nullable Integer):** For custom or situational bonuses (similar to stats & skills).

### 4.2 Entry Logic

- **Initial Phase (Manual-First):** The user simply hits an "Add New" button, types the name, and selects the state/stat.
- **Future Improvement (Auto-Population):** Selecting a Race or Class from the compendium pushes **Hard-Set** proficiencies to this list (e.g., a Rogue automatically gets "Thieves' Tools").
- **No Validation:** The tool does not limit how many proficiencies are added, allowing for total homebrew and "Variant Rule" support.

### 4.3 User Interaction

- **Dynamic List:** Users can add, edit, or delete entries at any time.
- **The "Ghost" Bonus:** The UI displays the calculated Proficiency Bonus (from Section 1) next to the entry.
- **Canvas Output:** For the Print Canvas, these are aggregated into a single "Proficiencies & Languages" text block, grouped by Category.

---

## 5. Combat Stats

This section calculates the core survival and reactive statistics. It relies on the **Attribute Modifiers** from Section 2.

### 5.1 Armor Class (AC) Logic

AC uses two modes plus a shared modifier stack and ghost total:

- **Mode A: Standard (Automatic):**
  - Base formula: `10 + Dex Modifier`.
- **Mode B: Formula Builder (Custom):**
  - Allows the user to define: `Base Value (Int)` + `Stat A (Nullable)` + `Stat B (Nullable)`.
  - _Example (Unarmored Defense):_ `10 + Dex + Con`.
  - _Example (Plate Armor):_ `18 + null + null`.
- **Modifier Stack (both modes):** A labeled bonus stack identical to Core Attributes — used for shields, magic items, spells, etc. (e.g., "Shield: +2", "Ring of Protection: +1"). Future improvement: automatically seeded by equipped items from Section 6.
- **Ghost Total:** Calculated as `base formula + Sum(Active Modifiers)`. Typing a value into the total field enables a **Manual Override** (same pattern as other sections). A reset button reverts to the calculated total.
- **Initial Phase:** User manually selects Mode and populates the modifier stack.
- **Future Improvement:** Equipped armor from Section 6 will automatically populate the modifier stack.

### 5.2 Initiative & Speed

- **Initiative:**
  - **Ghost Value:** Calculated as the `Dexterity Modifier`. Adds a tiebreaker using the `Dexterity Stat`.
  - **Modifier Stack:** Similar to Core Attributes, users can add labeled bonuses (e.g., "Alert Feat: +5").
- **Speed:**
  - **Base Value:** Set by the selected Race (e.g., 30ft).
  - **Initial Phase:** Manual input for Base Value.
  - **Future Improvement:** Auto-set from Race selection.
  - **Modifier Stack:** For items or features (e.g., "Barbarian Fast Movement: +10").

### 5.3 Health Points (HP)

- **Max HP:**
  - Displayed as a ghost value calculated from the class list (Section 1.2). Typing a value into the field enables a **Manual Override**; a reset button reverts to the formula.
  - **Single-class formula:** `(HitDie + Con) + ((Level - 1) × (floor(HitDie / 2) + 1 + Con))`
    - Level 1 always grants maximum die roll.
    - `avg(HitDie) = floor(die / 2) + 1` (e.g. d8 → 5, d10 → 6).
  - **Multiclass formula:** The "level 1 max roll" applies only to level 1 of the **first** class added. Every subsequent level of that class and all levels of additional classes use the average roll:
    - First class: `(HitDie + Con) + ((classLevel - 1) × (avg + Con))`
    - Each additional class: `classLevel × (avg + Con)`
  - **Modifier Stack:** Added on top of the formula total. Each entry has a source label, value, and active toggle (e.g. "Tough feat: +10", "Draconic Resilience: +5"). Same pattern as AC/Initiative/Speed stacks.
  - **Future Improvement:** Support for rolled HP per level instead of fixed average.
- **Hit Dice:**
  - Read-only, auto-derived from the class list. Displays `<level><hitDie> (Class Name)` per class (e.g. `5d10 (Fighter)`). No manual entry needed.

### 5.4 User Interaction

- **Live Updates:** Changing the Dexterity score in Section 2 immediately updates the Ghost Values for AC (if in Mode A) and Initiative.
- **Visual Clarity:** Overridden values are highlighted to remind the user the "Auto-Math" is currently disabled.
- **Sync/Revert:** A one-click icon to clear manual overrides and snap back to the "Standard" math.

---

## 6. Inventory & Equipment

The inventory is a flat list of items that handles both physical tracking and mechanical bonuses. It focuses on item properties rather than currency, as currency is handled during active play.

### 6.1 Item Data Structure

Each item entry consists of the following data points:

- **Name (String):** The name of the item.
- **Weight (Decimal):** The weight in lbs.
- **Category (Enum):** [Weapon, Armor, Tool, Consumable, Wondrous, Mundane].
- **Equipped State (Boolean):** A toggle determining if the item's modifiers are currently active.
- **Modifier Stack (List of Objects):**
  - `Target Field`: (e.g., "Strength Score", "AC Base", "All Saves", "Stealth Skill").
  - `Value`: (Integer).
  - `Type`: (e.g., "Bonus", "Set To").

### 6.2 The "Broadcast" Logic

This is the core integration between the Inventory and the rest of the Data Forge. Implemented via `lib/character/modifier-sync.ts`, which runs every time inventory changes.

- **System-Managed Entries:** Each `ModifierEntry` carries an optional `itemId` field. When set, the entry was created automatically by an inventory item and is read-only in all stack UIs (shown with a lock icon, no delete button, no edit fields).
- **Active Bonus:** When an item's `Equipped State` is TRUE, a `ModifierEntry` with `isActive: true` is injected into the target stack (e.g., a Ring of Protection pushes `+1` to `combat.ac.stack`).
- **Unequip:** Setting `Equipped State` to FALSE keeps the entry in the stack but sets `isActive: false`, so the bonus is suspended without losing the configuration.
- **Delete:** Removing an item purges all its `ModifierEntry` objects from every stack they were injected into.
- **Rebuild Strategy:** On every inventory change the sync function clears all `itemId` entries across all stacks and re-injects from the current inventory state. This is idempotent and correct regardless of what changed.
- **Conflict Resolution:** If multiple items affect the same field (e.g., two different sets of Armor), the user manages this by toggling `Equipped State`.

### 6.3 Automation vs. Manual

- **Initial Phase:** Users manually create items and define their Modifier Stacks.
- **Future Improvement (Compendium Items):** Adding a "Shield" from the compendium automatically populates the Modifier Stack with `Target: AC, Value: +2`.
- **Custom Items:** Users can always create an item from scratch, name it "Homebrew Boots," and manually add a modifier like `Target: Speed, Value: +10`.

### 6.4 Inventory Calculations

- **Total Weight:** A ghost value at the bottom of the list summing all `Weight` values.
- **Encumbrance (Optional):** A simple check against `Strength * 15` to highlight the weight total in red if it exceeds the limit.

### 6.5 User Interaction

- **Add/Delete:** Standard list management.
- **The "Equip" Toggle:** A prominent checkbox next to each item. Weapons and Armor are the most common users of this toggle.
- **Modifier Modal:** A sub-menu within the item to add or edit the modifiers it grants to the character.

---

## 7. Attacks & Spell Actions

This section tracks offensive and utility actions. It uses a "Standard DC" for the character's primary magic while allowing for item-specific overrides and multi-layered damage types.

### 7.1 Global Spell Casting

- **Standard Spell DC:** A ghost value calculated as `8 + Proficiency + Linked Spellcasting Modifier`.
- **Standard Attack Bonus:** A ghost value calculated as `Proficiency + Linked Spellcasting Modifier`.
- **Global Linked Attribute:** A dropdown to set the primary casting stat (e.g., Wis for Cleric).

### 7.2 Action Data Structure

Each Attack or Spell entry contains:

- **Name (String):** (e.g., "Longsword", "Fireball", "Spider Staff").
- **Mode (Enum):** Four modes cover all D&D 5e offensive and restorative options:
  - `Spell`: Uses the global **Spell Attack Bonus** (`Proficiency + Casting Mod`). For cantrips and spell attack rolls (e.g., Fire Bolt, Eldritch Blast).
  - `DC`: Uses the global **Spell Save DC** (`8 + Proficiency + Casting Mod`) with an optional **Fixed DC Override** for item-based DCs (e.g., "DC 13" on a Spider Staff). For saving throw spells (e.g., Fireball, Sleep).
  - `Attack`: Manual weapon/ability attack. User selects a **Stat Modifier** (STR/DEX/CON/INT/WIS/CHA), toggles a **Proficiency** button, and optionally adds a **flat bonus** (e.g., +1 for a magic weapon). Covers weapon attacks, unarmed strikes, finesse weapons, and special ability attacks.
  - `Heal`: No attack roll or save DC. The effect stack is relabeled as **Healing** and defines restorative amounts (e.g., `1d8 + WIS` for Cure Wounds, `2d4 + WIS` for Healing Word). Stat modifier optional.
- **To Hit / DC Total:** The resolved number shown inline based on the mode selected.
- **Damage/Effect Stack (List of Objects):**
  - `Dice Count` (Integer) + `Die Type` (Enum: d4/d6/d8/d10/d12/d20/d100): structured dice fields.
  - `Stat` (Nullable Enum): optional attribute modifier added to the roll.
  - `Flat Bonus` (Integer): optional fixed bonus.
  - `Type`: (e.g., "Slashing", "Fire").
  - `Is_Active`: Toggle for conditional damage (e.g., "Sneak Attack").
  - **Collapsed display:** stat mod and flat bonus are summed into a single total (e.g., `1d8+3` not `1d8+2+1`).
- **Properties/Notes:** A text area for range, save types, or flavor text.

### 7.3 Damage Logic

By using a **Damage Stack**, a single attack can resolve multiple lines of math simultaneously:

- _Example (Flame Tongue):_
  1. `2d6 + Str` (Slashing)
  2. `2d6` (Fire)
- This ensures that on the Canvas/Print tab, the user sees the full breakdown of what happens when they hit.

### 7.4 User Interaction

- **Override Toggle:** A simple switch on each action to move from "Standard" (Auto-calc) to "Fixed" (for items like the _Spider Staff_ that have their own DC).
- **Stack Management:** Users can add as many damage lines as needed to an attack.
- **Ghost Values:** Calculations update in real-time as Section 1 (Level) or Section 2 (Stats) change.
- **Future Improvement:** Auto-generating attack actions from equipped weapons in Inventory.

---

## 8. Features & Traits

This section acts as the character's "Ability Dictionary." It aggregates text-based descriptions from your Race, Class, Background, and Feats into a single organized list.

### 8.1 Feature Data Structure

Each entry is a standardized block containing:

- **Feature Name (String):** (e.g., "Darkvision", "Second Wind", "Sentinel").
- **Source (String/Enum):** (e.g., "High Elf", "Fighter 2", "Feat").
- **Description (Markdown Text):** The full mechanical or flavor text of the ability.

### 8.2 Logic & Auto-Population

- **Initial Phase:** Fully manual text entry for all features.
- **Future Improvement (Compendium Injection):** When a user selects a Race or Class in Section 1, the Data Forge automatically "pushes" the corresponding features into this list.
- **Manual Additions:** A "New Feature" button allows users to manually type in homebrew abilities or specific Feats they’ve chosen.
- **Item-Linked Features:** If a "Smart Item" from Section 6 is equipped and has a unique passive ability, that description is mirrored here automatically.

### 8.3 User Interaction

- **Categorization:** Features are visually grouped by their source (e.g., all "Racial Traits" together) for easier browsing.
- **Editability:** Even auto-populated features can be edited by the user to shorten text or add personal notes.

---

## 9. Usage Counters & Resource Tracking

This section defines the mathematical "ceiling" and recovery rules for finite resources (e.g., Rage, Bardic Inspiration, Spell Slots). It focuses on the maximum capacity, while the current usage is handled in the Canvas.

### 9.1 Data Structure

Each tracker entry contains:

- **Name (String):** (e.g., "Superiority Dice", "Lay on Hands").
- **Base Value (Integer):** The starting count.
- **The Modifier Stack (List of Objects):** Labeled bonuses that sum to the total.
  - `Source Name`: (e.g., "Charisma Modifier", "Level Bonus").
  - `Value`: (Integer).
  - `Is_Active`: (Boolean).
- **Reset Condition (Enum):** [Short Rest, Long Rest, Dawn, Special].
- **Manual Override (Nullable Integer):** A priority field to force a specific total.

### 9.2 Calculation & Resolution

- **The "Ghost Number":** Displayed as `Base Value + Sum(Active Modifiers)`.
- **Resolution:**
  - If `Override` is active → Use `Override Value`.
  - Otherwise → Use the `Ghost Number`.
- **Dynamic Updates:** If a stack entry is linked to an Attribute (e.g., "Cha Mod"), changing that Attribute in Section 2 immediately updates the Ghost Number here.

### 9.3 User Interaction

- **Standard Stack Toggles:** Users can add or remove modifiers to build the resource total (e.g., "Base 0" + "Level 5" + "Wis Mod 3" = 8).
- **Instant Overwrite:** Typing directly into the total field enables the `Manual Override`, bypassing the stack math.
- **Sync/Revert:** A one-click icon to clear the `Manual Override` and snap the tracker back to the calculated Ghost Number.
- **Initial Phase:** All tracker setups are manual.
- **Future Improvement:** Automated tracking for Ki, Sorcery Points, etc., based on Class and Level.

---

## 10. Spellcasting & Spellbook

This section manages the character’s magical repertoire and the slots required to cast them. It distinguishes between the "Daily Energy" (Slots) and the "Knowledge" (Spell List).

### 10.1 Spell Slot Trackers

Instead of a single tracker, this is a grid for Levels 1 through 9:

- **Base Value (Integer):** The standard number of slots for that level based on Class/Level.
- **The Modifier Stack (List of Objects):** Labeled bonuses (e.g., "Pearl of Power", "Boon").
- **Manual Override (Nullable Integer):** A priority field to force a specific slot count.
- **Ghost Total:** `Base Value + Sum(Active Modifiers)` (or the Override if active).
- **Revert Button:** Clears the override to snap back to calculated class totals.

### 10.2 Spell List Data Structure

Each spell entry is a comprehensive object designed to generate a "Spell Card" in the Canvas view:

- **Core Info:**
  - **Name (String):** (e.g., "Cure Wounds", "Fireball").
  - **Level (Integer):** 0 (Cantrip) through 9.
  - **School (Enum):** (e.g., Evocation, Abjuration).
  - **Casting Time (String):** (e.g., "1 Action", "1 Bonus Action").
  - **Range (String):** (e.g., "60 feet", "Touch").
  - **Duration (String):** (e.g., "Instantaneous", "Concentration, up to 1 minute").
- **Mechanical Logic:**
  - **Mode (Enum):** `Attack` | `Spell` | `DC` | `Heal` — same four modes as Section 7.
    - `Spell`: uses global spell attack bonus (Proficiency + Casting Mod).
    - `DC`: uses global Spell Save DC with an optional fixed override for item-based DCs.
    - `Attack`: custom stat + proficiency + flat bonus, for unusual melee/touch spell attacks.
    - `Heal`: no attack roll or DC; effect stack relabeled as Healing.
  - **Damage/Effect Stack:** same structured `DamageEntry` as Section 7 — dice count + die type + optional stat modifier + flat bonus + damage type + active toggle. Collapsed pill shows mode label + combined damage total.
- **Text & Tags:**
  - **Description (Markdown):** The full spell text.
  - **At Higher Levels (String):** Free-text description of upcast behavior (e.g., "When cast using a 3rd-level slot or higher, the damage increases by 1d8 for each slot above 2nd"). Not shown for cantrips.
  - **Components (Object):** Structured flags instead of a raw string.
    - `verbal` (Boolean), `somatic` (Boolean), `material` (Boolean).
    - `materialDesc` (String): the actual material requirements, enabled only when `material` is true.
  - **Tags (Flags):** Ritual, Concentration, Prepared.
  - **Spell card intent:** The full spell data structure is designed to generate printable Spell Cards on the Canvas.

### 10.3 Automation & Logic

- **Initial Phase:** Manual entry of spell slot counts and manual creation of spell cards.
- **Future Improvement (Slot Auto-Fill):** Selecting a Class and Level in Section 1 populates the `Base Value` for the slot grid according to the 5e multiclassing or single-class tables.
- **The "Spellcasting Ability" Link:** Spells default to the Global Spell Casting stat defined in Section 7, but each spell can be individually swapped to a different attribute (for feats like Magic Initiate).

### 10.4 User Interaction

- **Add Spell:** Opens a searchable compendium (Future) or a blank template for homebrew (Initial).
- **Slot Management:** A simple table view where users can toggle the "Modifier Stack" to account for specialized items or multiclassing quirks.
- **Sync/Revert:** Standard reset buttons on every slot level and spell-specific DC to return to the calculated baseline.

---

## 11. Full-Page Overlays

Users can toggle full-page view overlays over the canvas to display comprehensive data, regardless of grid size:

- **Features & Traits Overlay:** Displays full name and description for all character features.
- **Spellbook Overlay:** Lists all known spells with their full details.
- **Interaction:** These overlays are triggered via a new control section located above the element palette, allowing users to switch between the main canvas and full-page information views.

---

## 12. The Canvas (Design Page)

The **Canvas** is the layout engine that transforms data from the Forge into a printable sheet. It handles the "where" and "how" of the final output.

### 11.1 The Grid-Based Workspace

- **A4 Paper Bounds:** The canvas represents a single A4 page (210 × 297 mm, portrait). The on-screen preview maintains the exact `210/297` aspect ratio so WYSIWYG holds for printing.
- **Adjustable Grid:** The user sets the number of columns via the Grid control. Rows are derived automatically as `ceil(cols × 297/210)` to guarantee square cells. Default: 20 cols → 29 rows.
- **Grid Coordinates:** All widget positions are stored as `(col, row)` integer pairs (0-indexed), not pixels. Cell size in pixels = `canvasWidth / cols` and `canvasHeight / rows` (always equal due to square cells).
- **Snap-to-Grid:** Widgets always snap to the nearest grid cell on drop. No free-float positioning.
- **Print Output:** The browser `@media print` rule forces `#print-canvas` to fill the A4 page exactly. `print-color-adjust: exact` ensures grid lines and widget backgrounds render on paper.

### 11.2 The Widget Palette (Sidebar)

The left 1/4 of the Canvas page is a scrollable **Widget Palette** — a catalogue of tiles that can be dragged onto the grid.

- **Tile Appearance:** Each palette tile is a compact preview of the widget (label + rough shape), sized to communicate its default grid footprint (e.g., a 1 × 6 tile renders as a tall narrow rectangle).
- **Categories:** Tiles are grouped by Forge section (Identity, Stats, Skills, Combat, Inventory, etc.).
- **Initial Phase:** A single generic **Box (1 × 6)** tile is available as a placeholder. It renders as a bordered rectangle with no data binding.
- **Future Improvement:** Data-linked tiles per Forge section (e.g., `StatsWidget`, `SkillsWidget`, `HPWidget`) are added as those sections are finalized.

### 11.3 Drag-and-Drop Placement

Implemented with **dnd-kit**.

- **Start Drag:** Click-hold on a palette tile. A ghost preview follows the cursor over the grid, snapping to the cell under the pointer.
- **Drop:** Releasing over the grid places the widget. Its `col` and `row` are set to the top-left corner of the snapped position. If the widget footprint would overflow the grid bounds it is clamped to fit.
- **Already-Placed Widgets:** Can be picked up and repositioned by click-dragging from the grid. Locked widgets are immune to drag.
- **Collision:** No collision detection in the initial phase — widgets can overlap. Future improvement: optional overlap prevention.

### 11.4 Widget State

Each placed widget carries the following runtime state (persisted in the `canvas` JSON blob):

| Field        | Type                    | Description                                                                                                        |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`         | uuid                    | Unique instance identifier                                                                                         |
| `type`       | enum                    | Widget kind (`Box`, `StatsWidget`, …)                                                                              |
| `col`        | integer                 | Left edge column (0-indexed)                                                                                       |
| `row`        | integer                 | Top edge row (0-indexed)                                                                                           |
| `w`          | integer                 | Width in grid columns                                                                                              |
| `h`          | integer                 | Height in grid rows                                                                                                |
| `rotation`   | 0 \| 90 \| 180 \| 270   | Clockwise degrees. When 90° or 270°, the effective footprint swaps `w` and `h` for collision and bounds checking.  |
| `locked`     | boolean                 | When `true`, drag is disabled. Rotation and other controls remain accessible.                                      |
| `printState` | `Calculated` \| `Blank` | Controls printed output: `Calculated` shows the live data value; `Blank` prints an empty line for pencil tracking. |

### 11.5 Per-Widget Controls

Clicking a placed widget **selects** it and surfaces an inline toolbar:

- **Rotate (CW):** Cycles `rotation` through 0 → 90 → 180 → 270 → 0. Icon: `RotateCw`.
- **Lock / Unlock:** Toggles `locked`. When locked, a `Lock` icon is shown on the widget body itself as a persistent visual indicator. Icon: `Lock` / `Unlock`.
- **Delete:** Removes the widget from the canvas. Only available when unlocked.

### 11.6 Data Sync & Print State

- **Live Preview:** Forge updates (e.g., leveling up) reflect instantly on the Canvas for data-linked widgets.
- **Print State Toggle:** Per-widget control to switch between `Calculated` (prints current value) and `Blank` (prints underline for pencil tracking).

### 11.7 Multi-Page Support

Characters can span multiple A4 pages. All pages share the same column grid configuration.

- **Data Model:** `canvas.pages` is an unbounded array of `{ id: uuid, widgets: CanvasWidget[] }`. Each entry is one independent A4 page with its own widget set.
- **Active Page:** The canvas store tracks `currentPageIndex` (0-based). All widget mutations (add, move, rotate, lock, delete) affect only the current page's widget array. The `widgets` field in the store mirrors `pages[currentPageIndex].widgets` for backward compatibility.
- **Adding Pages:** A **+** button sits on the right edge of the canvas grid, vertically centered. Clicking it appends a new blank page and immediately switches to it.
- **Navigation:** A `< Page N / Total >` strip at the bottom of the canvas area. `<` and `>` buttons step through pages; both disable at boundaries.
- **Persistence:** The full `pages` array is serialised into the character JSON blob on every save (auto-save or manual). On load, all pages are restored and page 0 is shown.
- **Printing:** `window.print()` currently prints only the visible (current) page. Future: render all pages in sequence for a single multi-page print job.

### 11.8 Layout Templates & Export

- **Templates:** Pre-designed global layouts and user-created presets (future).
- **Exporting:** Direct browser `window.print()` targeting `#print-canvas` with `@page { size: A4 portrait; margin: 0 }`. Future: high-quality PDF via headless Chrome.

---

## 12. Character Data Schema (JSON Blob)

The following structure represents the single JSON object stored in the database. It is split into `forge` (mechanical data) and `canvas` (layout data).

```json
{
  "version": "1.0.0",
  "identity": {
    "name": "string",
    "race": "string",
    "classLabels": "string",
    "background": "string",
    "alignment": "string",
    "deity": "string",
    "level": 1,
    "classes": [{ "name": "string", "level": 1 }]
  },
  "attributes": {
    "str": { "base": 10, "stack": [], "override": null },
    "dex": { "base": 10, "stack": [], "override": null },
    "con": { "base": 10, "stack": [], "override": null },
    "int": { "base": 10, "stack": [], "override": null },
    "wis": { "base": 10, "stack": [], "override": null },
    "cha": { "base": 10, "stack": [], "override": null }
  },
  "saves": {
    "str": { "proficient": false, "stack": [], "override": null },
    "dex": { "proficient": false, "stack": [], "override": null },
    "con": { "proficient": false, "stack": [], "override": null },
    "int": { "proficient": false, "stack": [], "override": null },
    "wis": { "proficient": false, "stack": [], "override": null },
    "cha": { "proficient": false, "stack": [], "override": null }
  },
  "skills": {
    "athletics": {
      "state": "None|Proficient|Expertise",
      "stack": [],
      "override": null
    },
    "acrobatics": { "state": "None", "stack": [], "override": null },
    "sleightOfHand": { "state": "None", "stack": [], "override": null },
    "stealth": { "state": "None", "stack": [], "override": null },
    "arcana": { "state": "None", "stack": [], "override": null },
    "history": { "state": "None", "stack": [], "override": null },
    "investigation": { "state": "None", "stack": [], "override": null },
    "nature": { "state": "None", "stack": [], "override": null },
    "religion": { "state": "None", "stack": [], "override": null },
    "animalHandling": { "state": "None", "stack": [], "override": null },
    "insight": { "state": "None", "stack": [], "override": null },
    "medicine": { "state": "None", "stack": [], "override": null },
    "perception": { "state": "None", "stack": [], "override": null },
    "survival": { "state": "None", "stack": [], "override": null },
    "deception": { "state": "None", "stack": [], "override": null },
    "intimidation": { "state": "None", "stack": [], "override": null },
    "performance": { "state": "None", "stack": [], "override": null },
    "persuasion": { "state": "None", "stack": [], "override": null }
  },
  "other_proficiencies": [
    {
      "id": "uuid",
      "name": "string",
      "category": "Tool|Language|Vehicle|Weapon|Armor",
      "training": "Proficient|Expertise",
      "stat": "str|dex|con|int|wis|cha|null",
      "override": null
    }
  ],
  "combat": {
    "ac": {
      "mode": "Standard|Formula|Override",
      "base": 10,
      "statA": "string|null",
      "statB": "string|null",
      "override": null
    },
    "initiative": { "stack": [], "override": null },
    "speed": { "base": 30, "stack": [], "override": null },
    "hp": {
      "max": 10,
      "stack": [
        { "id": "uuid", "source": "string", "value": 0, "isActive": true }
      ]
    }
  },
  "inventory": [
    {
      "id": "uuid",
      "name": "string",
      "weight": 0.0,
      "category": "string",
      "equipped": false,
      "modifiers": [
        {
          "id": "uuid",
          "target": "ModifierTarget",
          "value": 0,
          "type": "Bonus|Set To"
        }
      ]
    }
  ],
  "actions": [
    {
      "id": "uuid",
      "name": "string",
      "mode": "Spell|DC|Attack|Heal",
      "attackStat": "str|dex|con|int|wis|cha|null",
      "attackProficient": true,
      "attackBonus": 0,
      "fixedDC": null,
      "damageStack": [
        {
          "diceCount": 1,
          "dieType": "d6",
          "stat": "str|null",
          "flatBonus": 0,
          "type": "string",
          "active": true
        }
      ],
      "notes": "string"
    }
  ],
  "features": [
    {
      "id": "uuid",
      "name": "string",
      "source": "string",
      "description": "markdown"
    }
  ],
  "trackers": [
    {
      "id": "uuid",
      "name": "string",
      "base": 0,
      "stack": [],
      "reset": "Short Rest|Long Rest|Dawn|Special",
      "override": null
    }
  ],
  "spells": {
    "slots": {
      "1": { "base": 0, "stack": [], "override": null },
      "2": { "base": 0, "stack": [], "override": null }
    },
    "list": [
      {
        "id": "uuid",
        "name": "string",
        "level": 0,
        "school": "string",
        "castingTime": "string",
        "range": "string",
        "duration": "string",
        "rollType": "Attack|Save|Utility",
        "hitDCMode": "Standard|Fixed|Manual",
        "mode": "Attack|Spell|DC|Heal",
        "attackStat": "str|dex|con|int|wis|cha|null",
        "attackProficient": true,
        "attackBonus": 0,
        "fixedDC": null,
        "damageStack": [
          {
            "diceCount": 1,
            "dieType": "d6",
            "stat": "str|null",
            "flatBonus": 0,
            "type": "string",
            "active": true
          }
        ],
        "description": "string",
        "upcastDescription": "string",
        "components": {
          "verbal": false,
          "somatic": false,
          "material": false,
          "materialDesc": "string"
        },
        "tags": { "ritual": false, "concentration": false, "prepared": true }
      }
    ]
  },
  "canvas": {
    "cols": 20,
    "pages": [
      {
        "id": "uuid",
        "widgets": [
          {
            "id": "uuid",
            "type": "Box|StatsWidget|HPWidget|etc",
            "col": 0,
            "row": 0,
            "w": 1,
            "h": 6,
            "rotation": 0,
            "locked": false,
            "printState": "Calculated|Blank"
          }
        ]
      }
    ]
  }
}
```

### Shared Objects Reference

**The Modifier Stack Entry:**

```json
{
  "id": "uuid",
  "source": "string",
  "value": number,
  "isActive": boolean,
  "itemId": "uuid | undefined"
}
```

`itemId` is set only for entries injected by the inventory broadcast system. These entries are read-only in the UI and are removed/recreated automatically when inventory changes.
