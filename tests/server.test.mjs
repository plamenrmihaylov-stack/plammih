import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

let child;
let baseUrl;
let output = "";

async function unusedPort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

before(async () => {
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [fileURLToPath(new URL("../server.mjs", import.meta.url))], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited early (code ${child.exitCode}): ${output}`);
    try {
      const response = await fetch(baseUrl);
      await response.arrayBuffer();
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  throw new Error(`server did not become ready: ${output}`);
});

after(() => {
  if (child && child.exitCode === null) child.kill("SIGTERM");
});

test("health endpoint remains available with defensive headers", async () => {
  const response = await fetch(`${baseUrl}/healthz`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "ok\n");
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("server"), null);
});

test("homepage serves the professional identity and structured data", async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(body, /<title>Plamen R Mihaylov/);
  assert.match(body, /application\/ld\+json/);
  const jsonLd = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(jsonLd, "JSON-LD script must exist");
  const graph = JSON.parse(jsonLd);
  assert.equal(graph["@context"], "https://schema.org");
  assert.ok(graph["@graph"].some(item => item["@type"] === "Person" && item["@id"] === "https://dunesub.de/#plamen-r-mihaylov"));
  assert.ok(graph["@graph"].some(item => item["@type"] === "Organization" && item["@id"] === "https://dunesub.de/#organization"));
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("robots and sitemap are served from the canonical host", async () => {
  const [robots, sitemap] = await Promise.all([
    fetch(`${baseUrl}/robots.txt`),
    fetch(`${baseUrl}/sitemap.xml`),
  ]);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/dunesub\.de\/sitemap\.xml/);
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /https:\/\/dunesub\.de\//);
});

test("unknown paths return 404 and unsupported methods return 405", async () => {
  const missing = await fetch(`${baseUrl}/missing`);
  assert.equal(missing.status, 404);
  const method = await fetch(baseUrl, { method: "POST" });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "GET, HEAD");
});

test("static assets are present in the container build context", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /Plamen R Mihaylov/);
});
