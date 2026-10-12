import anakin from "../../anakin.app.mjs";

const SECRET_KEYS = new Set([
  "alertWebhookSecret",
]);
const REDACTED = "[redacted — view in the Anakin dashboard]";

/** Deep-copy `value` with any secret-bearing keys replaced so they never land in step output. */
function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [
      k,
      v,
    ] of Object.entries(value)) {
      out[k] = SECRET_KEYS.has(k) && v
        ? REDACTED
        : redactSecrets(v);
    }
    return out;
  }
  return value;
}

export default {
  key: "anakin-monitor-create",
  name: "Create a Website Monitor",
  description: "Creates a scheduled website monitor that checks a URL every `intervalMinutes` (min 15) and records a change when the content differs — optionally alerting a webhook or email. Scope `page` (default) watches one URL; `site` crawls the site each run and tracks pages added/removed/changed; `wire` runs a Wire action each check and diffs its JSON. Watch mode `full_page` compares the whole page; `specific_data` extracts only the fields in Output Schema with AI — ideal for price/stock/status tracking. [See the docs](https://anakin.io/docs/api-reference/monitoring/create-monitor).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    anakin,
    url: {
      type: "string",
      label: "URL",
      description: "The URL to watch (root URL for site scope; the Wire site's URL for wire scope).",
    },
    intervalMinutes: {
      type: "integer",
      label: "Interval (minutes)",
      description: "Check frequency in minutes. Minimum 15.",
    },
    scope: {
      type: "string",
      label: "Scope",
      description: "What to monitor: one page, a whole site, or a Wire action.",
      optional: true,
      options: [
        "page",
        "site",
        "wire",
      ],
      default: "page",
    },
    watchMode: {
      type: "string",
      label: "Watch Mode",
      description: "Compare the whole page, or only the fields in Output Schema (extracted with AI).",
      optional: true,
      options: [
        "full_page",
        "specific_data",
      ],
      default: "full_page",
    },
    watchFormat: {
      type: "string",
      label: "Watch Format",
      description: "Format compared in full_page mode.",
      optional: true,
      options: [
        "markdown",
        "html",
        "cleaned_html",
      ],
      default: "markdown",
    },
    outputSchema: {
      type: "object",
      label: "Output Schema",
      description: "JSON Schema of the fields to track. Required when Watch Mode is `specific_data`.",
      optional: true,
    },
    aiMode: {
      type: "boolean",
      label: "AI Mode",
      description: "AI meaningful-change filtering: ignores trivial noise (ads, timestamps) and summarizes real changes.",
      optional: true,
      default: false,
    },
    aiGoal: {
      type: "string",
      label: "AI Goal",
      description: "Natural-language description of which changes count as meaningful (used with AI Mode), e.g. \"only when the price drops or it goes out of stock\".",
      optional: true,
    },
    useBrowser: {
      type: "boolean",
      label: "Use Browser",
      description: "Render checks with a stealth headless browser — needed for JS-heavy pages. Forced true when Session ID is set.",
      optional: true,
      default: false,
    },
    country: {
      type: "string",
      label: "Country",
      description: "Two-letter proxy country code.",
      optional: true,
      default: "us",
    },
    sessionId: {
      type: "string",
      label: "Session ID",
      description: "Saved browser-session ID for monitoring login-protected pages.",
      optional: true,
    },
    isActive: {
      type: "boolean",
      label: "Active",
      description: "Start running immediately.",
      optional: true,
      default: true,
    },
    expiresAt: {
      type: "string",
      label: "Expires At",
      description: "Optional end date (ISO 8601 timestamp or YYYY-MM-DD); the monitor auto-pauses when it passes.",
      optional: true,
    },
    alertWebhookUrl: {
      type: "string",
      label: "Alert Webhook URL",
      description: "Webhook URL that receives signed change alerts.",
      optional: true,
    },
    alertEmails: {
      type: "string",
      label: "Alert Emails",
      description: "Comma-separated email recipients for change alerts.",
      optional: true,
    },
    maxPages: {
      type: "integer",
      label: "Max Pages (site scope)",
      description: "Site scope: max pages crawled per run.",
      optional: true,
    },
    maxDepth: {
      type: "integer",
      label: "Max Depth (site scope)",
      description: "Site scope: crawl depth (1–5).",
      optional: true,
    },
    includePatterns: {
      type: "string[]",
      label: "Include Patterns (site scope)",
      description: "Site scope: glob patterns or hand-picked same-site URLs to track.",
      optional: true,
    },
    excludePatterns: {
      type: "string[]",
      label: "Exclude Patterns (site scope)",
      description: "Site scope: glob patterns to skip.",
      optional: true,
    },
    wireActionId: {
      type: "string",
      label: "Wire Action ID (wire scope)",
      description: "Wire scope (required there): the Wire action run each check, e.g. \"amazon.search_products\".",
      optional: true,
    },
    wireCatalogSlug: {
      type: "string",
      label: "Wire Catalog Slug (wire scope)",
      description: "Wire scope: catalog slug of the Wire site.",
      optional: true,
    },
    wireCredentialId: {
      type: "string",
      label: "Wire Credential ID (wire scope)",
      description: "Wire scope: credential ID when the action needs auth.",
      optional: true,
    },
    wireParams: {
      type: "object",
      label: "Wire Params (wire scope)",
      description: "Wire scope: parameters passed to the action each check.",
      optional: true,
    },
    wireWatchPaths: {
      type: "string[]",
      label: "Wire Watch Paths (wire scope)",
      description: "Wire scope: JSON paths to diff instead of the whole response.",
      optional: true,
    },
  },
  async run({ $ }) {
    const body = {
      url: this.url,
      intervalMinutes: this.intervalMinutes,
    };
    const passthrough = [
      "scope",
      "watchMode",
      "watchFormat",
      "outputSchema",
      "aiMode",
      "aiGoal",
      "useBrowser",
      "country",
      "sessionId",
      "isActive",
      "expiresAt",
      "alertWebhookUrl",
      "alertEmails",
      "maxPages",
      "maxDepth",
      "includePatterns",
      "excludePatterns",
      "wireActionId",
      "wireCatalogSlug",
      "wireCredentialId",
      "wireParams",
      "wireWatchPaths",
    ];
    for (const key of passthrough) {
      if (this[key] !== undefined) body[key] = this[key];
    }

    const monitor = await this.anakin.createMonitor({
      $,
      ...body,
    });

    $.export("$summary", `Created a website monitor for ${this.url} (every ${this.intervalMinutes}m)`);
    return redactSecrets(monitor);
  },
};
