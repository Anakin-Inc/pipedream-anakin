import { ConfigurationError } from "@pipedream/platform";
import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-build",
  name: "Build a Wire Action",
  description: "Requests brand-new Wire actions for a website that isn't in the catalog yet. Describe the site and what to build; optionally list the discrete capabilities as Actions, pin the proxy Country, and add a login to build actions behind a sign-in. Wire generates and auto-tests the scrapers, then publishes them. Asynchronous — returns a `build_request` with an `id`; track it with the Get Wire Build Status step. Charges credits (login builds cost significantly more than public builds), refunded automatically if the build fails. Only use this after Discover Wire Actions / Browse Wire Catalog confirm no existing action covers the site. [See the docs](https://anakin.io/docs/api-reference/wire/create-build-request).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
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
      options: [
        "private",
        "public",
      ],
      default: "private",
    },
    force: {
      type: "boolean",
      label: "Force",
      description: "Build even if similar actions already exist for the domain (otherwise the request is rejected with `ACTION_EXISTS`).",
      optional: true,
      default: false,
    },
    actions: {
      type: "string[]",
      label: "Actions",
      description: "Optional discrete capabilities to build, each as its own action (e.g. `search products`, `get product details`). Leave empty to let the builder infer them from the goal.",
      optional: true,
    },
    country: {
      type: "string",
      label: "Country",
      description: "Optional 2-letter country code (e.g. `US`). The scraper is built and tested through an exit IP in that country; use it when the site geo-gates its content.",
      optional: true,
    },
    loginType: {
      type: "string",
      label: "Login Type",
      description: "Build actions behind a sign-in. `plain` uses the Username and Password below; `vault` uses an entry in an identity source (1Password or Azure) connected to your Anakin account. The login is used once by the builder and never stored.",
      optional: true,
      options: [
        "plain",
        "vault",
      ],
    },
    username: {
      type: "string",
      label: "Username",
      description: "Plain login only — the account username or email.",
      optional: true,
    },
    password: {
      type: "string",
      label: "Password",
      description: "Plain login only — the account password. Used once to sign in, never stored.",
      optional: true,
      secret: true,
    },
    sourceId: {
      type: "string",
      label: "Identity Source ID",
      description: "Vault login only — the ID of the identity source connected to your Anakin account.",
      optional: true,
    },
    sourceRef: {
      type: "object",
      label: "Identity Source Reference",
      description: "Vault login only — locator of the entry inside the source, e.g. `{\"vault_id\": \"...\", \"item_id\": \"...\"}`.",
      optional: true,
    },
    loginUrl: {
      type: "string",
      label: "Login URL",
      description: "Optional — where the site's login form lives, when it differs from the Website URL.",
      optional: true,
    },
  },
  methods: {
    buildCredential() {
      if (!this.loginType) return undefined;
      let credential;
      if (this.loginType === "plain") {
        if (!this.username || !this.password) {
          throw new ConfigurationError("A `plain` login needs both **Username** and **Password**.");
        }
        credential = {
          type: "plain",
          username: this.username,
          password: this.password,
        };
      } else {
        let sourceRef = this.sourceRef;
        if (typeof sourceRef === "string") {
          try {
            sourceRef = JSON.parse(sourceRef);
          } catch {
            sourceRef = undefined;
          }
        }
        if (!this.sourceId || !sourceRef || typeof sourceRef !== "object") {
          throw new ConfigurationError("A `vault` login needs **Identity Source ID** and an **Identity Source Reference** object.");
        }
        credential = {
          type: "vault",
          source_id: this.sourceId,
          source_ref: sourceRef,
        };
      }
      if (this.loginUrl) credential.login_url = this.loginUrl;
      return credential;
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
    const actions = (this.actions ?? []).map((a) => a.trim()).filter(Boolean);
    if (actions.length) body.actions = actions;
    if (this.country?.trim()) body.country = this.country.trim();
    const credential = this.buildCredential();
    if (credential) body.credential = credential;

    const result = await this.anakin.wireBuild({
      $,
      ...body,
    });

    $.export("$summary", `Requested a Wire build for ${this.websiteUrl}${result?.build_request?.id
      ? ` (build ${result.build_request.id})`
      : ""}`);
    return result;
  },
};
