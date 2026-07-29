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
  key: "anakin-monitor-list",
  name: "List Website Monitors",
  description: "Lists your website monitors, or pass an ID to fetch one monitor's full configuration and status (next/last check time, active state, per-check credit cost, alert settings). [See the docs](https://anakin.io/docs/api-reference/monitoring/list-monitors).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    id: {
      type: "string",
      label: "Monitor ID",
      description: "Fetch just this monitor instead of the full list.",
      optional: true,
    },
  },
  async run({ $ }) {
    const result = this.id
      ? await this.anakin.getMonitor({ $, id: this.id })
      : await this.anakin.listMonitors({ $ });

    $.export(
      "$summary",
      this.id ? `Fetched monitor ${this.id}` : `Fetched ${result.monitors?.length ?? 0} website monitor(s)`,
    );
    return redactSecrets(result);
  },
};
