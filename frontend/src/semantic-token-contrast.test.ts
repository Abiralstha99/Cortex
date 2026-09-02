import { describe, expect, it } from "vitest";

import styles from "./index.css?raw";

const REQUIRED_CONTRAST = 4.5;

function tokenValue(token: string): string {
  const match = styles.match(
    new RegExp(`${token.replaceAll("-", "\\-")}\\s*:\\s*(#[0-9a-f]{6})`, "i"),
  );

  if (!match) {
    throw new Error(`Missing color token: ${token}`);
  }

  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );

  return (lighter + 0.05) / (darker + 0.05);
}

describe("semantic text foreground contrast", () => {
  it.each([
    ["--color-muted-foreground", "--color-background"],
    ["--color-text-muted-foreground", "--color-surface"],
    ["--color-text-muted-foreground", "--color-subtle"],
    ["--color-success-foreground", "--color-success-soft"],
    ["--color-danger-foreground", "--color-danger-soft"],
    ["--color-warning-foreground", "--color-surface"],
    ["--color-info-foreground", "--color-primary-soft"],
    ["--color-primary-foreground", "--color-danger-foreground"],
  ])("keeps %s at 4.5:1 or better on %s", (foregroundToken, backgroundToken) => {
    const ratio = contrastRatio(
      tokenValue(foregroundToken),
      tokenValue(backgroundToken),
    );

    expect(ratio).toBeGreaterThanOrEqual(REQUIRED_CONTRAST);
  });
});
