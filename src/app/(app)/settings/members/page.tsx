import { Suspense } from "react";
import { getCurrentMembership } from "@/lib/workspace";
import { listMembers, listPendingInvitations } from "@/lib/members";
import { formatDate } from "@/lib/dates";
import { formatEnum } from "@/lib/format";
import { ActionButton } from "../../action-button";
import { SettingsTabs } from "../settings-tabs";
import {
  changeRole,
  inviteMember,
  leaveWorkspace,
  removeMember,
  revokeInvitation,
} from "../actions";
import { InviteForm } from "./invite-form";
import { RoleForm } from "./role-form";
import { ROLE_DESCRIPTIONS } from "./roles";

export default function MembersPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <SettingsTabs active="members" />
      <Suspense
        fallback={<p className="text-sm text-gray-500">Loading members…</p>}
      >
        <Members />
      </Suspense>
    </div>
  );
}

async function Members() {
  const membership = await getCurrentMembership();
  const isOwner = membership.role === "OWNER";
  const [members, invitations] = await Promise.all([
    listMembers(),
    isOwner ? listPendingInvitations() : [],
  ]);
  const now = new Date();

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Members</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Joined</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isMe = member.id === membership.id;
              return (
                <tr
                  key={member.id}
                  className="border-b align-top last:border-0"
                >
                  <td className="py-2">
                    {member.user.name}
                    {isMe && <span className="text-gray-500"> (you)</span>}
                    <span className="block text-xs text-gray-500">
                      {member.user.email}
                    </span>
                  </td>
                  <td className="py-2">{formatDate(member.createdAt)}</td>
                  <td className="py-2">
                    {isOwner ? (
                      <RoleForm
                        action={changeRole.bind(null, member.id)}
                        role={member.role}
                        label={`Role for ${member.user.name}`}
                      />
                    ) : (
                      formatEnum(member.role)
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {isMe ? (
                      <ActionButton
                        action={leaveWorkspace}
                        label="Leave workspace"
                        pendingLabel="Leaving…"
                        confirmMessage={`Leave ${membership.workspace.name}? You'll need a new invite to come back.`}
                        variant="danger"
                        size="sm"
                      />
                    ) : (
                      isOwner && (
                        <ActionButton
                          action={removeMember.bind(null, member.id)}
                          label="Remove"
                          pendingLabel="Removing…"
                          variant="danger"
                          confirmMessage={`Remove ${member.user.name} from this workspace?`}
                          size="sm"
                        />
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <ul className="mt-3 space-y-0.5 text-xs text-gray-500">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <li key={role}>
              <span className="font-medium">{formatEnum(role)}:</span>{" "}
              {description}
            </li>
          ))}
        </ul>
      </section>

      {isOwner ? (
        <>
          <section>
            <h2 className="mb-1 text-lg font-semibold">Invite someone</h2>
            <p className="mb-4 text-sm text-gray-500">
              You&apos;ll get a link to send them. They sign in (or sign up)
              with this email to join.
            </p>
            <InviteForm action={inviteMember} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Pending invites</h2>
            {invitations.length === 0 ? (
              <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">
                No pending invites.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Role</th>
                    <th className="py-2 font-medium">Expires</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invite) => (
                    <tr key={invite.id} className="border-b last:border-0">
                      <td className="py-2">
                        {invite.email}
                        <span className="block text-xs text-gray-500">
                          Invited by {invite.invitedBy.name}
                        </span>
                      </td>
                      <td className="py-2">{formatEnum(invite.role)}</td>
                      <td className="py-2">
                        {invite.expiresAt < now ? (
                          <span className="text-red-700">Expired</span>
                        ) : (
                          formatDate(invite.expiresAt)
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <ActionButton
                          action={revokeInvitation.bind(null, invite.id)}
                          label="Revoke"
                          pendingLabel="Revoking…"
                          variant="danger"
                          confirmMessage={`Revoke the invite for ${invite.email}? The link will stop working.`}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          Only owners can invite people and change roles.
        </p>
      )}
    </div>
  );
}
