// Not marked server-only: prisma/seed.ts imports auth.ts, which imports this.

type Email = { to: string; subject: string; text: string };

// Sends through Resend when RESEND_API_KEY is set; otherwise prints the email
// (and its links) to the server log so the flows work in development.
export async function sendEmail({ to, subject, text }: Email) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[email] RESEND_API_KEY is not set; printing instead of sending.",
      );
    }
    console.info(
      `\n[email] To: ${to}\n[email] Subject: ${subject}\n\n${text}\n`,
    );
    return;
  }

  // Resend's HTTP API, so no SDK dependency is needed
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Creator HQ <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `[email] Resend returned ${response.status}: ${await response.text()}`,
    );
  }
}
