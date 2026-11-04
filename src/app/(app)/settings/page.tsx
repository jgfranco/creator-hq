import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/workspace";
import { isCurrencyLocked } from "@/lib/workspace-setup";
import { currencyOptions } from "@/lib/currencies";
import { WorkspaceForm } from "../workspace-form";
import { SettingsTabs } from "./settings-tabs";
import { updateWorkspace } from "./actions";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <SettingsTabs active="general" />
      <Suspense
        fallback={<p className="text-sm text-gray-500">Loading settings…</p>}
      >
        <GeneralSettings />
      </Suspense>
    </div>
  );
}

async function GeneralSettings() {
  const membership = await getCurrentMembership();
  const { workspace } = membership;
  const isOwner = membership.role === "OWNER";
  const locked = await isCurrencyLocked(prisma, workspace.id);

  return (
    <>
      {!isOwner && (
        <p className="mb-5 text-sm text-gray-500">
          Only owners can change these settings.
        </p>
      )}
      <WorkspaceForm
        action={updateWorkspace}
        defaultValues={{ name: workspace.name, currency: workspace.currency }}
        currencyOptions={currencyOptions()}
        currencyLockedReason={
          locked
            ? "Locked because campaigns have fees or invoices exist. Amounts are stored in this currency, so changing it would misprice them."
            : undefined
        }
        readOnly={!isOwner}
        submitLabel="Save settings"
      />
    </>
  );
}
