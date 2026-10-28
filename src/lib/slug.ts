import { randomBytes } from "node:crypto";

export function slugify(text: string): string {
  return text
    .normalize("NFKD")                 // "José" → "Jose" + accent mark
    .replace(/[\u0300-\u036f]/g, "")   // remove the accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")       // spaces and symbols → "-"
    .replace(/^-+|-+$/g, "")           // trim leading/trailing "-"
    .slice(0, 40);
}

export function uniqueSlug(text: string): string {
  const base = slugify(text) || "workspace";
  const suffix = randomBytes(3).toString("hex"); // 6 random characters, e.g. "a3f9c1"
  return `${base}-${suffix}`;
}