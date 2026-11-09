/*
 * Locale-aware URL helpers.
 * Lets any page find "the same page in the other language", which powers
 * the FR/EN switch and the <link rel="alternate" hreflang> tags. Some URL
 * segments are translated too ("/projets/" in French, "/en/projects/" in English).
 * Exposes: stripLocale(), localizedPath(), projectsPath(), projectPath().
 */
import { getRelativeLocaleUrl } from 'astro:i18n';
import { languages, type Lang } from './ui';

/** Translated URL segments, one entry per section. */
const SEGMENTS: Record<string, Record<Lang, string>> = {
  projects: { fr: 'projets', en: 'projects' },
};

/** "/en/projects/x/" -> "projects/x/" ; "/projets/x/" -> "projets/x/" */
export function stripLocale(pathname: string): string {
  const [first, ...rest] = pathname.replace(/^\/+/, '').split('/');
  return first !== undefined && first in languages ? rest.join('/') : pathname.replace(/^\/+/, '');
}

/** Translates the first segment of a locale-free path: "projets/x/" -> "projects/x/". */
function translateSegments(path: string, lang: Lang): string {
  const [first = '', ...rest] = path.split('/');
  const section = Object.values(SEGMENTS).find((s) => Object.values(s).includes(first));
  return section ? [section[lang], ...rest].join('/') : path;
}

/** URL of the current page in another language. */
export function localizedPath(lang: Lang, pathname: string): string {
  return getRelativeLocaleUrl(lang, translateSegments(stripLocale(pathname), lang));
}

/** URL of the projects index: "/projets/" (fr) or "/en/projects/" (en). */
export function projectsPath(lang: Lang): string {
  return getRelativeLocaleUrl(lang, SEGMENTS.projects![lang]);
}

/** URL of a project page: "/projets/alpha/" (fr) or "/en/projects/alpha/" (en). */
export function projectPath(lang: Lang, slug: string): string {
  return getRelativeLocaleUrl(lang, `${SEGMENTS.projects![lang]}/${slug}`);
}
