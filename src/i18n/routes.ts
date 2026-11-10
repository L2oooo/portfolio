/*
 * Locale-aware URL helpers.
 * Lets any page find "the same page in the other language", which powers
 * the FR/EN switch and the <link rel="alternate" hreflang> tags. Section URL
 * segments are translated ("/parcours/" in French, "/en/background/" in English).
 * Exposes: Section, SECTION_NODE, stripLocale(), localizedPath(), sectionPath(),
 * projectsPath(), projectPath().
 */
import { getRelativeLocaleUrl } from 'astro:i18n';
import { languages, type Lang } from './ui';

/** Translated URL segment of each section page. */
const SEGMENTS = {
  about: { fr: 'a-propos', en: 'about' },
  projects: { fr: 'projets', en: 'projects' },
  background: { fr: 'parcours', en: 'background' },
  skills: { fr: 'competences', en: 'skills' },
  contact: { fr: 'contact', en: 'contact' },
} as const satisfies Record<string, Record<Lang, string>>;

export type Section = keyof typeof SEGMENTS;

/** Wall card (DOM id) that represents each section. */
export const SECTION_NODE: Record<Section, string> = {
  about: 'node-leo',
  projects: 'node-projects',
  background: 'node-background',
  skills: 'node-skills',
  contact: 'node-contact',
};

/** "/en/projects/x/" -> "projects/x/" ; "/projets/x/" -> "projets/x/" */
export function stripLocale(pathname: string): string {
  const [first, ...rest] = pathname.replace(/^\/+/, '').split('/');
  return first !== undefined && first in languages ? rest.join('/') : pathname.replace(/^\/+/, '');
}

/** Translates the first segment of a locale-free path: "projets/x/" -> "projects/x/". */
function translateSegments(path: string, lang: Lang): string {
  const [first = '', ...rest] = path.split('/');
  const section = Object.values(SEGMENTS).find((s) => (Object.values(s) as string[]).includes(first));
  return section ? [section[lang], ...rest].join('/') : path;
}

/** URL of the current page in another language. */
export function localizedPath(lang: Lang, pathname: string): string {
  return getRelativeLocaleUrl(lang, translateSegments(stripLocale(pathname), lang));
}

/** URL of a section page: sectionPath('fr', 'background') -> "/parcours/". */
export function sectionPath(lang: Lang, section: Section): string {
  return getRelativeLocaleUrl(lang, SEGMENTS[section][lang]);
}

/** URL of the projects index: "/projets/" (fr) or "/en/projects/" (en). */
export function projectsPath(lang: Lang): string {
  return sectionPath(lang, 'projects');
}

/** URL of a project page: "/projets/alpha/" (fr) or "/en/projects/alpha/" (en). */
export function projectPath(lang: Lang, slug: string): string {
  return getRelativeLocaleUrl(lang, `${SEGMENTS.projects[lang]}/${slug}`);
}
