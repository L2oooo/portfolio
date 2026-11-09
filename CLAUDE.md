# Portfolio — Léo Salvayre

Bilingual (FR/EN) personal portfolio. Art direction **« Topologie »**: the site is a network map / blueprint where "LÉO" is the central node, linked to domain nodes and then to projects and experiences.

**Domains** (single list in `src/data/domains.ts`, shared by content schema, map and lens): `ai`, `cyber`, `dev`, `consulting`, `product`. Never hardcode this list elsewhere.

@AGENTS.md

## Stack
- Astro 7 + TypeScript strict. Static output, zero JS by default; ship JS only where it is needed (topology map, lens selector).
- Plain CSS with custom properties (tokens in `src/styles/tokens.css`). **No Tailwind.**
- Interactive map in SVG + vanilla TS. **No Three.js / WebGL.**
- GSAP for animations, always disabled under `prefers-reduced-motion`.
- Fonts self-hosted via Fontsource: Archivo (display/body), JetBrains Mono (technical annotations).
- Deployment: Vercel.

## Design rules (no AI slop)
- One single accent color (signal orange). No gradients, no glassmorphism cards, no emoji icons, no bento grid.
- Banned fonts: Inter, Space Grotesk, Geist.
- Blueprint language: thin lines, visible grid, technical annotations (`fig.01`, `node: 12`).
- Dark and light themes both supported; check AA contrast.
- Accessibility: keyboard-focusable map nodes, visible focus, 44px min targets, text equivalent of the map.

## Signature feature: the lens selector
"Vous recrutez pour : IA · Cyber · Dev · Conseil · Produit". It highlights the matching graph paths, reorders the project index, and is stored in the URL (`?lens=cyber`) so links can be shared per job application.

## Conventions
- Every file starts with a comment explaining its role.
- No `any` in TypeScript.
- i18n: FR is the default locale at `/`, EN lives at `/en/`. UI strings go in `src/i18n/ui.ts`, never hardcoded in components.
- Content (projects, experiences) lives in content collections under `src/content/{projects,experiences}/{fr,en}/`, same filename in both locales. Read it through `src/lib/content.ts` (`getProjects`, `getExperiences`), never `getCollection` directly.
- Placeholder projects (Alpha…Foxtrot) have `placeholder: true`; they must all be replaced before launch.
- After creating or changing `src/content.config.ts`, restart the dev server (`astro dev stop` then `astro dev --background`): a running server does not pick up new collections.
- One commit per logical step, English commit messages, no Co-Authored-By / Claude signature.

## Personal data
- Never commit the CV PDF (it contains a phone number); `*.pdf` is gitignored.
- Contact info is a placeholder until Léo provides it.
