import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { resolveModelGenerationConfig } from "../model-config.service.js";

describe("model generation config", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalGeminiModel = process.env.GEMINI_MODEL;
  const originalMaxOutputTokens = process.env.GEMINI_MAX_OUTPUT_TOKENS;
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalGeminiModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalGeminiModel;
    }

    if (originalMaxOutputTokens === undefined) {
      delete process.env.GEMINI_MAX_OUTPUT_TOKENS;
    } else {
      process.env.GEMINI_MAX_OUTPUT_TOKENS = originalMaxOutputTokens;
    }

    if (originalGeminiApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiApiKey;
    }
  });

  it("requires GEMINI_MODEL in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.GEMINI_MODEL;
    process.env.GEMINI_API_KEY = "test-api-key";

    assert.throws(() => resolveModelGenerationConfig(), /GEMINI_MODEL/i);
  });

  it("requires GEMINI_API_KEY in production", () => {
    process.env.NODE_ENV = "production";
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    delete process.env.GEMINI_API_KEY;

    assert.throws(() => resolveModelGenerationConfig(), /GEMINI_API_KEY/i);
  });

  it("uses the local fallback model outside production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.GEMINI_MODEL;

    const config = resolveModelGenerationConfig();

    assert.equal(config.model, "gemini-3.5-flash");
  });

  it("derives the usable output budget from the configured output cap", () => {
    process.env.NODE_ENV = "development";
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    process.env.GEMINI_MAX_OUTPUT_TOKENS = "8000";

    const config = resolveModelGenerationConfig();

    assert.equal(config.maxOutputTokens, 8000);

    assert.ok(config.usableOutputBudget < config.maxOutputTokens);
    assert.ok(config.usableOutputBudget > 0);
  });

  it("rejects an invalid configured output cap", () => {
    process.env.NODE_ENV = "development";
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    process.env.GEMINI_MAX_OUTPUT_TOKENS = "not-a-number";

    assert.throws(
      () => resolveModelGenerationConfig(),
      /output.*cap|GEMINI_MAX_OUTPUT_TOKENS/i,
    );
  });

  it("rejects a fractional configured output cap", () => {
    process.env.NODE_ENV = "production";
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_MAX_OUTPUT_TOKENS = "0.5";

    assert.throws(
      () => resolveModelGenerationConfig(),
      /output.*cap|GEMINI_MAX_OUTPUT_TOKENS/i,
    );
  });
});
