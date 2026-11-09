/*
 * Skills — Léo's skills grouped by domain, taken from his CV, in both languages.
 * Shown in the Skills card next to the radial domain map.
 */
import type { Domain } from './domains';
import type { Lang } from '../i18n/ui';

type Localized = Record<Lang, string[]>;

export const SKILLS: Record<Domain, Localized> = {
  ai: {
    fr: ['Prompt engineering', 'Agents IA & automatisation', 'RAG', 'Architecture IA', 'Sécurité IA'],
    en: ['Prompt engineering', 'AI agents & automation', 'RAG', 'AI architecture', 'AI security'],
  },
  cyber: {
    fr: ['Sécurité réseau', 'Sécurité cloud', 'Gestion des risques', 'Conformité & SMSI'],
    en: ['Network security', 'Cloud security', 'Risk management', 'Compliance & ISMS'],
  },
  dev: {
    fr: ['Python', 'SQL', 'C / C++', 'Java', 'JavaScript', 'HTML / CSS'],
    en: ['Python', 'SQL', 'C / C++', 'Java', 'JavaScript', 'HTML / CSS'],
  },
  consulting: {
    fr: ['Stratégie SI', 'Gestion de projet', 'Marketing digital', 'Acquisition client'],
    en: ['IT strategy', 'Project management', 'Digital marketing', 'Client acquisition'],
  },
  product: {
    fr: ['Produit SaaS', 'UX / UI', 'Branding', 'E-commerce'],
    en: ['SaaS product', 'UX / UI', 'Branding', 'E-commerce'],
  },
};

export const LANGUAGES: Localized = {
  fr: ['Français · natif', 'Anglais · C1', 'Espagnol · B2'],
  en: ['French · native', 'English · C1', 'Spanish · B2'],
};
