import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

const repository = process.env.GITHUB_REPOSITORY ?? '';
const [repoOwner = '', repoName = ''] = repository.split('/');
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const isUserOrOrgPage = repoName.endsWith?.('.github.io') ?? false;

const ensureTrailingSlash = (value) => {
  if (!value) return '/';
  return value.endsWith('/') ? value : `${value}/`;
};

const derivedBase = isGithubPages && repoName && !isUserOrOrgPage ? `/${repoName}/` : '/';

const derivedSite = (() => {
  if (process.env.SITE_URL) {
    return ensureTrailingSlash(process.env.SITE_URL);
  }
  if (repoOwner) {
    if (isUserOrOrgPage && repoName) {
      return ensureTrailingSlash(`https://${repoName}`);
    }
    if (repoName) {
      return ensureTrailingSlash(`https://${repoOwner}.github.io${derivedBase}`);
    }
  }
  return ensureTrailingSlash('https://example.com');
})();

export default defineConfig({
  site: derivedSite,
  base: derivedBase,
  output: 'static',
  integrations: [react(), tailwind({ applyBaseStyles: true })],
});
