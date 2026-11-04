import { currencyOptions } from "@/lib/currencies";
import { WorkspaceForm } from "../../workspace-form";
import { createWorkspace } from "../actions";

export default function NewWorkspacePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">New workspace</h1>
      <p className="mb-6 text-sm text-gray-500">
        A separate set of brands, campaigns and invoices. You&apos;ll be its
        owner.
      </p>
      <WorkspaceForm
        action={createWorkspace}
        defaultValues={{ name: "", currency: "USD" }}
        currencyOptions={currencyOptions()}
        submitLabel="Create workspace"
        cancelHref="/dashboard"
      />
    </div>
  );
}
