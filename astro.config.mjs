import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://example.com',
  base: '/',
  output: 'static',
  integrations: [react(), tailwind({ applyBaseStyles: true })],
});
