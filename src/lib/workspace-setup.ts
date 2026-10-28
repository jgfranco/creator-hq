import { prisma } from "./db";
import { uniqueSlug } from "./slug";

export function createPersonalWorkspace(user: { id: string; name: string }) {
  return prisma.membership.create({
    data: {
      role: "OWNER",
      user: { connect: { id: user.id } },
      workspace: {
        create: {
          name: `${user.name}'s Workspace`,
          slug: uniqueSlug(user.name),
        },
      },
    },
    include: { workspace: true },
  });
}