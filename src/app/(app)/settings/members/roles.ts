import type { Role } from "@/generated/prisma/enums";

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Everything, including settings and members",
  MANAGER: "Edit brands, campaigns, deliverables and invoices",
  VIEWER: "Read-only",
};
