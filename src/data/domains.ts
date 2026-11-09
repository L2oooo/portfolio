/*
 * Domains — the 5 expertise areas of the site.
 * Single source of truth shared by the content schema, the topology map nodes
 * and the lens selector, so the three can never drift apart.
 * Labels are translated in src/i18n/ui.ts under the "domain.<id>" keys.
 */

export const DOMAINS = ['ai', 'cyber', 'dev', 'consulting', 'product'] as const;

export type Domain = (typeof DOMAINS)[number];
