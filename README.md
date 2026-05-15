# Character Printer

A D&D 5e character sheet builder with a drag-and-drop print canvas. Design your sheet, fill in your character, print it exactly how you want it.

---

## How it works

**Data Forge** — the mechanical backbone. Stats, skills, modifiers, resources, spells. Every value uses a "Base + Stack" model: a labeled list of bonuses you can toggle or override individually. The full breakdown is always visible.

**Canvas** — the layout engine. Drag widgets onto a print-safe grid, resize and arrange them freely. Widgets are live-linked to the Forge. Each widget can render its calculated value or a blank field for pencil tracking during play.

---

## Forge sections

- **Identity** — name, race, class, background, level, multiclass support. Proficiency Bonus derived automatically.
- **Attributes & Saves** — six core stats with modifier stacks. Saving throws sit on top with a proficiency toggle.
- **Skills** — 18 skills with `None / Proficient / Expertise` toggles and manual overrides.
- **Other Proficiencies** — dynamic list for tools, languages, vehicles, weapons, armor.
- **Combat** — AC (Standard / Formula / Override), Initiative, Speed, HP, Hit Dice.
- **Inventory** — items with an equip toggle. Equipped items push their modifiers into the relevant Forge stacks automatically.
- **Attacks & Spells** — per-action entries with damage stacks for multi-damage attacks. Global spellcasting stat drives default DC and attack bonus.
- **Features & Traits** — freeform ability list grouped by source with markdown descriptions.
- **Resources** — named trackers (e.g. Rage, Spell Slots) with stacks, reset conditions, and overrides.
- **Spellbook** — slot grid (levels 1–9) and full spell card entries with damage stacks and scaling.

---

## Character data

All character state is a single JSON blob. Example:

```json
{
  "version": "1.0.0",
  "identity": {
    "name": "Thalindra",
    "level": 5,
    "classes": [{ "name": "Fighter", "level": 5 }]
  },
  "attributes": {
    "str": {
      "base": 16,
      "stack": [
        { "source": "Belt of Giant Strength", "value": 4, "isActive": true }
      ],
      "override": null
    }
  },
  "combat": {
    "ac": {
      "mode": "Formula",
      "base": 10,
      "statA": "dex",
      "statB": "con",
      "override": null
    },
    "hp": {
      "max": 52,
      "stack": [{ "id": "uuid", "source": "Tough feat", "value": 10, "isActive": true }]
    }
  },
  "canvas": {
    "pages": [
      {
        "id": "...",
        "widgets": [
          {
            "type": "HPWidget",
            "x": 0,
            "y": 0,
            "w": 3,
            "h": 2,
            "printState": "Blank"
          }
        ]
      }
    ]
  }
}
```

---

## Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Framework       | Next.js 15 (App Router)     |
| Database (dev)  | SQLite via better-sqlite3   |
| Database (prod) | PostgreSQL                  |
| ORM             | Drizzle ORM                 |
| State           | Zustand + Immer             |
| UI              | shadcn/ui + Tailwind CSS v4 |
| Drag & Drop     | dnd-kit                     |
| Auth            | NextAuth.js                 |
| Language        | TypeScript                  |

---

## Running

For setup and operations, see [docs/running-the-application.md](docs/running-the-application.md).

---

## License

Copyright (c) 2026 Maarten Hormes - ALL RIGHTS RESERVED.
This project is provided for portfolio review only. See the [LICENSE](LICENSE) file for full details.
