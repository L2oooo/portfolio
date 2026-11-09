/*
 * UI translations — every interface string lives here, in both languages.
 * The `satisfies` check makes TypeScript fail the build if a key exists in
 * French but is missing in English (or the other way around).
 * Exposes: languages, Lang, isLang(), useTranslations().
 */

export const languages = {
  fr: 'Français',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'fr';

const fr = {
  'meta.title': 'Léo Salvayre — Ingénieur IA × Cyber × Produit',
  'meta.description':
    'Portfolio de Léo Salvayre, ingénieur EPITA au croisement de l’IA, de la cybersécurité et du produit.',
  'nav.home': 'Accueil',
  'nav.lang': 'Langue',
  'theme.toDark': 'Passer au thème sombre',
  'theme.toLight': 'Passer au thème clair',
  'theme.label': 'thème',
  'theme.ink': 'encre',
  'theme.paper': 'papier',
  'hero.status': 'statut : disponible',
  'hero.loc': 'loc : Paris, FR',
  'hero.links': 'liens : 4 domaines · 12 nœuds',
  'hero.tagline': 'Ingénieur hybride, entre sécurité, agents IA et produit.',
  'specimen.fig': 'fig.00 — design system',
  'specimen.color': 'Couleur',
  'specimen.type': 'Typographie',
  'specimen.line': 'Trait & nœuds',
  'footer.drawnBy': 'dessiné par : L. Salvayre',
} as const;

type Dictionary = Record<keyof typeof fr, string>;

const en = {
  'meta.title': 'Léo Salvayre — AI × Cyber × Product Engineer',
  'meta.description':
    'Portfolio of Léo Salvayre, EPITA engineer at the crossroads of AI, cybersecurity and product.',
  'nav.home': 'Home',
  'nav.lang': 'Language',
  'theme.toDark': 'Switch to dark theme',
  'theme.toLight': 'Switch to light theme',
  'theme.label': 'theme',
  'theme.ink': 'ink',
  'theme.paper': 'paper',
  'hero.status': 'status: open to work',
  'hero.loc': 'loc: Paris, FR',
  'hero.links': 'links: 4 domains · 12 nodes',
  'hero.tagline': 'Hybrid engineer, between security, AI agents and product.',
  'specimen.fig': 'fig.00 — design system',
  'specimen.color': 'Color',
  'specimen.type': 'Typography',
  'specimen.line': 'Lines & nodes',
  'footer.drawnBy': 'drawn by: L. Salvayre',
} satisfies Dictionary;

const ui: Record<Lang, Dictionary> = { fr, en };

export type UIKey = keyof Dictionary;

export function isLang(value: string | undefined): value is Lang {
  return value !== undefined && value in languages;
}

/** Returns a `t()` function bound to one language. */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key];
  };
}
