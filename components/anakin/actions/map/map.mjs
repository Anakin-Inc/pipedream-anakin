import anakin from "../../anakin.app.mjs";

export default {
  key: "anakin-map",
  name: "Map a Website",
  description: "Discovers all reachable URLs under a given site — useful for understanding a domain's structure before crawling, or finding the sub-pages to scrape. Submits a map job and polls until complete. [See the docs](https://anakin.io/docs/api-reference/map/submit-map-job).",
  version: "0.0.1",
  type: "action",
  props: {
    anakin,
    url: {
      type: "string",
      label: "URL",
      description: "The starting URL for discovery, typically a homepage or section root.",
    },
    limit: {
      type: "integer",
      label: "Limit",
      description: "Maximum number of URLs to return overall.",
      optional: true,
      default: 100,
    },
    depth: {
      type: "integer",
      label: "Depth",
      description: "How many link-hops from the starting URL to follow.",
      optional: true,
      default: 2,
    },
    limitPerLevel: {
      type: "integer",
      label: "Limit Per Level",
      description: "Maximum URLs collected per depth level — controls breadth.",
      optional: true,
      default: 100,
    },
    includeSubdomains: {
      type: "boolean",
      label: "Include Subdomains",
      description: "Include URLs on subdomains of the starting host.",
      optional: true,
      default: false,
    },
    includeExternalLinks: {
      type: "boolean",
      label: "Include External Links",
      description: "Also collect (but do not follow) external links.",
      optional: true,
      default: false,
    },
    useBrowser: {
      type: "boolean",
      label: "Use Browser",
      description: "Render with a headless browser — best for JS-heavy sites (SPAs).",
      optional: true,
      default: false,
    },
    search: {
      type: "string",
      label: "Search Filter",
      description: "Optional keyword filter — only return URLs whose path/title matches.",
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
    const { jobId } = await this.anakin.submitMap({
      $,
      url: this.url,
      limit: this.limit,
      depth: this.depth,
      limitPerLevel: this.limitPerLevel,
      includeSubdomains: this.includeSubdomains,
      includeExternalLinks: this.includeExternalLinks,
      useBrowser: this.useBrowser,
      search: this.search,
    });

    const deadline = Date.now() + this.maxWaitTime * 1000;
    let job;
    do {
      job = await this.anakin.getMapJob({ $, jobId });
      if (job.status === "completed" || job.status === "failed") break;
      if (Date.now() >= deadline) {
        throw new Error(
          `Anakin map job ${jobId} did not complete within ${this.maxWaitTime}s (last status: ${job.status})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval * 1000));
    } while (true);

    if (job.status === "failed") {
      throw new Error(`Anakin map job ${jobId} failed: ${job.error ?? "unknown error"}`);
    }

    $.export("$summary", `Mapped ${this.url} — found ${job.totalLinks ?? 0} link(s)`);
    return job;
  },
};
