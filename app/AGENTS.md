# App Directory AI Instructions

Localized constraints for the `/app` directory.

## Routing & Layouts
- **App Router:** Use Next.js App Router conventions (layouts, pages, loading states).
- **Client/Server components:** Explicitly mark client components with `'use client'`. Prefer server components for data fetching where possible.

## Data Fetching
- Use Server Actions (`lib/actions`) for mutations and data fetching in layouts/pages.
- Avoid raw SQL in components; always use the action layer.

## Hydration
- `(app)/layout.tsx` handles the main application shell and store hydration. Ensure stores are properly initialized before rendering domain-specific pages.
