import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-session-list",
  name: "List Browser Sessions",
  description: "Lists your saved browser sessions — encrypted login states captured via the Anakin dashboard or Browser API. Each session's ID is what you pass as Session ID to scrape/crawl, Create a Website Monitor, or Run AI Browser Task to work with login-protected pages. Optionally filter by the website domain the session belongs to. [See the docs](https://anakin.io/docs/api-reference/browser-sessions).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    domain: {
      type: "string",
      label: "Domain",
      description: "Filter to sessions for one website domain, e.g. \"amazon.com\".",
      optional: true,
    },
  },
  async run({ $ }) {
    const result = await this.anakin.listSessions({ $, domain: this.domain });

    $.export("$summary", `Fetched ${Array.isArray(result) ? result.length : (result.sessions?.length ?? 0)} browser session(s)`);
    return result;
  },
};
