import anakin from "../../anakin.app.mjs";

const SECRET_KEYS = new Set(["alertWebhookSecret"]);
const REDACTED = "[redacted — view in the Anakin dashboard]";

/** Deep-copy `value` with any secret-bearing keys replaced so they never land in step output. */
function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.has(k) && v ? REDACTED : redactSecrets(v);
    }
    return out;
  }
  return value;
}

export default {
  key: "anakin-monitor-changes",
  name: "Get Monitor Changes",
  description: "Gets the detected changes for a monitor — each entry records when the watched content differed from the previous check, with a diff/summary (and the AI change summary when AI Mode is on). Use List Website Monitors first to find the monitor ID. [See the docs](https://anakin.io/docs/api-reference/monitoring/snapshots-and-changes).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    id: {
      type: "string",
      label: "Monitor ID",
      description: "The monitor ID (from List Website Monitors or Create a Website Monitor).",
    },
  },
  async run({ $ }) {
    const result = await this.anakin.getMonitorChanges({ $, id: this.id });

    $.export("$summary", `Fetched ${result.changes?.length ?? 0} change(s) for monitor ${this.id}`);
    return redactSecrets(result);
  },
};
