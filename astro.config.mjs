// @ts-check
/*
 * Astro configuration.
 * i18n: French is the default locale served at "/", English lives under "/en/".
 */
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The dev toolbar sits at the bottom center, exactly over the wall's nav bar
  devToolbar: { enabled: false },
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
