import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { sendEmail } from "./email";
import { ensurePersonalWorkspace } from "./workspace-setup";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Creator HQ password",
        text: `Hi ${user.name},\n\nSomeone asked to reset the password for your Creator HQ account. To choose a new one, open this link (it expires in 1 hour):\n\n${url}\n\nIf it wasn't you, ignore this email; your password won't change.`,
      });
    },
    // Signing in elsewhere with the old password stops working after a reset
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email for Creator HQ",
        text: `Hi ${user.name},\n\nConfirm this is your email address by opening this link (it expires in 1 hour):\n\n${url}\n\nIf you didn't create a Creator HQ account, ignore this email.`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await ensurePersonalWorkspace(user);
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
