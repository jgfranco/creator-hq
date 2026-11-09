import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatMoneyTotals,
  parseMoney,
  toMoneyInput,
} from "./money";

describe("parseMoney", () => {
  it("parses whole and decimal amounts into minor units", () => {
    expect(parseMoney("1500", "USD")).toBe(150000);
    expect(parseMoney("1,500.5", "USD")).toBe(150050);
    expect(parseMoney(" 0.05 ", "USD")).toBe(5);
  });

  it("avoids float rounding errors", () => {
    expect(parseMoney("19.99", "USD")).toBe(1999);
    expect(parseMoney("1.10", "USD")).toBe(110);
  });

  it("follows each currency's decimals", () => {
    expect(parseMoney("1500", "JPY")).toBe(1500);
    expect(parseMoney("1500.5", "JPY")).toBeNull();
    expect(parseMoney("1.234", "KWD")).toBe(1234);
  });

  it("rejects anything that isn't a plain positive amount", () => {
    for (const input of ["", "-5", "12.345", "1e3", "abc", "$10", "1.2.3"]) {
      expect(parseMoney(input, "USD")).toBeNull();
    }
  });
});

describe("formatMoney", () => {
  it("formats minor units in the currency", () => {
    expect(formatMoney(150050, "USD")).toBe("$1,500.50");
    expect(formatMoney(1500, "JPY")).toBe("¥1,500");
    expect(formatMoney(null, "USD")).toBe("—");
  });
});

describe("toMoneyInput", () => {
  it("is the inverse of parseMoney", () => {
    expect(toMoneyInput(150050, "USD")).toBe("1500.50");
    expect(parseMoney(toMoneyInput(1999, "USD"), "USD")).toBe(1999);
    expect(toMoneyInput(1500, "JPY")).toBe("1500");
    expect(toMoneyInput(null, "USD")).toBe("");
  });
});

describe("formatMoneyTotals", () => {
  it("adds amounts per currency without mixing currencies", () => {
    expect(
      formatMoneyTotals([
        { cents: 1000, currency: "USD" },
        { cents: 30000, currency: "EUR" },
        { cents: 2000, currency: "USD" },
      ]),
    ).toBe("$30.00 + €300.00");
  });

  it("shows zero in the fallback currency when empty", () => {
    expect(formatMoneyTotals([], "GBP")).toBe("£0.00");
  });
});
