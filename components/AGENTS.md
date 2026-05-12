# Components AI Instructions

Localized constraints for the `/components` directory.

## Plan First
- For any new component or refactor, create a `.plan` file first.
- Clearly define the component's responsibility and its relationship to the Zustand store (`lib/store`).

## Structure
- **Canvas (`/canvas`):** These components handle the layout and printing. They must be visual-first and respect the grid system.
- **Forge (`/forge`):** These components handle data entry. They must prioritize clarity and direct mapping to the `CharacterData` schema in `ideation.md`.
- **UI (`/ui`):** Base shadcn/ui components. Only modify these if instructed; otherwise, use them as-is.

## Styling
- Adhere strictly to the root `AGENTS.md` styling rules (CSS variables, no `dark:` variants).
- Prefer `lucide-react` for icons.
