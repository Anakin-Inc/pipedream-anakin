import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-build",
  name: "Build a Wire Action",
  description: "Requests a brand-new Wire action for a website that isn't in the catalog yet. Describe the site and what the action should do or extract; Wire generates and auto-tests a scraper, then publishes it. Asynchronous — returns immediately with `status: \"pending\"` — and charges credits, refunded automatically if the build fails. Only use this after Discover Wire Actions / Browse Wire Catalog confirm no existing action covers the site. [See the docs](https://anakin.io/docs/api-reference/wire/create-build-request).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    websiteUrl: {
      type: "string",
      label: "Website URL",
      description: "The site to build an action for. The domain is extracted automatically.",
    },
    goal: {
      type: "string",
      label: "Goal",
      description: "Natural-language description of what the action should do or extract. Be specific — the builder synthesizes the scraper from this.",
    },
    catalogId: {
      type: "string",
      label: "Catalog ID",
      description: "Optional — attach to an existing catalog instead of creating one.",
      optional: true,
    },
    visibility: {
      type: "string",
      label: "Visibility",
      description: "Action visibility.",
      optional: true,
      options: ["private", "public"],
      default: "private",
    },
    force: {
      type: "boolean",
      label: "Force",
      description: "Build even if similar actions already exist for the domain (otherwise the request is rejected with `ACTION_EXISTS`).",
      optional: true,
      default: false,
    },
  },
  async run({ $ }) {
    const body = {
      website_url: this.websiteUrl,
      goal: this.goal,
    };
    if (this.catalogId) body.catalog_id = this.catalogId;
    if (this.visibility) body.visibility = this.visibility;
    if (this.force !== undefined) body.force = this.force;

    const result = await this.anakin.wireBuild({ $, ...body });

    $.export("$summary", `Requested a new Wire action for ${this.websiteUrl}`);
    return result;
  },
};
