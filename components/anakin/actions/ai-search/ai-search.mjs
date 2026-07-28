import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-ai-search",
  name: "Perform AI Search",
  description: "AI-powered web search returning an AI-generated summary alongside structured results with citations, snippets, and relevance scores. Synchronous — no polling. [See the docs](https://anakin.io/docs/api-reference/search/search).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    prompt: {
      type: "string",
      label: "Search Query",
      description: "The search query or question, e.g. \"What are the latest trends in AI?\"",
    },
    limit: {
      type: "integer",
      label: "Max Results",
      description: "Maximum number of search results to return (default 5, max 20).",
      optional: true,
      default: 5,
    },
  },
  async run({ $ }) {
    const result = await this.anakin.search({
      $,
      prompt: this.prompt,
      limit: this.limit,
    });

    $.export("$summary", `Found ${result.results?.length ?? 0} result(s) for "${this.prompt}"`);
    return result;
  },
};
