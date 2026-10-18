import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.mjs";

test("health endpoint returns 200 and ok body", async () => {
  const response = await worker.fetch(new Request("https://example.test/healthz"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await response.text(), "ok\n");
});

test("root endpoint preserves the service greeting", async () => {
  const response = await worker.fetch(new Request("https://example.test/"));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "Hello World!\n");
});
