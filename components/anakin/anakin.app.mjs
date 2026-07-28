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
  },
};
