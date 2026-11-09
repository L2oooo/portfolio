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
  'hero.tagline': 'Ingénieur hybride, entre sécurité, agents IA et produit.',
  'hero.nodes': 'nœuds',
  'hero.linksLabel': 'liens',
  'map.fig': 'fig.01 — topologie',
  'map.title': 'Carte des domaines et projets de Léo Salvayre',
  'map.desc': 'Léo au centre, relié à cinq domaines (IA, Cyber, Dev, Conseil, Produit). Chaque projet est placé entre les domaines qu’il combine. La liste des projets ci-dessous reprend le même contenu.',
  'map.legend.root': 'origine',
  'map.legend.domain': 'domaine',
  'map.legend.project': 'projet',
  'map.legend.link': 'rattachement',
  'domain.ai': 'IA',
  'domain.cyber': 'Cyber',
  'domain.dev': 'Dev',
  'domain.consulting': 'Conseil',
  'domain.product': 'Produit',
  'content.projects': 'Projets',
  'content.experiences': 'Parcours',
  'content.present': 'auj.',
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
  'hero.tagline': 'Hybrid engineer, between security, AI agents and product.',
  'hero.nodes': 'nodes',
  'hero.linksLabel': 'links',
  'map.fig': 'fig.01 — topology',
  'map.title': 'Map of Léo Salvayre’s domains and projects',
  'map.desc': 'Léo at the center, linked to five domains (AI, Cyber, Dev, Consulting, Product). Each project sits between the domains it combines. The project list below holds the same content.',
  'map.legend.root': 'origin',
  'map.legend.domain': 'domain',
  'map.legend.project': 'project',
  'map.legend.link': 'link',
  'domain.ai': 'AI',
  'domain.cyber': 'Cyber',
  'domain.dev': 'Dev',
  'domain.consulting': 'Consulting',
  'domain.product': 'Product',
  'content.projects': 'Projects',
  'content.experiences': 'Background',
  'content.present': 'now',
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
