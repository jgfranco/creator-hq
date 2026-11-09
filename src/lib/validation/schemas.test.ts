import { describe, expect, it } from "vitest";
import { z } from "zod";
import { campaignSchema } from "./campaign";
import { invoiceSchema, paymentSchema } from "./invoice";
import { inviteSchema, workspaceSchema } from "./workspace";

const fieldErrors = (result: { success: boolean; error?: z.ZodError }) =>
  result.error ? Object.keys(z.flattenError(result.error).fieldErrors) : [];

describe("campaignSchema", () => {
  const valid = {
    title: " Summer launch ",
    brandId: "brand1",
    status: "LEAD",
    fee: "1,234.56",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
  };

  it("parses a valid campaign into stored values", () => {
    const result = campaignSchema("USD").parse(valid);
    expect(result).toMatchObject({ title: "Summer launch", feeCents: 123456 });
    expect(result.startDate?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("treats empty optional fields as not set", () => {
    const result = campaignSchema("USD").parse({
      ...valid,
      fee: "",
      startDate: "",
      endDate: "",
    });
    expect(result).toMatchObject({
      feeCents: null,
      startDate: null,
      endDate: null,
    });
  });

  it("reports every problem at once, including the date order", () => {
    const result = campaignSchema("USD").safeParse({
      ...valid,
      title: "",
      fee: "12.345",
      endDate: "2026-10-01",
    });
    expect(fieldErrors(result).sort()).toEqual(["endDate", "fee", "title"]);
  });
});

describe("invoiceSchema", () => {
  const line = { description: "Reel", quantity: "2", unitAmountCents: "500" };
  const valid = {
    issueDate: "2026-11-01",
    dueDate: "2026-12-01",
    notes: "",
    lineItems: [line],
  };

  it("parses line items", () => {
    const result = invoiceSchema("USD").parse(valid);
    expect(result.lineItems[0]).toEqual({
      description: "Reel",
      quantity: 2,
      unitAmountCents: 50000,
    });
  });

  it("rejects a due date before the issue date and bad lines", () => {
    const result = invoiceSchema("USD").safeParse({
      ...valid,
      dueDate: "2026-10-01",
      lineItems: [{ description: "", quantity: "0", unitAmountCents: "x" }],
    });
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining([
        "dueDate",
        "lineItems.0.description",
        "lineItems.0.quantity",
        "lineItems.0.unitAmountCents",
      ]),
    );
  });

  it("needs at least one line item", () => {
    expect(
      fieldErrors(invoiceSchema("USD").safeParse({ ...valid, lineItems: [] })),
    ).toEqual(["lineItems"]);
  });

  it("rejects totals beyond what the database can hold", () => {
    const big = {
      description: "Huge",
      quantity: "1000",
      unitAmountCents: "10000000",
    };
    expect(
      fieldErrors(
        invoiceSchema("USD").safeParse({ ...valid, lineItems: [big] }),
      ),
    ).toEqual(["lineItems"]);
  });
});

describe("paymentSchema", () => {
  it("needs a positive amount, a date and a known method", () => {
    const result = paymentSchema("USD").safeParse({
      amountCents: "0",
      paidOn: "",
      method: "BITCOIN",
      reference: "",
    });
    expect(fieldErrors(result).sort()).toEqual([
      "amountCents",
      "method",
      "paidOn",
    ]);
  });
});

describe("workspaceSchema", () => {
  it("normalizes the currency code and rejects unknown ones", () => {
    expect(
      workspaceSchema.parse({ name: " Studio ", currency: "eur" }),
    ).toEqual({
      name: "Studio",
      currency: "EUR",
    });
    expect(
      fieldErrors(
        workspaceSchema.safeParse({ name: "", currency: "ZZZ" }),
      ).sort(),
    ).toEqual(["currency", "name"]);
  });
});

describe("inviteSchema", () => {
  it("needs a valid email and a known role", () => {
    expect(
      inviteSchema.parse({ email: " bee@example.com ", role: "MANAGER" }),
    ).toEqual({
      email: "bee@example.com",
      role: "MANAGER",
    });
    expect(
      fieldErrors(
        inviteSchema.safeParse({ email: "nope", role: "BOSS" }),
      ).sort(),
    ).toEqual(["email", "role"]);
  });
});
