import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-crawl",
  name: "Crawl a Website",
  description: "Bulk-fetches markdown across a site — useful for catalog ingestion or building a site-wide RAG corpus. Submits a crawl job and polls until complete. [See the docs](https://anakin.io/docs/api-reference/crawl/submit-crawl-job).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    url: {
      type: "string",
      label: "URL",
      description: "The starting URL to crawl from.",
    },
    maxPages: {
      type: "integer",
      label: "Max Pages",
      description: "Hard cap on pages fetched.",
      optional: true,
      default: 10,
    },
    depth: {
      type: "integer",
      label: "Depth",
      description: "Link-hops from the starting URL to follow.",
      optional: true,
      default: 1,
    },
    country: {
      type: "string",
      label: "Country",
      description: "Two-letter proxy egress country code, e.g. `us`, `gb`, `de`.",
      optional: true,
      default: "us",
    },
    useBrowser: {
      type: "boolean",
      label: "Use Browser",
      description: "Render each page in a headless browser — best for SPAs.",
      optional: true,
      default: false,
    },
    includePatterns: {
      type: "string[]",
      label: "Include Patterns",
      description: "Glob/regex patterns. Only URLs matching at least one pattern are fetched.",
      optional: true,
    },
    excludePatterns: {
      type: "string[]",
      label: "Exclude Patterns",
      description: "Glob/regex patterns. URLs matching any pattern are skipped.",
      optional: true,
    },
    sessionId: {
      type: "string",
      label: "Session ID",
      description: "Optional saved-browser-session ID for login-protected sites.",
      optional: true,
    },
    sessionName: {
      type: "string",
      label: "Session Name",
      description: "Optional saved-browser-session name (alternative to Session ID).",
      optional: true,
    },
    maxWaitTime: {
      type: "integer",
      label: "Max Wait Time (seconds)",
      description: "Maximum time to wait for the job to complete before failing the step.",
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
    const { jobId } = await this.anakin.submitCrawl({
      $,
      url: this.url,
      maxPages: this.maxPages,
      depth: this.depth,
      country: this.country,
      useBrowser: this.useBrowser,
      includePatterns: this.includePatterns,
      excludePatterns: this.excludePatterns,
      sessionId: this.sessionId,
      sessionName: this.sessionName,
    });

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getCrawlJob({ $, jobId });
      if (job.status === "completed" || job.status === "failed") break;
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin crawl job ${jobId} did not complete within ${this.maxWaitTime}s (last status: ${job.status})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval * 1000));
    } while (true);

    if (job.status === "failed") {
      throw new Error(`Anakin crawl job ${jobId} failed: ${job.error ?? "unknown error"}`);
    }

    $.export("$summary", `Crawled ${this.url} — ${job.completedPages ?? 0}/${job.totalPages ?? 0} page(s)`);
    return job;
  },
};
