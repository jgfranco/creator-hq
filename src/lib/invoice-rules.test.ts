import { describe, expect, it } from "vitest";
import {
  advanceCampaignStatus,
  campaignFullyPaid,
  formatInvoiceNumber,
  isOverdue,
  lineItemsTotal,
  statusForPayments,
} from "./invoice-rules";
import { parseDateInput } from "./dates";

describe("formatInvoiceNumber", () => {
  it("pads numbers and labels drafts", () => {
    expect(formatInvoiceNumber(7)).toBe("INV-0007");
    expect(formatInvoiceNumber(12345)).toBe("INV-12345");
    expect(formatInvoiceNumber(null)).toBe("Draft");
  });
});

describe("lineItemsTotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(
      lineItemsTotal([
        { quantity: 2, unitAmountCents: 100000 },
        { quantity: 1, unitAmountCents: 50050 },
      ]),
    ).toBe(250050);
    expect(lineItemsTotal([])).toBe(0);
  });
});

describe("statusForPayments", () => {
  it("follows how much has been paid", () => {
    expect(statusForPayments(1000, 0)).toBe("SENT");
    expect(statusForPayments(1000, 1)).toBe("PARTIALLY_PAID");
    expect(statusForPayments(1000, 1000)).toBe("PAID");
  });
});

describe("isOverdue", () => {
  const today = parseDateInput("2026-11-05");
  it("only counts unpaid invoices past their due date", () => {
    const due = (d: string) => parseDateInput(d);
    expect(
      isOverdue({ status: "SENT", dueDate: due("2026-11-04") }, today),
    ).toBe(true);
    expect(
      isOverdue(
        { status: "PARTIALLY_PAID", dueDate: due("2026-11-04") },
        today,
      ),
    ).toBe(true);
    expect(
      isOverdue({ status: "SENT", dueDate: due("2026-11-05") }, today),
    ).toBe(false);
    expect(
      isOverdue({ status: "PAID", dueDate: due("2026-01-01") }, today),
    ).toBe(false);
    expect(
      isOverdue({ status: "DRAFT", dueDate: due("2026-01-01") }, today),
    ).toBe(false);
  });
});

describe("advanceCampaignStatus", () => {
  it("only ever moves forward, and leaves cancelled campaigns alone", () => {
    expect(advanceCampaignStatus("CONTRACTED", "INVOICED")).toBe("INVOICED");
    expect(advanceCampaignStatus("INVOICED", "PAID")).toBe("PAID");
    expect(advanceCampaignStatus("PAID", "INVOICED")).toBe("PAID");
    expect(advanceCampaignStatus("CANCELLED", "PAID")).toBe("CANCELLED");
  });
});

describe("campaignFullyPaid", () => {
  it("needs at least one sent invoice, all of them paid", () => {
    expect(campaignFullyPaid([])).toBe(false);
    expect(campaignFullyPaid([{ status: "DRAFT" }])).toBe(false);
    expect(
      campaignFullyPaid([
        { status: "PAID" },
        { status: "VOID" },
        { status: "DRAFT" },
      ]),
    ).toBe(true);
    expect(campaignFullyPaid([{ status: "PAID" }, { status: "SENT" }])).toBe(
      false,
    );
  });
});
