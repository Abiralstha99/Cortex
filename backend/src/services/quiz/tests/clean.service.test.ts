import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanText } from "../clean.service.js";

describe("cleanText", () => {
  it("collapses whitespace and normalizes newlines", () => {
    const out = cleanText("Hello\r\n\r\n\r\nworld   \t there");
    assert.equal(out, "Hello\n\nworld there");
  });

  it("strips page markers and lone page numbers", () => {
    const raw = "Intro\nPage 1 of 3\nBody\n42\nMore";
    const out = cleanText(raw);
    assert.ok(!out.includes("Page 1 of 3"));
    assert.ok(!/^42$/m.test(out));
    assert.match(out, /Intro/);
    assert.match(out, /Body/);
  });
});
