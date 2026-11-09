import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("allows same-site paths", () => {
    expect(safeNextPath("/invite/abc")).toBe("/invite/abc");
    expect(safeNextPath("/campaigns?status=LEAD")).toBe(
      "/campaigns?status=LEAD",
    );
  });

  it("falls back for anything that could leave the site", () => {
    for (const next of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "evil.com",
      "",
      null,
      undefined,
    ]) {
      expect(safeNextPath(next)).toBe("/dashboard");
    }
  });
});
