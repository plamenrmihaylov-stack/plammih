/**
 * Cloudflare Workers entry point for the plammih service.
 * Keeps the HTTP behavior of server.mjs without Node's http server API.
 */
export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return new Response("ok\n", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new Response("Hello World!\n", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
