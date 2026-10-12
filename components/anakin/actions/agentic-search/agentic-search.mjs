import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-agentic-search",
  name: "Perform Deep Research",
  description: "Runs multi-source deep research: searches the web, scrapes the most relevant citations, and uses AI to structure the combined data into a unified answer. Use this when a single URL or a flat search result can't answer the question (comparative analysis, multi-jurisdictional research, market intelligence). Submits a research job and polls until complete. [See the docs](https://anakin.io/docs/api-reference/agentic-search/submit-search).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    anakin,
    prompt: {
      type: "string",
      label: "Prompt",
      description: "The research question or task in natural language.",
    },
    schema: {
      type: "object",
      label: "Output Schema",
      description: "Optional JSON Schema describing the desired output shape. If omitted, the engine infers a schema from the prompt.",
      optional: true,
    },
    useBrowser: {
      type: "boolean",
      label: "Use Browser",
      description: "Use the headless browser when scraping cited pages — more reliable for JS-heavy sources.",
      optional: true,
      default: true,
    },
    maxWaitTime: {
      type: "integer",
      label: "Max Wait Time (seconds)",
      description: "Maximum time to wait for the job to complete before failing the step. Pipedream stops a workflow at its own timeout first (30s by default for HTTP triggers), so raise the workflow's **Timeout** in Settings for long jobs.",
      optional: true,
      default: 300,
    },
    pollInterval: {
      type: "integer",
      label: "Poll Interval (seconds)",
      description: "Seconds between status checks while waiting for the job to complete.",
      optional: true,
      default: 5,
    },
  },
  async run({ $ }) {
    const body = {
      prompt: this.prompt,
      useBrowser: this.useBrowser === undefined
        ? true
        : this.useBrowser,
    };
    if (this.schema && Object.keys(this.schema).length > 0) {
      body.schema = this.schema;
    }

    const { jobId } = await this.anakin.submitAgenticSearch({
      $,
      ...body,
    });

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getAgenticSearchJob({
        $,
        jobId,
      });
      if (job.status === "completed" || job.status === "failed") break;
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin agentic search job ${jobId} did not complete within ${this.maxWaitTime}s (last status: ${job.status})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval * 1000));
    } while (true);

    if (job.status === "failed") {
      throw new Error(`Anakin agentic search job ${jobId} failed: ${job.error ?? "unknown error"}`);
    }

    $.export("$summary", `Deep research complete for "${this.prompt}" (cached: ${job.cached})`);
    return job;
  },
};
