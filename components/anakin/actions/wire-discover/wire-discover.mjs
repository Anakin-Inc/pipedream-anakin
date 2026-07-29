import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-discover",
  name: "Discover Wire Actions",
  description: "Finds Wire actions for a task from a natural-language intent. Wire is Anakin's catalog of pre-built automation actions across hundreds of sites (Amazon, Walmart, LinkedIn, Airbnb, Zillow, and others) — some extract data (read), others perform interactions like submitting a form (write). Returns ranked candidate actions with their `action_id`, type, required/optional params, credit cost, and whether auth is needed. Run a returned action with the Run Wire Read Action or Run Wire Write Action step. [See the docs](https://anakin.io/docs/api-reference/wire/search-actions).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    q: {
      type: "string",
      label: "Query",
      description: "The intent in natural language, e.g. \"top phones on walmart\" or \"a linkedin profile's work history\".",
    },
    limit: {
      type: "integer",
      label: "Limit",
      description: "Maximum number of candidate actions to return.",
      optional: true,
      default: 5,
    },
  },
  async run({ $ }) {
    const result = await this.anakin.wireDiscover({
      $,
      q: this.q,
      limit: this.limit,
    });

    $.export("$summary", `Found ${result.results?.length ?? 0} candidate Wire action(s) for "${this.q}"`);
    return result;
  },
};
