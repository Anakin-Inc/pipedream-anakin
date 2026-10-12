import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-catalog",
  name: "Browse Wire Catalog",
  description: "Browses the Wire catalog. With no slug, lists every supported website and its action count. Pass a catalog slug (e.g. `walmart`, `amazon`, `linkedin`) to get that site's full action list with exact parameter schemas, each action's type (read/write), auth mode, and credit cost. [See the docs](https://anakin.io/docs/api-reference/wire/list-catalogs).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
  props: {
    anakin,
    slug: {
      type: "string",
      label: "Catalog Slug",
      description: "Catalog slug to inspect, e.g. `walmart`. Omit to list all catalogs.",
      optional: true,
    },
  },
  async run({ $ }) {
    const result = await this.anakin.wireCatalog({
      $,
      slug: this.slug,
    });

    $.export(
      "$summary",
      this.slug
        ? `Fetched the Wire catalog for "${this.slug}"`
        : `Fetched ${result.catalog?.length ?? 0} Wire catalog(s)`,
    );
    return result;
  },
};
