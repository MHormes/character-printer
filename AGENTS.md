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
