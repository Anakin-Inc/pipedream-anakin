import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-browser-task",
  name: "Run an AI Browser Task",
  description: "Runs a natural-language task in a real cloud browser driven by an AI agent: it navigates, clicks, types, scrolls, and extracts on your behalf (\"find the cheapest 65-inch TV on this site and list its specs\", \"fill the contact form with …\"). Use when scraping alone can't do the job (multi-step flows, interactions, complex navigation) and no Wire action covers the site. For login-protected tasks pass Session ID from List Browser Sessions — never put passwords in the prompt. Supply Output Schema to get structured JSON back. Submitted asynchronously and polled to completion (the server hard-caps a run at ~330s). [See the docs](https://anakin.io/docs/integrations/ai-agents/claude-connector).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    prompt: {
      type: "string",
      label: "Prompt",
      description: "The task in natural language. Be specific about the goal and what to return. Never include passwords or secrets — use Session ID for authenticated sites.",
    },
    url: {
      type: "string",
      label: "URL",
      description: "Navigate here before starting. Omit to let the agent follow URLs named in the prompt.",
      optional: true,
    },
    sessionId: {
      type: "string",
      label: "Session ID",
      description: "Saved browser-session ID (from List Browser Sessions) so the task runs logged in.",
      optional: true,
    },
    maxSteps: {
      type: "integer",
      label: "Max Steps",
      description: "Cap on agent steps (navigation/click/type actions).",
      optional: true,
    },
    timeoutMs: {
      type: "integer",
      label: "Timeout (ms)",
      description: "Task timeout in milliseconds (the server caps runs at ~330s regardless).",
      optional: true,
    },
    outputSchema: {
      type: "object",
      label: "Output Schema",
      description: "JSON Schema for the result — the agent returns structured data conforming to it.",
      optional: true,
    },
    maxWaitTime: {
      type: "integer",
      label: "Max Wait Time (seconds)",
      description: "Maximum time to wait for the task to complete before failing the step. Keep above ~330s — the longest legitimate run.",
      optional: true,
      default: 360,
    },
    pollInterval: {
      type: "integer",
      label: "Poll Interval (seconds)",
      description: "Seconds between status checks while waiting for the task to complete.",
      optional: true,
      default: 3,
    },
  },
  async run({ $ }) {
    const body = {
      prompt: this.prompt,
      async: true,
    };
    if (this.url) body.url = this.url;
    if (this.sessionId) body.session_id = this.sessionId;
    if (this.maxSteps) body.max_steps = this.maxSteps;
    if (this.timeoutMs) body.timeout_ms = this.timeoutMs;
    if (this.outputSchema && Object.keys(this.outputSchema).length > 0) {
      body.output_schema = this.outputSchema;
    }

    const accepted = await this.anakin.submitBrowserTask({ $, ...body });

    if (!accepted.workflow_id) {
      // Answered synchronously (shouldn't normally happen with async: true).
      $.export("$summary", `Ran browser task: "${this.prompt}"`);
      return accepted;
    }

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getBrowserTaskJob({ $, jobId: accepted.workflow_id });
      if (job.status === "completed" || job.status === "failed" || job.status === "timed_out") break;
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin browser task ${accepted.workflow_id} did not complete within ${this.maxWaitTime}s (last status: ${job.status})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval * 1000));
    } while (true);

    if (job.status === "failed" || job.status === "timed_out") {
      throw new Error(`Anakin browser task ${job.status}: ${job.error ?? "unknown error"}`);
    }

    $.export("$summary", `Browser task completed: "${this.prompt}"`);
    return job.result ?? job;
  },
};
