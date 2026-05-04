"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProWaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting" || state === "ok") return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrMsg("Please enter a valid email.");
      setState("err");
      return;
    }
    setState("submitting");
    setErrMsg("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage-pro-waitlist" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || "Could not save your email.");
      }
      setState("ok");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong.");
      setState("err");
    }
  }

  if (state === "ok") {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-nigerian-green/15 mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-body font-semibold text-white">Got it.</p>
        <p className="text-body-sm text-white/60 mt-1">
          We&apos;ll email you the day Pro goes live in Naira.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "err") setState("idle");
            }}
            aria-label="Your email"
            fullWidth
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={state === "submitting"}
          disabled={state === "submitting"}
        >
          Notify me
        </Button>
      </div>
      {state === "err" && errMsg && (
        <p className="text-body-sm text-error-red">{errMsg}</p>
      )}
      <p className="text-body-sm text-white/50">
        We&apos;ll send you one email the day Pro ships. That&apos;s it.
      </p>
    </form>
  );
}
