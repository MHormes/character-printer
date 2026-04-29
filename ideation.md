# D&D character sheet fixing - easy to update, easy to print

Roll20 character sheet clone (but better!)

## Ideas

Main character section - race, class, stats, expertise, inventory etc -> start plain input, move to premade options (5e & 5.5 support?)
Desgin section - dragable elements (e.g. main stats, skills, inventory, gold, feature list). Filled & synced by main character section. Placeable on grid

## Technical

online tool - self-hosted
account based - characters per user
Save characters in relational db

## 1. Identity & Scaling (Top-Level Selection)

This section acts as the primary character header and the "engine" for proficiency-based calculations.

### 1.1 Identity Fields

Standard string inputs for character documentation. These do not affect mechanics but are mapped to the Canvas widgets:

- **Character Name**, **Alignment**, **Deity/Patron**, **Background Name**.

### 1.2 Level & Class Scaling

- **Character Level (Integer):** \* Automatically calculates **Proficiency Bonus**: `2 + floor((Level - 1) / 4)`.
- **Class Management:**
  - Supports multi-classing via an "Add Class" interface.
  - Each entry stores `Class Name` and `Class Level`.
  - **System Check:** A non-blocking warning appears if the sum of Class Levels ≠ Character Level.

### 1.3 Selection Logic

- **Compendium Hooks:** Selecting a Race or Class from the compendium automatically triggers the injection of relevant modifiers into the **Attribute Modifier Stacks & Saving Throw Modifier Stack** (Section 2).
- **Custom/Homebrew:** Users can bypass compendium logic by selecting "Custom," allowing for manual entry of all identity-based bonuses.

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
- **Smart Item Link:** Equipped items that grant +1 to All Saves or specific Stats automatically push labeled entries to the relevant stacks (similar to the race and background functioning).
- **Sync/Revert:** A one-click icon to clear manual overrides and snap back to the "Standard" math.

---

## 3. Skills & Proficiencies

This section manages trained abilities. To minimize "choice-path" bugs, it provides a flat list of skills with manual proficiency toggles and automated calculations.

### 3.1 Skill Data Structure

Each Skill (e.g., Athletics, Stealth) contains:

- **State (Enum):** `None`, `Proficient`, or `Expertise`.
- **Attribute Link:** A hard link to the standard Core Attribute (e.g., Perception -> Wis).
- **Manual Override (Nullable Integer):** A priority field for the final bonus (auto enables override toggle).
- **Override Toggle (Boolean):** Flag to bypass automation.

### 3.2 Calculation Logic

The system displays a "Ghost Number" based on the following:

1.  **Base:** The current **Resolved Attribute Modifier** from Section 2.
2.  **Proficiency:** \* If `Proficient` → Add `Proficiency Bonus`.
    - If `Expertise` → Add `Proficiency Bonus * 2`.
3.  **Resolution:** If `Override Toggle` is TRUE, use the `Manual Override`; otherwise, use the calculated sum.

### 3.3 User Interaction

- **Simple Toggles:** Users manually select their proficiency level based on their Class/Background choices.
- **Re-binding (Optional/Edge Case):** While skills are linked to default attributes, users wanting "Strength (Intimidation)" should use the **Manual Override** to set the correct total for that specific printout.
- **Sync/Revert:** A one-click icon to clear manual overrides and snap back to the "Standard" math.

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

### 4.2 Entry Logic (Manual-First)

To bypass complex "Choice" logic (e.g., "Pick 1 of 3 gaming sets"), the system follows these rules:

- **Auto-Population:** Selecting a Race or Class from the compendium pushes **Hard-Set** proficiencies to this list (e.g., a Rogue automatically gets "Thieves' Tools").
- **User-Driven Choices:** For any "Choose X" feature, the user simply hits an "Add New" button, types the name, and selects the state.
- **No Validation:** The tool does not limit how many proficiencies are added, allowing for total homebrew and "Variant Rule" support.

### 4.3 User Interaction

- **Dynamic List:** Users can add, edit, or delete entries at any time.
- **The "Ghost" Bonus:** The UI displays the calculated Proficiency Bonus (from Section 1) next to the entry.
- **Canvas Output:** For the Print Canvas, these are aggregated into a single "Proficiencies & Languages" text block, grouped by Category.

## 5. Combat Stats

This section calculates the core survival and reactive statistics. It relies on the **Attribute Modifiers** from Section 2.

### 5.1 Armor Class (AC) Logic

AC is the most complex calculation, requiring three distinct modes to handle various armor types and class features:

- **Mode A: Standard (Automatic):**
  - Formula: `10 + Dex Modifier`.
- **Mode B: Formula Builder (Custom):**
  - Allows the user to define: `Base Value (Int)` + `Stat A (Nullable)` + `Stat B (Nullable)`.
  - _Example (Unarmored Defense):_ `10 + Dex + Con`.
  - _Example (Plate Armor):_ `18 + null + null`.
- **Mode C: Manual Override:**
  - A single integer field that bypasses all formulas.

### 5.2 Initiative & Speed

- **Initiative:**
  - **Ghost Value:** Calculated as the `Dexterity Modifier`. Adds a tiebreaker using the `Dexterity Stat`
  - **Modifier Stack:** Similar to Core Attributes, users can add labeled bonuses (e.g., "Alert Feat: +5").
- **Speed:**
  - **Base Value:** Set by the selected Race (e.g., 30ft).
  - **Modifier Stack:** For items or features (e.g., "Barbarian Fast Movement: +10").

### 5.3 Health Points (HP)

- **Max HP:**
  - **Formula:** `(Class Hit Die + Con) + ((Level - 1) * (Avg Die Roll + Con))`.
  - **Manual Adjustment:** A "Misc HP" field to account for the "Tough" feat or manual rolls that differ from the average.
- **Hit Dice:**
  - Tracks total quantity and die type (e.g., 3d8) based on Class and Level. Supports multiclassing (e.g. 2d8 - cleric, 1d8 bard)

### 5.4 User Interaction

- **Live Updates:** Changing the Dexterity score in Section 2 immediately updates the Ghost Values for AC (if in Mode A) and Initiative.
- **Visual Clarity:** Overridden values are highlighted to remind the user the "Auto-Math" is currently disabled.
- **Sync/Revert:** A one-click icon to clear manual overrides and snap back to the "Standard" math.

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

This is the core integration between the Inventory and the rest of the Data Forge:

- **Active Bonus:** When an item's `Equipped State` is TRUE, its `Modifier Stack` is pushed to the corresponding section's stack (e.g., an "Amulet of Health" pushes a `Set To: 19` or a `Bonus: +2` to the Con Attribute stack).
- **Severing the Link:** If an item is deleted or unequipped, the corresponding entry in the Attribute/Combat stack is removed or set to `Is_Active: False`.
- **Conflict Resolution:** If multiple items affect the same field (e.g., two different sets of Armor), the user manages this by toggling the `Equipped State`.

### 6.3 Automation vs. Manual

- **Compendium Items:** Adding a "Shield" from the compendium automatically populates the Modifier Stack with `Target: AC, Value: +2`.
- **Custom Items:** Users can create an item from scratch, name it "Homebrew Boots," and manually add a modifier like `Target: Speed, Value: +10`.

### 6.4 Inventory Calculations

- **Total Weight:** A ghost value at the bottom of the list summing all `Weight` values.
- **Encumbrance (Optional):** A simple check against `Strength * 15` to highlight the weight total in red if it exceeds the limit.

### 6.5 User Interaction

- **Add/Delete:** Standard list management.
- **The "Equip" Toggle:** A prominent checkbox next to each item. Weapons and Armor are the most common users of this toggle.
- **Modifier Modal:** A sub-menu within the item to add or edit the modifiers it grants to the character.

## 7. Attacks & Spell Actions

This section tracks offensive and utility actions. It uses a "Standard DC" for the character's primary magic while allowing for item-specific overrides and multi-layered damage types.

### 7.1 Global Spell Casting

- **Standard Spell DC:** A ghost value calculated as `8 + Proficiency + Linked Spellcasting Modifier`.
- **Standard Attack Bonus:** A ghost value calculated as `Proficiency + Linked Spellcasting Modifier`.
- **Global Linked Attribute:** A dropdown to set the primary casting stat (e.g., Wis for Cleric).

### 7.2 Action Data Structure

Each Attack or Spell entry contains:

- **Name (String):** (e.g., "Flame Tongue Greatsword", "Spider Staff").
- **Attack/DC Mode (Enum):**
  - `Standard`: Uses the character's natural stats/global DC.
  - `Fixed`: Ignores stats and uses a hard-coded number (e.g., "DC 13").
  - `Manual`: A total override for the final value.
- **To Hit / DC Total:** The resolved number based on the mode selected.
- **Damage/Effect Stack (List of Objects):**
  - `Formula`: (e.g., "2d6 + Str", "1d6").
  - `Type`: (e.g., "Slashing", "Fire").
  - `Is_Active`: Toggle for conditional damage (e.g., "Sneak Attack").
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

## 8. Features & Traits

This section acts as the character's "Ability Dictionary." It aggregates text-based descriptions from your Race, Class, Background, and Feats into a single organized list.

### 8.1 Feature Data Structure

Each entry is a standardized block containing:

- **Feature Name (String):** (e.g., "Darkvision", "Second Wind", "Sentinel").
- **Source (String/Enum):** (e.g., "High Elf", "Fighter 2", "Feat").
- **Description (Markdown Text):** The full mechanical or flavor text of the ability.

### 8.2 Logic & Auto-Population

- **Compendium Injection:** When a user selects a Race or Class in Section 1, the Data Forge automatically "pushes" the corresponding features into this list.
- **Manual Additions:** A "New Feature" button allows users to manually type in homebrew abilities or specific Feats they’ve chosen.
- **Item-Linked Features:** If a "Smart Item" from Section 6 is equipped and has a unique passive ability, that description is mirrored here automatically.

### 8.3 User Interaction

- **Categorization:** Features are visually grouped by their source (e.g., all "Racial Traits" together) for easier browsing.
- **Editability:** Even auto-populated features can be edited by the user to shorten text or add personal notes.

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
  - **Roll Type (Enum):** [Attack Roll, Save DC, Utility/None].
  - **Hit/DC Mode:** (Uses the `Standard/Fixed/Manual` logic from Section 7).
  - **Damage/Effect Stack (List of Objects):**
    - `Formula`: (e.g., "3d8 + Mod").
    - `Type`: (e.g., "Radiant").
    - `Scaling`: (Text field for "At Higher Levels" math).
- **Text & Tags:**
  - **Description (Markdown):** The full spell text.
  - **Components (String):** (e.g., "V, S, M").
  - **Tags (Flags):** Ritual, Concentration, Prepared.

### 10.3 Automation & Logic

- **Slot Auto-Fill:** Selecting a Class and Level in Section 1 populates the `Base Value` for the slot grid according to the 5e multiclassing or single-class tables.
- **The "Spellcasting Ability" Link:** Spells default to the Global Spell Casting stat defined in Section 7, but each spell can be individually swapped to a different attribute (for feats like Magic Initiate).

### 10.4 User Interaction

- **Add Spell:** Opens a searchable compendium or a blank template for homebrew.
- **Slot Management:** A simple table view where users can toggle the "Modifier Stack" to account for specialized items or multiclassing quirks.
- **Sync/Revert:** Standard reset buttons on every slot level and spell-specific DC to return to the calculated baseline.

---

## 11. The Canvas (Design Page)

The **Canvas** is the layout engine that transforms data from the Forge into a printable sheet. It handles the "where" and "how" of the final output.

### 11.1 The Grid-Based Workspace

- **Print-Safe Boundaries:** Represents physical paper (A4/Letter) with "Safe Zones" for home printers.
- **Snap-to-Grid:** Background grid for widget alignment with adjustable sensitivity.
- **Multi-Page Support:** Ability to add multiple pages for overflow or dedicated sections (e.g., a full page for Spells).

### 11.2 The Widget System

Widgets are UI components linked to Data Forge fields.
- **Atomic Widgets:** Single-value boxes (e.g., Str Modifier).
- **Composite Widgets:** Grouped data (e.g., Saving Throw list, Combat Header).
- **Dynamic List Widgets:** Containers that expand based on data (e.g., Inventory, Features).
- **Drag-and-Drop:** A palette of widgets categorized by Forge section for easy placement and resizing.

### 11.3 Data Sync & "Wipe-Out" Logic

- **Live Preview:** Forge updates (e.g., leveling up) reflect instantly on the Canvas.
- **The "Print Override":** To allow for pencil tracking during play, widgets have a "Print State":
    - **Calculated:** Prints the current value (e.g., "Max HP: 45").
    - **Blank/Underlined:** Prints an empty space or underline for manual tracking (e.g., "Current HP: _____").

### 11.4 Layout Templates & Export

- **Templates:** Supports pre-designed global layouts and user-created presets.
- **Exporting:** High-quality PDF generation or direct browser printing.

