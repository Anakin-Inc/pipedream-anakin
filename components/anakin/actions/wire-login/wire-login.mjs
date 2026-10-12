import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-login",
  name: "Sign In to a Wire Site",
  description: "Signs in to a credentials-mode Wire site and returns a `credential_id` usable immediately with Run Wire Read Action / Run Wire Write Action. Provide the catalog slug and login params (the fields that catalog's login schema defines, e.g. email/password — see Browse Wire Catalog's `login_input_schema`). The password is never stored, only the encrypted session. Only needed for actions whose auth mode is `required`; cookie-based sites use the dashboard connect flow instead. [See the docs](https://anakin.io/docs/api-reference/wire/login).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    anakin,
    catalogSlug: {
      type: "string",
      label: "Catalog Slug",
      description: "The catalog to sign in to, e.g. `neb`.",
    },
    params: {
      type: "object",
      label: "Login Params",
      description: "Login fields defined by the catalog (e.g. email, password). Use Browse Wire Catalog's `login_input_schema` to learn the field names.",
      optional: true,
    },
    identityName: {
      type: "string",
      label: "Identity Name",
      description: "Optional name for the identity. Derived from params in password mode; required when using a 1Password locator.",
      optional: true,
    },
    sourceId: {
      type: "string",
      label: "1Password Source ID",
      description: "Optional 1Password identity-source ID (alternative to Login Params).",
      optional: true,
    },
    sourceRef: {
      type: "object",
      label: "1Password Item Locator",
      description: "Optional 1Password item locator ({ vault_id, item_id, fields }) — use with Source ID instead of Login Params.",
      optional: true,
    },
  },
  async run({ $ }) {
    const body = {
      catalog_slug: this.catalogSlug,
    };
    if (this.params && Object.keys(this.params).length > 0) body.params = this.params;
    if (this.identityName) body.identity_name = this.identityName;
    if (this.sourceId) body.source_id = this.sourceId;
    if (this.sourceRef && Object.keys(this.sourceRef).length > 0) body.source_ref = this.sourceRef;

    const result = await this.anakin.wireLogin({
      $,
      ...body,
    });

    $.export("$summary", `Signed in to Wire catalog "${this.catalogSlug}"`);
    return result;
  },
};
