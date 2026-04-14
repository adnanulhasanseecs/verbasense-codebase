"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Gavel, Mars, Scale, Shield, User, Venus, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { changeMyPassword, getAuthUser, getMe, updateMyProfile } from "@/lib/api";

const AVATAR_PRESETS: Array<{ id: string; name: string; icon: LucideIcon }> = [
  { id: "shield", name: "Shield", icon: Shield },
  { id: "gavel", name: "Gavel", icon: Gavel },
  { id: "eye", name: "Eye", icon: Eye },
  { id: "scales", name: "Scales", icon: Scale },
  { id: "male", name: "Male", icon: Mars },
  { id: "female", name: "Female", icon: Venus },
  { id: "user", name: "User", icon: User },
];

function makeAvatarDataUrl(initial: string, bg: string, fg: string): string {
  const safe = initial.trim().slice(0, 1).toUpperCase() || "U";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='124' fill='${fg}'>${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function UserSettingsPage() {
  const authUser = getAuthUser();
  const [name, setName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewSrc = useMemo(() => {
    if (profileImageUrl) return profileImageUrl;
    return makeAvatarDataUrl(name || "U", "#1E293B", "#E2E8F0");
  }, [name, profileImageUrl]);
  const selectedAvatar = useMemo(() => {
    if (!profileImageUrl.startsWith("avatar:")) return null;
    const id = profileImageUrl.replace("avatar:", "");
    return AVATAR_PRESETS.find((x) => x.id === id) ?? null;
  }, [profileImageUrl]);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const timer = window.setTimeout(() => {
      getMe()
        .then((u) => {
          setName(u.name);
          setProfileImageUrl(u.profile_image_url ?? "");
        })
        .catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">My settings</h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">Update your profile image and manage your password securely.</p>
          </div>
          <div className="flex gap-2">
            {authUser?.role === "admin" ? (
              <>
                <Link href="/admin/users" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-[#E5E7EB]">Users</Link>
                <Link href="/admin/models" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-[#E5E7EB]">Model connections</Link>
              </>
            ) : null}
            <Link href="/settings" className="rounded-xl bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white">My settings</Link>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-[#121826] p-4">
          <h2 className="text-sm font-semibold text-white">Profile</h2>
          <form
            className="mt-3 grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setMessage(null);
              try {
                await updateMyProfile({ name, profile_image_url: profileImageUrl || undefined });
                setMessage("Profile updated");
              } catch (ex) {
                setError(ex instanceof Error ? ex.message : "Profile update failed");
              }
            }}
          >
            <div className="flex items-center gap-4">
              {selectedAvatar ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-[#0B0F19]">
                  <selectedAvatar.icon className="h-7 w-7 text-[#93C5FD]" />
                </div>
              ) : (
                <Image
                  src={previewSrc}
                  alt="Profile preview"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full border border-white/15 object-cover"
                  unoptimized
                />
              )}
              <div className="text-xs text-[#9CA3AF]">Upload an image or choose an avatar preset.</div>
            </div>
            <input
              className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
            />
            <label className="text-xs text-[#9CA3AF]">
              Upload profile image
              <input
                className="mt-1 block w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    setError("Please upload an image smaller than 2MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      setProfileImageUrl(reader.result);
                    }
                  };
                  reader.readAsDataURL(f);
                }}
              />
            </label>
            <div>
              <p className="mb-2 text-xs text-[#9CA3AF]">Or choose an avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const active = profileImageUrl === `avatar:${preset.id}`;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={
                        active
                          ? "inline-flex items-center gap-1 rounded-xl border border-[#3B82F6]/50 bg-[#1E293B] px-2 py-2 text-xs text-white"
                          : "inline-flex items-center gap-1 rounded-xl border border-white/10 px-2 py-2 text-xs text-white hover:bg-white/5"
                      }
                      onClick={() => setProfileImageUrl(`avatar:${preset.id}`)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="w-fit rounded-xl bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white" type="submit">
              Save profile
            </button>
          </form>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-[#121826] p-4">
          <h2 className="text-sm font-semibold text-white">Change password</h2>
          <form
            className="mt-3 grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setMessage(null);
              try {
                await changeMyPassword(currentPassword, newPassword);
                setCurrentPassword("");
                setNewPassword("");
                setMessage("Password updated");
              } catch (ex) {
                setError(ex instanceof Error ? ex.message : "Password change failed");
              }
            }}
          >
            <input
              className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
            />
            <input
              className="rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
            />
            <button className="w-fit rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white" type="submit">
              Update password
            </button>
          </form>
        </section>

        {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
      </main>
    </AppShell>
  );
}
