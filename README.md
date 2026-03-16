This is a [Next.js](https://nextjs.org) project with a Markdown content workflow powered by TinaCMS.

## Getting Started

Use Node `22.21.1` from `.nvmrc`, then install dependencies and start the Tina-enabled development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard. The content editor lives at `/admin/cms` and embeds Tina's local dev app from port `4001`.

## Scripts

- `npm run dev` starts Next.js with Tina's local editing backend enabled.
- `npm run dev:site` starts plain Next.js without Tina's local backend.
- `npm run cms:build:local` regenerates the Tina admin bundle in local mode.
- `npm run cms:build` generates the production Tina admin bundle for TinaCloud and skips TinaCloud schema gate checks during CI builds.
- `npm run build` runs the production Tina build, then the Next.js production build.
- `npm run build:local` keeps the previous local-only build flow for local testing.

## Content Editing

Articles remain in `content/articles` as Markdown with frontmatter. Tina writes to the same files the site already reads, so the frontend rendering path stays unchanged.

Tina uses local mode during `npm run dev`. Run that command so Tina can serve its local GraphQL endpoint on port `4001`; otherwise the editor UI will load without a working backend.

## Cloudflare Deploy

To make `/admin` and `/admin/cms` work after a Cloudflare deployment, set these environment variables in Cloudflare:

```bash
NEXT_PUBLIC_TINA_CLIENT_ID=your_tinacloud_client_id
TINA_TOKEN=your_tinacloud_readonly_token
TINA_SEARCH_INDEXER_TOKEN=your_tinacloud_search_token
NEXT_PUBLIC_TINA_BRANCH=main
```

Notes:

- `CF_PAGES_BRANCH` is provided automatically by Cloudflare Pages, and `tina/config.ts` will use it if `NEXT_PUBLIC_TINA_BRANCH` is not set.
- `NEXT_PUBLIC_TINA_BRANCH` is useful if you want to force a specific production branch.
- `TINA_SEARCH_INDEXER_TOKEN` is optional unless you want Tina search indexing.
- Production builds should use `npm run build`, not `npm run build:local`.
- Cloudflare builds can start before TinaCloud finishes syncing the latest schema for the branch. The production Tina build therefore uses `--skip-cloud-checks` so deploys do not fail on that temporary mismatch.
- The current `/admin` login gate is still a lightweight client-side gate. For real production protection on Cloudflare, put `/admin*` behind Cloudflare Access as well.

## Tina Search

Tina search is now wired in `tina/config.ts`, but it only activates when `TINA_SEARCH_INDEXER_TOKEN` is set in `.env`. That keeps the current local-only CMS setup from failing when no TinaCloud search token is available.

Set this before using search:

```bash
TINA_SEARCH_INDEXER_TOKEN=your_tina_search_token
```

Current search behavior:

- Tina search uses the built-in Tina provider with English stopwords.
- Fuzzy search is enabled with Tina's recommended defaults.
- `audio` is excluded from indexing.
- `summary` and `body` have explicit search length limits to keep indexing reasonable.

If you change the token or search config, restart `npm run dev` so Tina regenerates its local admin app and search index.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TinaCMS Documentation](https://tina.io/docs)
