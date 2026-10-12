import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-build-status",
  name: "Get Wire Build Status",
  description: "Checks on Wire builds started with the Build a Wire Action step. Pass a build request ID for that build's full detail: its status (`pending` or `processing` means still running), the published actions (each with the `action_id` to run via Run Wire Read Action / Run Wire Write Action), the `skipped` list of capabilities the build could not deliver, and the `catalog_slug` once an action has published. Leave the ID empty to list your recent build requests instead. Read-only; spends no credits. [See the docs](https://anakin.io/docs/api-reference/wire/create-build-request).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
  props: {
    anakin,
    buildRequestId: {
      type: "string",
      label: "Build Request ID",
      description: "The `build_request.id` returned by Build a Wire Action. Leave empty to list recent builds.",
      optional: true,
    },
    status: {
      type: "string",
      label: "Status Filter",
      description: "List mode only — return only builds in this status.",
      optional: true,
      options: [
        "pending",
        "processing",
        "success",
        "failed",
      ],
    },
    limit: {
      type: "integer",
      label: "Limit",
      description: "List mode only — maximum builds to return per page.",
      optional: true,
      default: 10,
      min: 1,
      max: 100,
    },
    page: {
      type: "integer",
      label: "Page",
      description: "List mode only — 1-based page number, for paging past the first `limit` builds (see `pagination.total` in the result).",
      optional: true,
      default: 1,
      min: 1,
    },
    includeEvents: {
      type: "boolean",
      label: "Include Events",
      description: "Detail mode only — include the build's step-by-step event log. Verbose; leave off when polling.",
      optional: true,
      default: false,
    },
  },
  async run({ $ }) {
    const id = this.buildRequestId?.trim();

    if (id) {
      const result = await this.anakin.getWireBuild({
        $,
        id,
      });
      // The step-event log is UI-oriented and verbose; drop it unless asked.
      if (!this.includeEvents && result && typeof result === "object") {
        delete result.events;
      }
      $.export("$summary", `Build ${id} is ${result?.status ?? "unknown"}`);
      return result;
    }

    // Always send a limit so the advertised default (10) applies, not the
    // API's own default (20).
    const params = {
      limit: this.limit ?? 10,
      page: this.page ?? 1,
    };
    if (this.status) params.status = this.status;

    const result = await this.anakin.listWireBuilds({
      $,
      params,
    });
    $.export("$summary", "Retrieved recent Wire build requests");
    return result;
  },
};
