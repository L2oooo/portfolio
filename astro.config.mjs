// @ts-check
/*
 * Astro configuration.
 * i18n: French is the default locale served at "/", English lives under "/en/".
 */
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
