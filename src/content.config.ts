/*
 * Content collections — schemas validated at build time.
 * A typo in a frontmatter field (wrong domain, missing year…) fails the build
 * instead of silently breaking the map. Files are stored per locale:
 *   src/content/projects/{fr,en}/<slug>.md
 *   src/content/experiences/{fr,en}/<slug>.md
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DOMAINS } from './data/domains';

const domains = z.array(z.enum(DOMAINS)).min(1);

// "2025-01", or just "2025" when the month is unknown
const yearMonth = z.string().regex(/^\d{4}(-\d{2})?$/, 'Expected YYYY or YYYY-MM');

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(160), // one line in the index, also the meta description
    domains,
    year: z.number().int(),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    links: z
      .object({
        github: z.url().optional(),
        demo: z.url().optional(),
      })
      .default({}),
    order: z.number().int(), // position in the index, lower first
    placeholder: z.boolean().default(false), // lorem ipsum content, to replace
  }),
});

const experiences = defineCollection({
  loader: glob({ base: './src/content/experiences', pattern: '**/*.md' }),
  schema: z.object({
    org: z.string(),
    role: z.string(),
    kind: z.enum(['education', 'work', 'venture']),
    location: z.string(),
    start: yearMonth,
    end: yearMonth.optional(), // absent = ongoing
    domains,
  }),
});

export const collections = { projects, experiences };
