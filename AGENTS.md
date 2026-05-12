# Character Printer AI Instructions

Foundational mandates for AI agents working on the Character Printer project.

## Navigation & Architecture
- **Navigation Rule:** Consult `RIG.json` first for architectural dependencies. Do not guess paths.
- **Hierarchy Rule:** Local `AGENTS.md` files in sub-folders take precedence for localized logic.
- **Map Maintenance:** If you change the project structure (adding/moving/deleting files), your final step must be to run:
  `npx repomix --style json --no-files --output RIG.json`

## Core Context
- **Project Goal:** A D&D character sheet engine that is easy to update and easy to print.
- **Direct References:** See `ideation.md` for detailed technical specifications, math formulas, and the JSON schema. **Always refer to `ideation.md` before implementing character logic.** Refer to `README.md` for setup and environment details.

## Efficiency Protocol: Plan First
- **Mandate:** For any complex task (multi-file changes, new features, or bug fixes), you MUST create a `.plan` file (e.g., `tasks/your-task.plan`) before writing code.
- **Goal:** Minimize token usage by avoiding reading unrelated modules and strictly defining the scope of changes. Read only the minimum files necessary.

## Directory Map
- `/app`: Next.js App Router pages and layouts.
  - `(app)`: The main application (Canvas, Forge, Character List).
  - `(auth)`: Login and Registration.
- `/components/canvas`: The layout engine and the printable "widgets".
- `/components/forge`: The data-entry sections and fields.
- `/components/ui`: Base shadcn/ui components.
- `/lib/actions`: Server Actions for database and user operations.
- `/lib/character`: Core business logic (math, modifier stacks, calculations).
- `/lib/store`: Zustand stores (Single source of truth for the frontend).
- `/lib/db`: Drizzle schema, client, and migrations.
- `/lib/types`: TypeScript definitions.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:styling-rules -->
# Styling

- All styling uses **shadcn/ui** components and **Tailwind CSS** utility classes.
- **Never use `dark:` Tailwind variants.** Dark/light mode is handled via CSS variables only.
- All colors must come from CSS variables defined in `app/globals.css` (e.g. `bg-background`, `text-foreground`, `bg-card`).
- If a color you need is not already defined in `globals.css`, **do not invent a Tailwind color class or hardcode a value**. Instead, stop and prompt the user to add the color to `globals.css` as a CSS variable pair (one value for light, one for dark under `.dark {}`), then use that variable.
- This keeps dark/light mode consistent and centralized — a single variable flip covers both themes.
<!-- END:styling-rules -->
