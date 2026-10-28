import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { uniqueSlug } from "./slug";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await prisma.workspace.create({
              data: {
                name: `${user.name}'s Workspace`,
                slug: uniqueSlug(user.name),
                memberships: {
                  create: { userId: user.id, role: "OWNER" },
                },
              },
            });
          } catch (error) {
            console.error(`[auth] Failed to create workspace for user ${user.id}:`, error);
          }
        },
      },
    },
  },
});