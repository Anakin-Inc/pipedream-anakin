# Pipedream — submission instructions

Pipedream components are plain `.mjs` files in the public
`PipedreamHQ/pipedream` monorepo — this is the one Tier 5 platform that's
fully buildable and testable without live interactive access to Pipedream's
own dashboard (confirmed against their
[Component API Reference](https://pipedream.com/docs/components/api) and
[Contributing guide](https://github.com/PipedreamHQ/pipedream/blob/master/CONTRIBUTING.md)).

## What's here

```
components/anakin/
  anakin.app.mjs                          auth + shared HTTP methods
  actions/scrape-url/scrape-url.mjs       submit a scrape job, poll to completion
  actions/ai-search/ai-search.mjs         synchronous AI search
```

Mirrors two of the four actions already live in the Zapier app (per
`../zapier-integration/WEBHOOK_TO_SCRAPER_GUIDE.md` and the public docs) —
Extract Website Data and Perform AI Search. Agentic Search (start + poll,
async) and the Wire read/write action family aren't included here; they'd
follow the same pattern (see `scrape-url.mjs`'s submit-then-poll shape) as a
natural follow-on, kept out of today's scope to ship the first two
correctly rather than four thinly. When building it, use
`docs/SDK_API_CONTRACT.md` (see below) for the request shape — the public
agentic-search docs page omits `useBrowser` (default `true`) and `schema`,
both of which are real, active parameters.

## Endpoints used (verified against current docs + the internal SDK contract, 2026-07-27)

- `POST https://api.anakin.io/v1/url-scraper` → `{jobId, status}` — body:
  `{url, generateJson, country, useBrowser, forceFresh}`
- `GET https://api.anakin.io/v1/url-scraper/{jobId}` → job status + results
- `POST https://api.anakin.io/v1/search` → synchronous results — body:
  `{prompt, limit}`

**Cross-check your source before trusting a single docs page**: the public
`webapp/content/docs/api-reference/url-scraper/submit-scrape-job.mdx` page
doesn't list `forceFresh` as a request field at all, even though it's a
real, working parameter — confirmed by reading `anakin-py`'s actual client
implementation and `blueprint-scribe-35/docs/SDK_API_CONTRACT.md`, the
internal source of truth both official SDKs implement against. The public
docs pages are good for response shapes but were missing at least one real
request parameter here — worth checking the contract doc directly for any
future Anakin integration work rather than the public docs alone.

Auth: `X-API-Key` header (confirmed accepted per the Go API's auth
middleware, which takes several header variants).

## Steps (needs the account owner)

1. **Register the app** in the Pipedream dashboard (Settings → create app,
   or via the `pd` CLI) — this is where the OAuth-vs-API-key auth field
   itself gets declared server-side; `anakin.app.mjs` assumes an `api_key`
   auth field named exactly that (`this.$auth.api_key`), so whatever gets
   configured in the dashboard must match.
2. Install the `pd` CLI, `pd login`, then `pd publish` each component to
   your own account to test end-to-end against a real Anakin API key before
   opening a PR — `pd dev` (live-reload) only supports sources, not
   actions, per a currently open Pipedream issue, so iterate via
   publish-and-test rather than expecting hot reload.
3. Fork `PipedreamHQ/pipedream`, copy `components/anakin/` into the fork at
   the same path, open a PR per `CONTRIBUTING.md`.

## Not done

Requires the account owner's Pipedream identity to register the app and run
`pd publish` against a live key — nobody has tested these against the real
API yet, so treat as reviewed-but-unexecuted rather than verified working.
