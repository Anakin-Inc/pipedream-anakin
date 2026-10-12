# pipedream-anakin

Pipedream components for [Anakin](https://api.anakin.io) — web scraping, site
mapping/crawling, AI search and deep research, the Wire automation catalog,
website monitoring, AI visibility (multi-engine answer comparison), saved
browser sessions, and AI-driven browser automation.

```
components/anakin/
  anakin.app.mjs        auth (X-API-Key) + one HTTP wrapper method per Anakin REST endpoint
  actions/*/*.mjs        22 actions, one per Anakin capability — see SUBMIT.md for the full list
  package.json           @pipedream/anakin package manifest
```

22 of 22 capabilities are covered (parity with the `anakin-mcp` tool
registry — `anakin-mcp/src/tools/*.ts`). Every action follows the same
shape: submit → poll to completion for async jobs (`maxWaitTime` /
`pollInterval` props control the wait), or a single request for synchronous
ones.

This is component *source*, not a published/installed Pipedream app — see
[`SUBMIT.md`](./SUBMIT.md) for what's verified, what still needs the account
owner (registering the app + `pd publish` against a live key), and the exact
endpoint/behavior notes for each action.
