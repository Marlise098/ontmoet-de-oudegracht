# Ontmoet de Oudegracht

An interactive, touch-first exhibition about Utrecht's Oudegracht for Het Utrechts Archief.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Visitor experience and local CMS preview: `artifacts/ontmoet-oudegracht`
- The visitor route is `/`; the local CMS preview is `/cms`.
- The supplied HUA brand mark is in `artifacts/ontmoet-oudegracht/src/assets`.

## Architecture decisions

- Keep the visitor experience operable by touch; do not rely on hover behavior.
- Keep the layout responsive for large interactive boards, different aspect ratios, and smaller screens.
- Target WCAG 2.1 AA; review semantics, keyboard operation, contrast, zoom, and screen-reader support after UI changes.
- Use clear B1 Dutch for the youngest audience (primary-school groups 5–6); design for mixed groups, not only families.
- Show historical claims only when supported by a checked source. The project brief names 1929; additional years, places, timestamps, and images need verified material.
- The supplied film is served from App Storage through a read-only media endpoint. The map, timecodes, historical text and CMS remain a local design preview, not a connected archive or publishing system.
- The provided HUA style manual is dated 2008; use its public-facing navy/ochre palette and supplied mark provisionally.

## Product

Visitors watch the supplied Oudegracht video and explore a schematic route. Film playback is not linked to places until checked timecodes are available. Place cards include source-credit space. The CMS route previews the related content fields; it does not save or publish changes.

## User preferences

Keep the visual design engaging during group viewing, with clear touch controls and no unsupported historical facts.

## Gotchas

Do not present the supplied film's date, the example map, source references, or timecodes as verified archival content. Check source information and usage rights before public release.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
