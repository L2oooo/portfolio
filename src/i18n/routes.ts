/*
 * Locale-aware URL helpers.
 * Lets any page find "the same page in the other language", which powers
 * the FR/EN switch and the <link rel="alternate" hreflang> tags.
 */
import { getRelativeLocaleUrl } from 'astro:i18n';
import { languages, type Lang } from './ui';

/** "/en/projects/x/" -> "projects/x/" ; "/projects/x/" -> "projects/x/" */
export function stripLocale(pathname: string): string {
  const [first, ...rest] = pathname.replace(/^\/+/, '').split('/');
  return first !== undefined && first in languages ? rest.join('/') : pathname.replace(/^\/+/, '');
}

/** URL of the current page in another language. */
export function localizedPath(lang: Lang, pathname: string): string {
  return getRelativeLocaleUrl(lang, stripLocale(pathname));
}
