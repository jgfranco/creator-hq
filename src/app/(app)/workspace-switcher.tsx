import Link from "next/link";
import { getCurrentMembership, listMyWorkspaces } from "@/lib/workspace";
import { formatEnum } from "@/lib/format";
import { switchWorkspace } from "./workspaces/actions";
import { Menu } from "./menu";

export async function WorkspaceSwitcher() {
  const [current, workspaces] = await Promise.all([
    getCurrentMembership(),
    listMyWorkspaces(),
  ]);

  return (
    <Menu
      summary={
        <>
          <span className="sr-only">Current workspace: </span>
          {current.workspace.name} <span aria-hidden="true">▾</span>
        </>
      }
    >
      <ul>
        {workspaces.map(({ workspace, role }) => {
          const isCurrent = workspace.id === current.workspaceId;
          return (
            <li key={workspace.id}>
              <form action={switchWorkspace.bind(null, workspace.id)}>
                <button
                  type="submit"
                  aria-current={isCurrent ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    isCurrent ? "font-medium" : ""
                  }`}
                >
                  <span className="truncate">{workspace.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {isCurrent ? "✓ " : ""}
                    {formatEnum(role)}
                  </span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <div className="mt-1 border-t pt-1">
        <Link
          href="/workspaces/new"
          className="block rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-950"
        >
          + New workspace
        </Link>
      </div>
    </Menu>
  );
}
