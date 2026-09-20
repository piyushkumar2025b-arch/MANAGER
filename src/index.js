import { onRequest } from "../functions/api/[[route]].js";

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Handle API endpoints
      if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
        return await onRequest({ request, env, ctx });
      }

      // Static assets handling
      if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
        const res = await env.ASSETS.fetch(request);
        // SPA Fallback: If asset not found and request is for an HTML page or navigation route
        if (res.status === 404) {
          const accept = request.headers.get("accept") || "";
          const isHtmlRequest = accept.includes("text/html") || !url.pathname.includes(".");
          if (isHtmlRequest) {
            const indexReq = new Request(new URL("/", request.url), request);
            return await env.ASSETS.fetch(indexReq);
          }
        }
        return res;
      }

      return new Response("Vault Asset Service Ready", { status: 200, headers: { "Content-Type": "text/plain" } });
    } catch (err) {
      console.error("Worker fetch error:", err);
      return new Response(JSON.stringify({ error: err?.message || "Internal Worker Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};
