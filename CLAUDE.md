# Portfolio — Léo Salvayre

Bilingual (FR/EN) personal portfolio. Art direction **« Topologie »**: the site is a network map / blueprint where "LÉO" is the central node, linked to domain nodes and then to projects and experiences.

**Domains** (single list in `src/data/domains.ts`, shared by content schema, map and lens): `ai`, `cyber`, `dev`, `consulting`, `product`. Never hardcode this list elsewhere.

@AGENTS.md

## Home page: the "topological wall"
Inspired by allanleone.com, but in a blueprint style.
- **Cards** (5, in a cross around Léo): Léo (center, largest), Projets (east), Parcours (west), Skills (south), Contact (north). Individual projects are NOT on the wall.
- **Projects**: the Projets card (mosaic of project thumbnails + titles) links to `/projets/` (`/en/projects/`), which lists every project; each project then gets `/projets/[slug]`. The card and the page head share `view-transition-name: projects-card` (native CSS cross-document view transitions).
- **Back links** to the wall use a hash (`/#node-projects`): the wall opens centered on that card.
- **Translated URL segments** live in `SEGMENTS` in `src/i18n/routes.ts`; always build URLs with its helpers.
- **Wires**: orthogonal wires join the cards through small square "ports".
- **Interaction**: the wall is draggable (pointer events, inertia, elastic bounds; bounded, not infinite) and slightly curved using CSS 3D per-card transforms (no WebGL). Cards have a glass edge.
- **Navigation**: a floating bottom pill bar (Projets · Parcours · Skills · Contact · Lens · List) flies the camera to a card.
- **HTML-first**: the cards are plain HTML in logical order (readable list without JS); `src/scripts/wall.ts` enhances it into the wall. Never make content reachable only through dragging.
- **Reuse**: the radial `TopologyMap` lives inside the Skills card.
- **Visuals**: project visuals are AI-generated (Léo's choice) and stored in `src/assets/`, served through Astro `<Image>`. A blueprint SVG placeholder is shown when a project has no `cover`.

## Stack
- Astro 7 + TypeScript strict. Static output, zero JS by default; ship JS only where it is needed (topology map, lens selector).
- Plain CSS with custom properties (tokens in `src/styles/tokens.css`). **No Tailwind.**
- Wall, wires and radial map in HTML/SVG + vanilla TS. **No Three.js / WebGL.**
- GSAP for animations, always disabled under `prefers-reduced-motion`.
- Fonts self-hosted via Fontsource: Archivo (display/body), JetBrains Mono (technical annotations).
- Deployment: Vercel.

## Design rules (no AI slop)
- One single accent color (signal orange). No decorative gradients, no emoji icons, no bento grid look. The wall cards' glass edge is the one deliberate exception: keep it subtle, and the wires and ports are what make the cards read as "nodes", not bento tiles.
- Banned fonts: Inter, Space Grotesk, Geist.
- Blueprint language: thin lines, visible grid, technical annotations (`fig.01`, `node: 12`).
- Dark and light themes both supported; check AA contrast.
- Accessibility: keyboard-focusable map nodes, visible focus, 44px min targets, text equivalent of the map.

## Signature feature: the lens selector
"Vous recrutez pour : IA · Cyber · Dev · Conseil · Produit". It lives in the bottom bar. It lights up the matching cards and wires and dims the rest. It is stored in the URL (`?lens=cyber`) so a link can be tailored to each job application.

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
