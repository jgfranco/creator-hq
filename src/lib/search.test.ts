import { describe, expect, it } from "vitest";
import {
  invoiceNumberFromSearch,
  likeEscape,
  listHref,
  parseSearch,
} from "./search";

describe("parseSearch", () => {
  it("trims, caps at 100 characters, and drops empty searches", () => {
    expect(parseSearch("  glow ")).toBe("glow");
    expect(parseSearch("   ")).toBeUndefined();
    expect(parseSearch(undefined)).toBeUndefined();
    expect(parseSearch(["first", "second"])).toBe("first");
    expect(parseSearch("x".repeat(500))).toHaveLength(100);
  });
});

describe("invoiceNumberFromSearch", () => {
  it("reads invoice numbers in the forms people type", () => {
    for (const q of ["INV-0042", "inv 42", "inv42", "#42", "42", "0042"]) {
      expect(invoiceNumberFromSearch(q)).toBe(42);
    }
  });

  it("ignores text that isn't a number", () => {
    for (const q of ["glow", "INV-", "42abc", "1234567890"]) {
      expect(invoiceNumberFromSearch(q)).toBeUndefined();
    }
  });
});

describe("listHref", () => {
  it("leaves out empty params and encodes the rest", () => {
    expect(listHref("/campaigns", { status: undefined, q: undefined })).toBe(
      "/campaigns",
    );
    expect(listHref("/campaigns", { status: "LEAD", q: "a&b" })).toBe(
      "/campaigns?status=LEAD&q=a%26b",
    );
  });
});

describe("likeEscape", () => {
  it("escapes LIKE wildcards and the escape character", () => {
    expect(likeEscape("100%")).toBe("100\\%");
    expect(likeEscape("a_b")).toBe("a\\_b");
    expect(likeEscape("back\\slash")).toBe("back\\\\slash");
    expect(likeEscape("plain")).toBe("plain");
  });
});
