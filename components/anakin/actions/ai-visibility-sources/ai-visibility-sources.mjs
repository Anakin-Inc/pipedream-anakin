import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-ai-visibility-sources",
  name: "List AI Visibility Engines",
  description: "Lists the AI answer engines available to Compare AI Engine Answers — each with its slug (what you pass as Sources) and display label. Call this when you need to query a subset of engines or check what is currently enabled. [See the docs](https://anakin.io/docs/api-reference/ai-visibility/list-sources).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
  },
  async run({ $ }) {
    const result = await this.anakin.aiVisibilitySources({ $ });

    $.export("$summary", `Fetched ${result.sources?.length ?? 0} AI visibility engine(s)`);
    return result;
  },
};
