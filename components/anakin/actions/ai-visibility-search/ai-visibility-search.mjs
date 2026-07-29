import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-ai-visibility-search",
  name: "Compare AI Engine Answers",
  description: "Asks multiple AI answer engines (ChatGPT, Gemini, Google AI Overview) the same question and compares their answers. Returns one result per engine — status, an answer summary, latency, credits used — plus an AI-generated synthesis of where the engines agree and diverge. Use for brand/AI-SEO visibility checks (\"what do AI engines say about X\"), answer comparison, and geo-specific AI answers. Submits a search and polls until it leaves the `running` state (a `failed` status can still carry per-source results, so it is returned rather than thrown). [See the docs](https://anakin.io/docs/api-reference/ai-visibility/submit-search).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    query: {
      type: "string",
      label: "Query",
      description: "The question to ask every engine (max 2000 characters).",
    },
    sources: {
      type: "string[]",
      label: "Sources",
      description: "Engine slugs to query (see Compare AI Engine Answers → List AI Visibility Engines). Omit to query all enabled engines.",
      optional: true,
    },
    country: {
      type: "string",
      label: "Country",
      description: "Two-letter ISO country for the search geography (proxy exit).",
      optional: true,
      default: "us",
    },
    includeFullContent: {
      type: "boolean",
      label: "Include Full Content",
      description: "Include each engine's raw full answer in the results (large). Summaries and the synthesis are returned regardless.",
      optional: true,
      default: false,
    },
    maxWaitTime: {
      type: "integer",
      label: "Max Wait Time (seconds)",
      description: "Maximum time to wait for the search to complete before failing the step.",
      optional: true,
      default: 300,
    },
    pollInterval: {
      type: "integer",
      label: "Poll Interval (seconds)",
      description: "Seconds between status checks while the search is running.",
      optional: true,
      default: 3,
    },
  },
  async run({ $ }) {
    const body = { query: this.query };
    if (this.sources && this.sources.length > 0) body.sources = this.sources;
    if (this.country) body.country = this.country;

    let search = await this.anakin.submitAiVisibilitySearch({ $, ...body });

    const deadline = Date.now() + this.maxWaitTime * 1000;
    while (search.status === "running") {
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin AI visibility search ${search.search_id} did not complete within ${this.maxWaitTime}s`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval * 1000));
      search = await this.anakin.getAiVisibilitySearch({ $, searchId: search.search_id });
    }

    const results = (search.results ?? []).map((r) => {
      if (this.includeFullContent) return r;
      const { full_content, ...rest } = r;
      return rest;
    });

    $.export("$summary", `Compared ${results.length} AI engine answer(s) for "${this.query}"`);
    return {
      search_id: search.search_id,
      status: search.status,
      country: search.country,
      synthesis: search.synthesis,
      results,
    };
  },
};
