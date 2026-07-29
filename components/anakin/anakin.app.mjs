import { axios } from "@pipedream/platform";

export default {
  type: "app",
  app: "anakin",
  propDefinitions: {},
  methods: {
    _baseUrl() {
      return "https://api.anakin.io/v1";
    },
    _headers() {
      return {
        "X-API-Key": `${this.$auth.api_key}`,
        "Content-Type": "application/json",
      };
    },
    async _request({ $ = this, path, ...opts }) {
      return axios($, {
        url: `${this._baseUrl()}${path}`,
        headers: this._headers(),
        ...opts,
      });
    },
    async submitScrape({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/url-scraper",
        data: body,
      });
    },
    async getScrapeJob({ $, jobId }) {
      return this._request({
        $,
        method: "GET",
        path: `/url-scraper/${jobId}`,
      });
    },
    async search({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/search",
        data: body,
      });
    },
    // ── Map ────────────────────────────────────────────────────────────
    async submitMap({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/map",
        data: body,
      });
    },
    async getMapJob({ $, jobId }) {
      return this._request({
        $,
        method: "GET",
        path: `/map/${jobId}`,
      });
    },
    // ── Crawl ──────────────────────────────────────────────────────────
    async submitCrawl({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/crawl",
        data: body,
      });
    },
    async getCrawlJob({ $, jobId }) {
      return this._request({
        $,
        method: "GET",
        path: `/crawl/${jobId}`,
      });
    },
    // ── Agentic Search ────────────────────────────────────────────────
    async submitAgenticSearch({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/agentic-search",
        data: body,
      });
    },
    async getAgenticSearchJob({ $, jobId }) {
      return this._request({
        $,
        method: "GET",
        path: `/agentic-search/${jobId}`,
      });
    },
    // ── Wire: discovery ───────────────────────────────────────────────
    async wireDiscover({ $, q, limit }) {
      return this._request({
        $,
        method: "GET",
        path: "/wire/resolve",
        params: { q, limit },
      });
    },
    async wireCatalog({ $, slug }) {
      return this._request({
        $,
        method: "GET",
        path: slug ? `/wire/catalog/${slug}` : "/wire/catalog",
      });
    },
    // ── Wire: execution ───────────────────────────────────────────────
    async submitWireTask({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/wire/task",
        data: body,
      });
    },
    async getWireJob({ $, jobId }) {
      return this._request({
        $,
        method: "GET",
        path: `/wire/jobs/${jobId}`,
      });
    },
    // ── Wire: identities & credentials ───────────────────────────────
    async wireIdentities({ $, catalogId }) {
      return this._request({
        $,
        method: "GET",
        path: "/wire/identities",
        params: { catalog_id: catalogId },
      });
    },
    async wireLogin({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/wire/login",
        data: body,
      });
    },
    // ── Wire: build ───────────────────────────────────────────────────
    async wireBuild({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/wire/build-request",
        data: body,
      });
    },
    // ── Website Monitoring ────────────────────────────────────────────
    async createMonitor({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/monitors",
        data: body,
      });
    },
    async listMonitors({ $ }) {
      return this._request({
        $,
        method: "GET",
        path: "/monitors",
      });
    },
    async getMonitor({ $, id }) {
      return this._request({
        $,
        method: "GET",
        path: `/monitors/${id}`,
      });
    },
    async getMonitorChanges({ $, id }) {
      return this._request({
        $,
        method: "GET",
        path: `/monitors/${id}/changes`,
      });
    },
    async controlMonitor({ $, id, action }) {
      if (action === "delete") {
        return this._request({
          $,
          method: "DELETE",
          path: `/monitors/${id}`,
        });
      }
      const endpoint = action === "run_now" ? "run" : action;
      return this._request({
        $,
        method: "POST",
        path: `/monitors/${id}/${endpoint}`,
      });
    },
    // ── AI Visibility ─────────────────────────────────────────────────
    async submitAiVisibilitySearch({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/ai-visibility/search",
        data: body,
      });
    },
    async getAiVisibilitySearch({ $, searchId }) {
      return this._request({
        $,
        method: "GET",
        path: `/ai-visibility/search/${searchId}`,
      });
    },
    async aiVisibilitySources({ $ }) {
      return this._request({
        $,
        method: "GET",
        path: "/ai-visibility/sources",
      });
    },
    // ── Browser sessions ──────────────────────────────────────────────
    async listSessions({ $, domain }) {
      return this._request({
        $,
        method: "GET",
        path: "/sessions",
        params: { domain },
      });
    },
    async deleteSession({ $, id }) {
      return this._request({
        $,
        method: "DELETE",
        path: `/sessions/${id}`,
      });
    },
    // ── AI browser automation ────────────────────────────────────────
    async submitBrowserTask({ $, ...body }) {
      return this._request({
        $,
        method: "POST",
        path: "/ai/evaluate",
        data: body,
      });
    },
    async getBrowserTaskJob({ $, jobId }) {
      return this._request({
        $,
        method: "GET",
        path: `/ai/jobs/${jobId}`,
      });
    },
  },
};
