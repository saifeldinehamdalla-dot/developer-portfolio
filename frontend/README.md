# Developer Portfolio

A standalone Angular portfolio with a local-first CMS, messages inbox, media library, backup/restore, and a swappable local/API data layer.

## Prerequisites

- Node.js `24.15.0` or newer (Angular CLI 22 requires `^22.22.3 || ^24.15.0 || >=26.0.0`).
- pnpm, run from the repository root so workspace catalog dependencies resolve.

Use pnpm rather than npm; this workspace uses pnpm's `catalog:` protocol. Install with lifecycle scripts disabled per the workspace's package-build policy.
In Windows PowerShell, use `pnpm.cmd` if the `pnpm` PowerShell shim is blocked by execution policy; use `pnpm` in other shells.

## Run and verify

```sh
pnpm.cmd install --ignore-scripts
pnpm.cmd --filter @workspace/dev-portfolio run dev
pnpm.cmd --filter @workspace/dev-portfolio run typecheck
pnpm.cmd --filter @workspace/dev-portfolio run build
pnpm.cmd --filter @workspace/dev-portfolio run test
```

The development server is available at `http://localhost:4200`. To run tests without watch mode, use `pnpm.cmd --filter @workspace/dev-portfolio exec ng test --watch=false` in PowerShell.

## Admin

Open `/admin/login` to sign in, then use `/admin` to manage portfolio content. API mode authenticates through the configured backend. The local login session expires after eight hours. A password change only applies to this browser.

The admin includes an overview, project and skill managers, messages inbox, media library, site content editor, settings, and JSON backup/restore. The public contact form saves messages to the same inbox. Portfolio edits update the public page through the shared signal store.

## Data source

The active source is selected by `dataSource: 'local' | 'api'` in the environment files under `src/app/core/environments/`. All environment files currently use API mode with `https://saifhamdalla.runasp.net/api`. The production build replaces `environment.ts` with `environment.production.ts`.

The API contract includes `GET /Messages/unread-count`; a 401 clears the session and returns to sign-in with a session-expired notice.

- **Local mode:** projects, skills, messages, profile, and settings persist in this browser's localStorage. Compressed image files and PDFs live in IndexedDB. They are not shared across visitors or browsers. Use the Admin backup card regularly.
- **API mode:** set `dataSource: 'api'` and `apiUrl` to your ASP.NET API root, such as `https://localhost:7000/api`. The client calls `GET/POST /Projects`, `PUT/DELETE /Projects/{id}`, `GET/POST /Skills`, `PUT/DELETE /Skills/{id}`, `POST /Messages`, `GET /Messages`, `PUT /Messages/{id}/read?isRead=`, `DELETE /Messages/{id}`, and `POST /Auth/login`. Writes after login send a Bearer token. A 401 clears the session and returns to sign-in.

The planned API contract does not include profile/settings or media upload endpoints yet. Those remain in browser storage in API mode. Add server endpoints and update the HttpAdapter before expecting profile settings or media to sync across devices. The app does not silently switch an API session to local mode on API errors.

If the API is hosted on another origin, enable CORS for the portfolio origin. For writes, ensure the API accepts the JSON model fields and the Bearer token contract described above.

## Netlify deployment

From `artifacts/dev-portfolio`, run `pnpm run build` and manually publish `dist/public`. The `public/_redirects` file and `netlify.toml` configure SPA routing; the Netlify config also applies security headers and long-term caching to generated JavaScript and CSS bundles.

## Personalize

`src/app/core/portfolio.config.ts` is the default profile seed only. Update it before first use to replace the sample name, bio, contact information, social links, availability, and SEO text. After the browser profile has been edited in the CMS, that saved profile takes precedence over the seed.

No personal CV or portrait is included. Add your own CV through the Content editor; the public download link remains hidden until a valid asset is selected.

## Backup and restore

Use **Export all data** in Admin to download one JSON file containing projects, skills, messages, profile, settings, and media. To restore, select a backup JSON file and confirm replacement. Import validates the format and version before replacing content. Keep backup files somewhere outside the browser.

## Temporary authentication warning

Local-mode credentials are client-side and do not provide secure authentication. The environment username and password are blank; do not use this gate to protect sensitive information. Connect server-side authentication/authorization before treating the admin as private. API mode uses the configured ASP.NET login endpoint and expects the API to enforce authorization.
