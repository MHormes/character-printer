# Lib AI Instructions

Localized constraints for the `/lib` directory.

## Plan First
- For any logic changes, state management updates, or DB schema modifications, create a `.plan` file first.
- Explicitly state the math or data flow being implemented.

## Core Logic (`/character`)
- **Modifier Stacks:** Most character stats use a "Stack" model. Refer to `ideation.md` for how these are resolved.
- **Modifier Sync:** Changes to inventory MUST trigger a sync of modifiers. See `lib/character/modifier-sync.ts`.

## State Management (`/store`)
- Zustand is the single source of truth for the browser.
- Ensure all Forge inputs and Canvas widgets are reactively linked to the store.

## Database (`/db`)
- Uses Drizzle ORM.
- Maintain the hybrid Relational/JSON strategy: top-level entities are relational; complex character data is stored as a JSON blob.
