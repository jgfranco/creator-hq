"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ResendVerificationButton({
  email,
  callbackURL = "/dashboard",
}: {
  email: string;
  callbackURL?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function resend() {
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL,
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent")
    return <span role="status">Sent. Check your inbox.</span>;

  return (
    <>
      <button
        type="button"
        onClick={resend}
        disabled={state === "sending"}
        className="underline disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Resend the link"}
      </button>
      {state === "error" && (
        <span role="alert" className="ml-2">
          Couldn&apos;t send it. Try again in a minute.
        </span>
      )}
    </>
  );
}
