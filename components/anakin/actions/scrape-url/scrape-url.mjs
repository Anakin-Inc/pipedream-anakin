import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-scrape-url",
  name: "Extract Website Data",
  description: "Extracts structured data from a website — markdown, HTML, and optional AI-extracted JSON. Submits a scrape job and polls until complete. [See the docs](https://anakin.io/docs/api-reference/url-scraper/submit-scrape-job).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: true,
  },
  props: {
    anakin,
    url: {
      type: "string",
      label: "URL",
      description: "The full URL of the website to extract data from.",
    },
    generateJson: {
      type: "boolean",
      label: "Generate JSON",
      description: "AI-extract structured JSON from the page content.",
      optional: true,
      default: false,
    },
    country: {
      type: "string",
      label: "Country",
      description: "Country code for proxy routing, e.g. `us`, `gb`, `de`.",
      optional: true,
      default: "us",
    },
    useBrowser: {
      type: "boolean",
      label: "Use Browser",
      description: "Use a headless browser — best for JS-heavy sites.",
      optional: true,
      default: false,
    },
    forceFresh: {
      type: "boolean",
      label: "Force Fresh",
      description: "Bypass the cache and force a fresh extraction.",
      optional: true,
      default: false,
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
      default: 3,
    },
  },
  async run({ $ }) {
    const { jobId } = await this.anakin.submitScrape({
      $,
      url: this.url,
      generateJson: this.generateJson,
      country: this.country,
      useBrowser: this.useBrowser,
      forceFresh: this.forceFresh,
    });

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getScrapeJob({
        $,
        jobId,
      });
      if (job.status === "completed" || job.status === "failed") break;
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin scrape job ${jobId} did not complete within ${this.maxWaitTime}s (last status: ${job.status})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval * 1000));
    } while (true);

    if (job.status === "failed") {
      throw new Error(`Anakin scrape job ${jobId} failed: ${job.error ?? "unknown error"}`);
    }

    $.export("$summary", `Scraped ${this.url} (${job.durationMs}ms, cached: ${job.cached})`);
    return job;
  },
};
