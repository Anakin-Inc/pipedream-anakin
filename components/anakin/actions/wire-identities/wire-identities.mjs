import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-identities",
  name: "List Wire Identities",
  description: "Lists your saved Wire identities and their credentials. An identity is a named account on a site; each credential's `id` is the Credential ID to pass to Run Wire Read Action / Run Wire Write Action for actions whose auth mode is `required`. Optionally filter by catalog. [See the docs](https://anakin.io/docs/api-reference/wire/list-identities).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
  props: {
    anakin,
    catalogId: {
      type: "string",
      label: "Catalog ID",
      description: "Optional — restrict to identities for a single catalog.",
      optional: true,
    },
  },
  async run({ $ }) {
    const result = await this.anakin.wireIdentities({
      $,
      catalogId: this.catalogId,
    });

    $.export("$summary", `Fetched ${result.identities?.length ?? 0} Wire identit${result.identities?.length === 1
      ? "y"
      : "ies"}`);
    return result;
  },
};
