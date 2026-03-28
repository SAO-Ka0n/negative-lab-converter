import assert from "node:assert/strict";

const baseUrl = process.env.NLC_CHATGPT_APP_BASE_URL || "http://127.0.0.1:8788/";

async function expectOk(pathname, expectedContentType) {
  const response = await fetch(new URL(pathname, baseUrl), { method: "HEAD" });
  assert.equal(response.status, 200, `${pathname} should respond with 200`);
  if (expectedContentType) {
    assert.match(
      response.headers.get("content-type") || "",
      expectedContentType,
      `${pathname} content-type should match ${expectedContentType}`
    );
  }
}

await expectOk("/", /text\/plain/);
await expectOk("/healthz", /application\/json/);
await expectOk("/preview", /text\/html/);
await expectOk("/static/widget.js", /text\/javascript/);

console.log(`Smoke checks passed for ${baseUrl}`);
