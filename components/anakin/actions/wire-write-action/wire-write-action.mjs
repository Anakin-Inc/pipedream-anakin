import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-wire-write-action",
  name: "Run Wire Write Action",
  description: "Runs a Wire WRITE action — one whose type is `write` (it performs a state-changing interaction on the target site): submit a form, add an item to a cart, post or send content, update account settings. Discover `action_id`s first with the Discover Wire Actions or Browse Wire Catalog step and confirm the action's type is `write`. Most write actions need auth — pass a `credentialId` from Wire Identities or Wire Login. Submits a task and — for async actions — polls the job until complete. [See the docs](https://anakin.io/docs/api-reference/wire/execute-task).",
  version: "0.0.1",
  type: "action",
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
      description: "Maximum time to wait for an async job to complete before failing the step.",
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
    const body = { action_id: this.actionId };
    if (this.params && Object.keys(this.params).length > 0) body.params = this.params;
    if (this.credentialId) body.credential_id = this.credentialId;
    if (this.identityId) body.identity_id = this.identityId;

    const accepted = await this.anakin.submitWireTask({ $, ...body });

    if (!accepted.job_id) {
      // Synchronous action — terminal data was already returned inline.
      $.export("$summary", `Ran Wire write action ${this.actionId}`);
      return accepted;
    }

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getWireJob({ $, jobId: accepted.job_id });
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

    $.export("$summary", `Ran Wire write action ${this.actionId} (credits used: ${job.credits_used ?? "n/a"})`);
    return job;
  },
};
