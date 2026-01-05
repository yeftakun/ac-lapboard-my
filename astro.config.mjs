import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import siteConfig from './src/data/config.json' assert { type: 'json' };

const ensureTrailingSlash = (value) => {
  if (!value) return '/';
  return value.endsWith('/') ? value : `${value}/`;
};

const normalizeBase = (value) => {
  if (!value || value === '/') return '/';
  const trimmed = value.replace(/^\/+|\/+$/gu, '');
  return trimmed ? `/${trimmed}/` : '/';
};

const resolveSiteUrl = () => {
  const fromConfig = siteConfig?.meta?.siteUrl;
  if (fromConfig) {
    try {
      return ensureTrailingSlash(new URL(fromConfig).href);
    } catch {
      return ensureTrailingSlash(fromConfig);
    }
  }
  return ensureTrailingSlash('https://example.com');
};

const siteUrl = resolveSiteUrl();

const derivedBase = (() => {
  const explicitBase = siteConfig?.meta?.base;
  if (explicitBase) return normalizeBase(explicitBase);
  try {
    const url = new URL(siteUrl);
    return normalizeBase(url.pathname);
  } catch {
    return '/';
  }
})();

export default defineConfig({
  site: siteUrl,
  base: derivedBase,
  output: 'static',
  integrations: [react(), tailwind({ applyBaseStyles: true })],
});
