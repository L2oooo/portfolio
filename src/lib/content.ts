/*
 * Content helpers — read collections for one language.
 * Entry ids look like "fr/alpha"; these helpers filter by locale, expose a
 * language-free `slug` ("alpha") for URLs, and return entries in display order.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Project = CollectionEntry<'projects'> & { slug: string };
export type Experience = CollectionEntry<'experiences'> & { slug: string };

const slugOf = (id: string): string => id.split('/').slice(1).join('/');

// A year-only date ("2025") sorts after every known month of that year
const sortKey = (date: string): string => (date.length === 4 ? `${date}-13` : date);

export async function getProjects(lang: Lang): Promise<Project[]> {
  const entries = await getCollection('projects', ({ id }) => id.startsWith(`${lang}/`));
  return entries
    .map((entry) => ({ ...entry, slug: slugOf(entry.id) }))
    .sort((a, b) => a.data.order - b.data.order);
}

/** Chronological order: oldest first, like hops in a traceroute. */
export async function getExperiences(lang: Lang): Promise<Experience[]> {
  const entries = await getCollection('experiences', ({ id }) => id.startsWith(`${lang}/`));
  return entries
    .map((entry) => ({ ...entry, slug: slugOf(entry.id) }))
    .sort((a, b) => sortKey(a.data.start).localeCompare(sortKey(b.data.start)));
}
