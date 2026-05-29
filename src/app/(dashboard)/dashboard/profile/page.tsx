"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api-client";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";

const HEAR_OPTIONS = [
  "Google Search",
  "Twitter/X",
  "Instagram",
  "TikTok",
  "Facebook",
  "Friend/Referral",
  "Blog/Article",
  "Other",
];

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [hearSelect, setHearSelect] = useState("");
  const [hearOther, setHearOther] = useState("");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.data;
        if (!p) return;
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setPhone(p.phone ?? "");
        setUsername(p.username ?? null);
        if (p.hearAboutUs) {
          if (HEAR_OPTIONS.includes(p.hearAboutUs)) {
            setHearSelect(p.hearAboutUs);
          } else {
            setHearSelect("Other");
            setHearOther(p.hearAboutUs);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Name required", "Please enter both your first and last name.");
      return;
    }
    const hearAboutUs = hearSelect === "Other" ? hearOther.trim() : hearSelect;

    setSaving(true);
    try {
      const res = await authFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          hearAboutUs: hearAboutUs || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Couldn't save", data.error?.message || "Please try again.");
        return;
      }

      setUsername(data.data?.username ?? username);

      // Sync the Firebase display name so the header avatar shows the initial.
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (auth.currentUser && fullName) {
        try {
          await updateProfile(auth.currentUser, { displayName: fullName });
        } catch {
          /* non-fatal — profile is saved server-side regardless */
        }
      }

      toast.success("Profile saved", "Your details have been updated.");
      // Reload so the header avatar (driven by Firebase auth state) refreshes.
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Error", "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-h2 sm:text-h1 font-bold mb-8">Profile</h1>
        <Card padding="lg" elevation="sm" className="animate-pulse">
          <div className="h-6 w-32 bg-[var(--bg-secondary)] rounded mb-4" />
          <div className="h-4 w-48 bg-[var(--bg-secondary)] rounded" />
        </Card>
      </div>
    );
  }

  const selectClass =
    "w-full min-h-[44px] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-color)] " +
    "bg-[var(--input-bg)] text-[var(--text-primary)] focus:border-nigerian-green focus:ring-2 " +
    "focus:ring-nigerian-green/20 focus:outline-none transition-colors";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-h2 sm:text-h1 font-bold mb-8">Profile</h1>

      <Card padding="lg" elevation="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Joseph"
              required
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Hamawi"
              required
            />
          </div>

          <Input
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="hearAboutUs" className="text-label-style text-[var(--text-primary)]">
              Where did you hear about us?
            </label>
            <select
              id="hearAboutUs"
              className={selectClass}
              value={hearSelect}
              onChange={(e) => setHearSelect(e.target.value)}
            >
              <option value="">Select an option…</option>
              {HEAR_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {hearSelect === "Other" && (
            <Input
              label="Tell us more"
              value={hearOther}
              onChange={(e) => setHearOther(e.target.value)}
              placeholder="How did you find us?"
            />
          )}

          {username && (
            <div className="flex flex-col gap-1.5">
              <span className="text-label-style text-[var(--text-primary)]">Username</span>
              <div className="flex items-center min-h-[44px] px-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono">
                @{username}
              </div>
              <p className="text-caption-style text-[var(--text-muted)]">
                Auto-generated and unique to you.
              </p>
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth type="submit" loading={saving}>
            Save profile
          </Button>
        </form>
      </Card>
    </div>
  );
}
