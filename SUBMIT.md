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
  anakin.app.mjs                                            auth + shared HTTP methods (one wrapper method per REST endpoint)
  actions/scrape-url/scrape-url.mjs                         submit a scrape job, poll to completion
  actions/ai-search/ai-search.mjs                           synchronous AI search
  actions/map/map.mjs                                       submit a URL-discovery (map) job, poll to completion
  actions/crawl/crawl.mjs                                   submit a multi-page crawl job, poll to completion
  actions/agentic-search/agentic-search.mjs                 submit a deep-research job, poll to completion
  actions/wire-discover/wire-discover.mjs                   resolve a natural-language intent to candidate Wire actions
  actions/wire-catalog/wire-catalog.mjs                     browse the Wire catalog (all sites, or one site's actions)
  actions/wire-read-action/wire-read-action.mjs             run a Wire READ action, poll async jobs to completion
  actions/wire-write-action/wire-write-action.mjs           run a Wire WRITE action, poll async jobs to completion
  actions/wire-identities/wire-identities.mjs                list saved Wire identities/credentials
  actions/wire-login/wire-login.mjs                          sign in to a credentials-mode Wire site
  actions/wire-build/wire-build.mjs                          request a new Wire action for an uncatalogued site
  actions/wire-build-status/wire-build-status.mjs            check a Wire build (or list recent builds)
  actions/monitor-create/monitor-create.mjs                  create a scheduled website monitor
  actions/monitor-list/monitor-list.mjs                       list monitors, or fetch one by id
  actions/monitor-changes/monitor-changes.mjs                 list a monitor's detected changes
  actions/monitor-control/monitor-control.mjs                 pause / resume / run_now / delete a monitor
  actions/ai-visibility-search/ai-visibility-search.mjs      fan a query out to AI answer engines, poll to completion
  actions/ai-visibility-sources/ai-visibility-sources.mjs    list available AI answer engines
  actions/session-list/session-list.mjs                       list saved browser sessions
  actions/session-delete/session-delete.mjs                   delete a saved browser session
  actions/browser-task/browser-task.mjs                       run a natural-language AI browser task, poll to completion
```

**22 of 22** capabilities covered — every tool the internal `anakin-mcp`
server exposes (`anakin-mcp/src/tools/*.ts`, 22 tools across 10 files) now
has a matching Pipedream action, built directly off `anakin-mcp/src/client.ts`
(the source-of-truth HTTP client) rather than the public docs alone — see
"Endpoints used" below for where the two disagreed. The first two actions
(scrape-url, ai-search) previously shipped alone; this pass added the
remaining 19, including `agentic-search`, which an earlier note in this file
had flagged as deliberately out of scope for a follow-on.

Each new action follows `scrape-url.mjs`'s pattern exactly: `anakin.app.mjs`
holds one thin HTTP wrapper method per endpoint (submit/get pairs for async
jobs), and the action file owns orchestration — prop validation, the
submit-then-poll loop, `maxWaitTime`/`pollInterval` props, and the
`$.export("$summary", …)` call. No shared job-polling helper was introduced;
duplicating a ~15-line loop across action files keeps each one independently
readable and copy-pasteable, matching how Pipedream's own component library
is written.

Two deliberate deviations from `anakin-mcp`, called out here rather than
silently baked in:

- **No financial-transaction guard.** `anakin-mcp`'s `wire_write_action` /
  `browser_task` / `wire_build` refuse anything that looks like a payment or
  fund transfer (`src/tools/policy.ts`) — that's a defense-in-depth
  requirement specific to Anthropic's Connectors Directory review, not a
  constraint of the Anakin API itself. Pipedream has no equivalent
  requirement and workflow builders may have legitimate checkout automations,
  so `wire-write-action.mjs` and `browser-task.mjs` do not reproduce it.
- **Secret redaction is kept.** `anakin-mcp`'s monitor tools strip
  `alertWebhookSecret` (an HMAC signing secret) from every response before it
  reaches the model (`src/tools/monitor.ts`). That's a genuine security
  property, not a Directory-specific one — a webhook secret shouldn't land in
  a workflow's step output/logs — so `monitor-create.mjs`, `monitor-list.mjs`,
  `monitor-changes.mjs`, and `monitor-control.mjs` all redact it the same way.

## Endpoints used (verified against `anakin-mcp/src/client.ts` + current docs, 2026-07-29)

- `POST /url-scraper` → `{jobId, status}`, `GET /url-scraper/{jobId}` — scrape-url
- `POST /search` (synchronous) — ai-search
- `POST /map` → `{jobId}`, `GET /map/{jobId}` — map
- `POST /crawl` → `{jobId}`, `GET /crawl/{jobId}` — crawl
- `POST /agentic-search` → `{jobId}`, `GET /agentic-search/{jobId}` — agentic-search
- `GET /wire/resolve?q=&limit=` — wire-discover
- `GET /wire/catalog` or `GET /wire/catalog/{slug}` — wire-catalog
- `POST /wire/task` → inline result or `{job_id}`; `GET /wire/jobs/{jobId}` — wire-read-action, wire-write-action
- `GET /wire/identities?catalog_id=` — wire-identities
- `POST /wire/login` — wire-login
- `POST /wire/build-request` — wire-build
- `GET /wire/build-requests/{id}`, `GET /wire/build-requests?status=&limit=&page=` — wire-build-status
- `POST /monitors`; `GET /monitors`; `GET /monitors/{id}`; `GET /monitors/{id}/changes`;
  `POST /monitors/{id}/pause|resume|run`; `DELETE /monitors/{id}` — monitor-create/list/changes/control
- `POST /ai-visibility/search` → `{search_id, status}`, `GET /ai-visibility/search/{id}` — ai-visibility-search
- `GET /ai-visibility/sources` — ai-visibility-sources
- `GET /sessions?domain=` — session-list
- `DELETE /sessions/{id}` — session-delete
- `POST /ai/evaluate` (`async: true`) → `{workflow_id, status}`, `GET /ai/jobs/{id}` — browser-task

All under `https://api.anakin.io/v1`, all confirmed request/response shapes
against `anakin-mcp/src/client.ts` (the internal SDK-parity contract) — the
same source `scrape-url.mjs`/`ai-search.mjs` used, extended here to the
remaining 8 tool families (map, crawl, agentic search, Wire, monitoring, AI
visibility, sessions, browser automation). Two spots where the internal
client is more complete than the public docs page:

- `agentic-search`'s public docs page doesn't mention `useBrowser` (default
  `true`) or `schema`; both are real, active request fields per
  `client.ts`'s `AgenticSearchOptions`.
- `POST /ai/evaluate` (browser-task) has no dedicated `api-reference` docs
  page at all — it's only referenced in the rate-limits page and the Claude
  connector integration guide. Confirmed live and load-bearing via
  `anakin-mcp/src/tools/browser-task.ts` and `client.ts`'s `browserTask()`,
  which is why the doc link on that action points at the integration guide
  instead of a `docs/api-reference/...` page.

Auth: `X-API-Key` header (confirmed accepted per the Go API's auth
middleware, which takes several header variants) — unchanged from the
original two actions, reused by every new one via `anakin.app.mjs`.

## Pipedream conventions applied (Oct 2026)

- Every action declares `annotations` (`readOnlyHint`, `destructiveHint`,
  `openWorldHint`), taken from `anakin-mcp` with one change: create-type
  actions (monitor-create, wire-build, wire-login) are `destructiveHint: false`.
  MCP marks them destructive only to force an approval prompt in Claude.
- `package.json` publishes `@pipedream/anakin` with `@pipedream/platform`.
- `wire-build`'s login is split into Pipedream props, with the password as
  `secret: true`; incomplete logins throw `ConfigurationError` before any
  request, and never echo the password.
- Async actions poll inside the step (as `scrapegraphai` does). Their
  `maxWaitTime` descriptions warn that Pipedream's workflow timeout (30s by
  default for HTTP triggers, max 300s free / 750s paid) stops the step first.
- Do not add `ai: "optimized"`; Pipedream's team sets it.

### Verified locally against the monorepo's own CI checks

In a sparse checkout of `PipedreamHQ/pipedream` with root dev dependencies:

```
eslint components/anakin/**            # clean (was 216 errors before --fix)
node scripts/findBadKeys.js ...        # pass (fails on a planted bad key)
node scripts/checkComponentAppProp.js  # pass
node scripts/findDuplicateKeys.js      # pass
```

Plus a mocked harness over wire-build and wire-build-status.

## Submission process

Pipedream creates the app record (auth config) itself; a vendor cannot.

1. **Request the app** with the
   [App / Integration Request](https://github.com/PipedreamHQ/pipedream/issues/new?template=app---service-integration.md)
   form, **in the web UI**. An issue filed through the API loses the
   template's `app` label and is ignored (two vendors had to refile). Ask for
   slug `anakin` and a custom-auth field named exactly `api_key`, sent as the
   `X-API-Key` header. Turnaround has been a few days to three weeks.
2. Once staff reply that the app is provisioned, open the components PR from
   the `Anakin-Inc/pipedream` fork with `components/anakin/` at the same path.
   Send them a logo (SVG plus a 512px PNG) when they ask.
3. Pipedream QA runs evals against the components, then merges. A merged PR
   publishes automatically to pipedream.com/apps/anakin.

## Not done

Nobody has run these against the live API from a Pipedream workspace.
Pipedream's QA does that during review; doing it first (`pd publish` to our
own account with a real key) would catch problems earlier.
