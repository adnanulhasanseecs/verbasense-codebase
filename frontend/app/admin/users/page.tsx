"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  createAdminUser,
  createInvite,
  getAuthUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUser,
} from "@/lib/api";

const ROLES = ["admin", "judge", "clerk", "viewer"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refresh = async () => {
    try {
      setSessionExpired(false);
      setUsers(await listAdminUsers());
    } catch (e) {
      if (e instanceof Error && e.message.includes("(401)")) {
        setSessionExpired(true);
        setErr("Session expired. Please sign in again.");
        return;
      }
      setErr(e instanceof Error ? e.message : "Failed to load users");
    }
  };

  useEffect(() => {
    const me = getAuthUser();
    if (!me || me.role !== "admin") {
      window.location.href = "/login";
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => {});
  }, []);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Account management</h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">Invite users or create secured user accounts with passwords.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users" className="rounded-xl bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white">
              Users
            </Link>
            <Link href="/admin/models" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-[#E5E7EB]">
              Model connections
            </Link>
            <Link href="/settings" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-[#E5E7EB]">
              My settings
            </Link>
          </div>
        </div>
        {sessionExpired ? (
          <div className="mt-3 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
            Session expired. Sign in again to load users.
          </div>
        ) : null}

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
            <h2 className="text-sm font-semibold text-white">Invite user</h2>
            <form
              className="mt-3 flex flex-wrap items-end gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setMsg(null);
                setErr(null);
                try {
                  const out = await createInvite(inviteEmail, inviteRole);
                  setMsg(`Invite code: ${out.invite_code}`);
                  setInviteEmail("");
                } catch (ex) {
                  setErr(ex instanceof Error ? ex.message : "Invite failed");
                }
              }}
            >
              <input
                type="email"
                placeholder="Email"
                className="w-60 rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select
                className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button className="rounded-xl bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white" type="submit">
                Send invite
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
            <h2 className="text-sm font-semibold text-white">Create user (admin only)</h2>
            <form
              className="mt-3 grid gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setMsg(null);
                setErr(null);
                try {
                  await createAdminUser({ email: newEmail, name: newName, password: newPassword, role: newRole });
                  setMsg("User account created successfully");
                  setNewEmail("");
                  setNewName("");
                  setNewPassword("");
                  await refresh();
                } catch (ex) {
                  setErr(ex instanceof Error ? ex.message : "Create user failed");
                }
              }}
            >
              <input className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <input className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              <input className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" type="password" placeholder="Temporary password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <select className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white" type="submit">Create secured user</button>
            </form>
          </div>
        </section>

        {msg ? <p className="mt-3 text-xs text-emerald-300">{msg}</p> : null}
        {err ? <p className="mt-3 text-xs text-red-300">{err}</p> : null}

        <section className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#121826] p-4">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[#9CA3AF]">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-t border-white/5">
                  <td className="py-2 text-white">{u.name}</td>
                  <td className="py-2 text-[#C7D2FE]">{u.email}</td>
                  <td className="py-2">
                    <select className="rounded-lg border border-white/10 bg-[#0B0F19] px-2 py-1 text-xs text-white" value={u.role} onChange={async (e) => {
                      const next = e.target.value;
                      if (!window.confirm(`Change ${u.email} role to ${next}?`)) return;
                      try { await updateAdminUserRole(u.user_id, next); await refresh(); } catch (ex) { setErr(ex instanceof Error ? ex.message : "Role update failed"); }
                    }}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-2 text-white">{u.active ? "Active" : "Disabled"}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10" onClick={async () => {
                        const next = !u.active;
                        if (!window.confirm(`${next ? "Activate" : "Deactivate"} ${u.email}?`)) return;
                        try { await updateAdminUserStatus(u.user_id, next); await refresh(); } catch (ex) { setErr(ex instanceof Error ? ex.message : "Status update failed"); }
                      }}>{u.active ? "Deactivate" : "Activate"}</button>
                      <button className="rounded-lg border border-amber-400/40 px-2 py-1 text-xs text-amber-200 hover:bg-amber-500/10" onClick={async () => {
                        const np = window.prompt(`New password for ${u.email}`);
                        if (!np) return;
                        try { await resetAdminUserPassword(u.user_id, np); setMsg(`Password reset for ${u.email}`); } catch (ex) { setErr(ex instanceof Error ? ex.message : "Password reset failed"); }
                      }}>Reset password</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </AppShell>
  );
}
