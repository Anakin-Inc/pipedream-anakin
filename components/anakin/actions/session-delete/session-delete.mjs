import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-session-delete",
  name: "Delete a Browser Session",
  description: "Permanently deletes a saved browser session and its encrypted login data. Irreversible — you must log in again through the dashboard to recreate it, and any monitors or requests referencing this Session ID will lose authenticated access. Find IDs with List Browser Sessions. [See the docs](https://anakin.io/docs/api-reference/browser-sessions).",
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
      label: "Session ID",
      description: "The session ID to delete (from List Browser Sessions).",
    },
  },
  async run({ $ }) {
    const result = await this.anakin.deleteSession({
      $,
      id: this.id,
    });

    $.export("$summary", `Deleted browser session ${this.id}`);
    return result;
  },
};
