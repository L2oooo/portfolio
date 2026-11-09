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
  'map.fig': 'fig.01 — topologie',
  'map.title': 'Carte des domaines et projets de Léo Salvayre',
  'map.desc': 'Léo au centre, relié à cinq domaines (IA, Cyber, Dev, Conseil, Produit). Chaque projet est placé entre les domaines qu’il combine. La liste des projets ci-dessous reprend le même contenu.',
  'map.descCompact': 'Léo au centre, relié à cinq domaines : IA, Cyber, Dev, Conseil et Produit.',
  'card.root': 'origine',
  'card.hub': 'projets',
  'card.project': 'projet',
  'card.background': 'parcours',
  'card.skills': 'compétences',
  'card.contact': 'contact',
  'hub.title': 'Projets',
  'hub.text': 'Une sélection de projets, chacun à la croisée de plusieurs domaines.',
  'project.open': 'Voir le projet',
  'hub.cta': 'Voir les projets',
  'projects.back': 'Retour au mur',
  'projects.metaTitle': 'Projets — Léo Salvayre',
  'background.title': 'Parcours',
  'background.hop': 'saut',
  'skills.title': 'Compétences',
  'skills.languages': 'Langues',
  'contact.title': 'Travaillons ensemble',
  'contact.text': 'Coordonnées à venir.',
  'contact.email': 'email',
  'contact.linkedin': 'linkedin',
  'contact.github': 'github',
  'contact.soon': 'à venir',
  'domain.ai': 'IA',
  'domain.cyber': 'Cyber',
  'domain.dev': 'Dev',
  'domain.consulting': 'Conseil',
  'domain.product': 'Produit',
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
  'map.fig': 'fig.01 — topology',
  'map.title': 'Map of Léo Salvayre’s domains and projects',
  'map.desc': 'Léo at the center, linked to five domains (AI, Cyber, Dev, Consulting, Product). Each project sits between the domains it combines. The project list below holds the same content.',
  'map.descCompact': 'Léo at the center, linked to five domains: AI, Cyber, Dev, Consulting and Product.',
  'card.root': 'origin',
  'card.hub': 'projects',
  'card.project': 'project',
  'card.background': 'background',
  'card.skills': 'skills',
  'card.contact': 'contact',
  'hub.title': 'Projects',
  'hub.text': 'A selection of projects, each one at the crossroads of several domains.',
  'project.open': 'Open project',
  'hub.cta': 'View projects',
  'projects.back': 'Back to the wall',
  'projects.metaTitle': 'Projects — Léo Salvayre',
  'background.title': 'Background',
  'background.hop': 'hop',
  'skills.title': 'Skills',
  'skills.languages': 'Languages',
  'contact.title': 'Let’s work together',
  'contact.text': 'Contact details coming soon.',
  'contact.email': 'email',
  'contact.linkedin': 'linkedin',
  'contact.github': 'github',
  'contact.soon': 'soon',
  'domain.ai': 'AI',
  'domain.cyber': 'Cyber',
  'domain.dev': 'Dev',
  'domain.consulting': 'Consulting',
  'domain.product': 'Product',
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
