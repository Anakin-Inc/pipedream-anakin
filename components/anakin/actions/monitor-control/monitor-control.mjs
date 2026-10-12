import anakin from "../../anakin.app.mjs";

const SECRET_KEYS = new Set([
  "alertWebhookSecret",
]);
const REDACTED = "[redacted — view in the Anakin dashboard]";

/** Deep-copy `value` with any secret-bearing keys replaced so they never land in step output. */
function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [
      k,
      v,
    ] of Object.entries(value)) {
      out[k] = SECRET_KEYS.has(k) && v
        ? REDACTED
        : redactSecrets(v);
    }
    return out;
  }
  return value;
}

export default {
  key: "anakin-monitor-control",
  name: "Control a Website Monitor",
  description: "Controls an existing website monitor: `pause` stops scheduled checks, `resume` restarts them (may hit the plan's active-monitor cap), `run_now` triggers an immediate out-of-schedule check (billed like a normal check), and `delete` permanently removes the monitor and its history. Use List Website Monitors to find the ID. [See the docs](https://anakin.io/docs/api-reference/monitoring/control-monitor).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: true,
    openWorldHint: false,
    readOnlyHint: false,
  },
  props: {
    anakin,
    id: {
      type: "string",
      label: "Monitor ID",
      description: "The monitor ID (from List Website Monitors or Create a Website Monitor).",
    },
    action: {
      type: "string",
      label: "Action",
      description: "What to do with the monitor.",
      options: [
        "pause",
        "resume",
        "run_now",
        "delete",
      ],
    },
  },
  async run({ $ }) {
    if (![
      "pause",
      "resume",
      "run_now",
      "delete",
    ].includes(this.action)) {
      throw new Error(`Unknown monitor action "${this.action}" — use pause, resume, run_now, or delete.`);
    }

    const result = await this.anakin.controlMonitor({
      $,
      id: this.id,
      action: this.action,
    });

    $.export("$summary", `${this.action} monitor ${this.id}`);
    return redactSecrets(result);
  },
};
