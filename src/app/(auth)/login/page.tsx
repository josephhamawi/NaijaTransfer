"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign in failed";
      if (!msg.includes("popup-closed")) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Invalid email or password");
      } else if (msg.includes("email-already-in-use")) {
        setError("Account already exists. Sign in instead.");
        setIsSignUp(false);
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout showWallpaper>
      <div className="flex items-center justify-center min-h-screen px-4 py-20">
        <Card frosted elevation="xl" padding="lg" className="w-full max-w-full sm:max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-nigerian-green flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 512 512" fill="none" aria-hidden="true">
                <path d="M256 120 L256 320" stroke="white" strokeWidth="40" strokeLinecap="round"/>
                <path d="M176 200 L256 120 L336 200" stroke="white" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M136 380 L376 380" stroke="white" strokeWidth="40" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-h2 font-bold text-[var(--text-primary)]">
              {isSignUp ? "Create account" : "Welcome back"}
            </h1>
            <p className="text-body-sm text-[var(--text-secondary)] mt-1">
              {isSignUp ? "Sign up to manage your transfers" : "Sign in to manage your transfers"}
            </p>
          </div>

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 min-h-[44px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold text-sm whitespace-nowrap transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span className="text-xs text-[var(--text-muted)]">or</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>

            {/* Email + Password */}
            <form onSubmit={handleEmail} className="space-y-3">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder={isSignUp ? "Min 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <p className="text-body-sm text-error-red bg-[var(--error-bg)] px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
                {isSignUp ? "Create account" : "Sign in"}
              </Button>
            </form>

            {/* Toggle sign up / sign in */}
            <p className="text-center text-xs text-[var(--text-muted)] pt-2">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="text-nigerian-green hover:underline font-medium"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>

            <p className="text-center text-xs text-[var(--text-muted)]">
              No account needed to send files.{" "}
              <a href="/" className="text-nigerian-green hover:underline font-medium">Send files now</a>
            </p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
