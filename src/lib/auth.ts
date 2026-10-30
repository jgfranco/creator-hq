import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { createPersonalWorkspace } from "./workspace-setup";

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
            await createPersonalWorkspace(user);
          } catch (error) {
            console.error(
              `[auth] Failed to create workspace for user ${user.id}:`,
              error,
            );
          }
        },
      },
    },
  },
});
