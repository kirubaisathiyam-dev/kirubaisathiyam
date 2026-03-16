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
- `npm run cms:build` regenerates the Tina admin bundle and generated client files.
- `npm run build` rebuilds Tina first, then runs the Next.js production build.

## Content Editing

Articles remain in `content/articles` as Markdown with frontmatter. Tina writes to the same files the site already reads, so the frontend rendering path stays unchanged.

Tina is configured in local mode right now. Run `npm run dev` so Tina can serve its local GraphQL endpoint on port `4001`; otherwise the editor UI will load without a working backend.

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
