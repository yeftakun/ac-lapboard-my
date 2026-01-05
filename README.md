# Assetto Corsa Lap Board

## What is this?
- A lightweight Astro + React template that mirrors the `/assetto-corsa` page from my personal site.
- Converts `personalbest.ini` into JSON at build time, so the published page always serves the latest lap data without any runtime fetch.
- Ships with a single config file (`src/data/config.json`) where you control meta tags, featured laps, and driver info.

## Use it as a template
**Requirements:**
- git & github account
- (optional) github cli
- An `personalbest.ini` file from Assetto Corsa

1. **Clone this repo**
```
git clone https://github.com/yeftakun/ac-lapboard
```
2. **Drop your data.** Copy `personalbest.ini` into `data/` and edit `src/data/config.json` based on your preferences.
3. **Remove the remote**
```
git remote remove origin
```
4. **Push to github** If you have github cli installed, run `gh repo create <your-repo-name> --public --source=. --remote=origin --push`. Otherwise, create a new repo on github.com and push manually.
5. **Match the workflow branch.** Ensure the branch listed in [`main.yml`](.github/workflows/main.yml) under `on: push: branches:` matches your repo’s default branch (e.g., `master` or `main`).
6. **Enable github pages** Go to your repo settings → Pages → Select **GitHub Actions** as source.
7. **Wait for the first deployment.** After pushing, go to the Actions tab and wait for the workflow to finish. Your site should be live at `https://<your-github-username>.github.io/<your-repo-name>/`.

## Update your lap data
1. Replace `data/personalbest.ini` with your latest lap data.
2. Commit and push the changes.
3. GitHub Actions will automatically rebuild and deploy your site.

## Preview on local
**Requirements:**
- Node.js v18+

1. `npm install` to install dependencies.
2. `npm run build` to convert INI and build the site.
3. `npm run dev` to start at `http://localhost:4321/`.

### Quick reference
- `npm run laps:convert` → convert INI without building.
- Update fonts/colors in `src/styles/globals.css` if you want a different vibe.

That’s it — swap the data, tweak config, and you’ve got a self-hosted Assetto Corsa lap archive.*** 