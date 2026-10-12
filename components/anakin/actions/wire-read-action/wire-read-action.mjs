import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-read-action",
  name: "Run Wire Read Action",
  description: "Runs a Wire READ action — one whose type is `read` (it extracts data and does not change state on the target site): search listings, fetch a category's products, get a product's price/specs/reviews, read a profile, pull dashboard metrics. Discover `action_id`s first with the Discover Wire Actions or Browse Wire Catalog step and confirm the action's type is `read`. Most read actions need no auth; if the action's auth mode is `required`, pass a `credentialId` from Wire identities. Submits a task and — for async actions — polls the job until complete. [See the docs](https://anakin.io/docs/api-reference/wire/execute-task).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    anakin,
    actionId: {
      type: "string",
      label: "Action ID",
      description: "The action to run (from the Discover Wire Actions or Browse Wire Catalog step).",
    },
    params: {
      type: "object",
      label: "Params",
      description: "The action's input parameters. Shape depends on the action — use its parameter schema from discovery. Omit for actions that take none.",
      optional: true,
    },
    credentialId: {
      type: "string",
      label: "Credential ID",
      description: "Required when the action's auth mode is `required`; honored when `optional`. Get one from Wire Identities or Wire Login.",
      optional: true,
    },
    identityId: {
      type: "string",
      label: "Identity ID",
      description: "Optional identity selector — the server resolves a credential from it (alternative to Credential ID).",
      optional: true,
    },
    maxWaitTime: {
      type: "integer",
      label: "Max Wait Time (seconds)",
      description: "Maximum time to wait for an async job to complete before failing the step. Pipedream stops a workflow at its own timeout first (30s by default for HTTP triggers), so raise the workflow's **Timeout** in Settings for long jobs.",
      optional: true,
      default: 300,
    },
    pollInterval: {
      type: "integer",
      label: "Poll Interval (seconds)",
      description: "Fallback seconds between status checks while waiting for the job to complete (the server's own pacing hint is used when present).",
      optional: true,
      default: 3,
    },
  },
  async run({ $ }) {
    const body = {
      action_id: this.actionId,
    };
    if (this.params && Object.keys(this.params).length > 0) body.params = this.params;
    if (this.credentialId) body.credential_id = this.credentialId;
    if (this.identityId) body.identity_id = this.identityId;

    const accepted = await this.anakin.submitWireTask({
      $,
      ...body,
    });

    if (!accepted.job_id) {
      // Synchronous action — terminal data was already returned inline.
      $.export("$summary", `Ran Wire read action ${this.actionId}`);
      return accepted;
    }

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getWireJob({
        $,
        jobId: accepted.job_id,
      });
      if (job.status === "completed" || job.status === "failed") break;
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin Wire job ${accepted.job_id} did not complete within ${this.maxWaitTime}s (last status: ${job.status})`,
        );
      }
      const waitMs = Math.min(Math.max(job.retry_after_ms ?? this.pollInterval * 1000, 500), 10000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } while (true);

    if (job.status === "failed") {
      const reason = job.error?.message ?? job.error?.code ?? "unknown error";
      throw new Error(`Anakin Wire job ${accepted.job_id} failed: ${reason}`);
    }

    $.export("$summary", `Ran Wire read action ${this.actionId} (credits used: ${job.credits_used ?? "n/a"})`);
    return job;
  },
};
