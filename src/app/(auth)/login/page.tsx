"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await signIn("email-otp", { email, callbackUrl: "/dashboard" });
      setSent(true);
    } catch {
      // signIn redirects on success, so this only fires on actual errors
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <PageLayout showWallpaper>
      <div className="flex items-center justify-center min-h-screen px-4 py-20">
        <Card frosted elevation="xl" padding="lg" className="w-full max-w-sm">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl bg-nigerian-green flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 512 512" fill="none" aria-hidden="true">
                <path d="M256 120 L256 320" stroke="white" strokeWidth="40" strokeLinecap="round"/>
                <path d="M176 200 L256 120 L336 200" stroke="white" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M136 380 L376 380" stroke="white" strokeWidth="40" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Sign in to manage your transfers
            </p>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-nigerian-green/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-nigerian-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-2">You&apos;re signed in!</h2>
              <p className="text-sm text-[var(--text-secondary)]">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Google Sign In — primary */}
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleGoogleLogin}
                className="relative"
              >
                <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <span className="text-xs text-[var(--text-muted)]">or</span>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
              </div>

              {/* Email login */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button variant="primary" size="lg" fullWidth type="submit" loading={loading}>
                  Continue with email
                </Button>
              </form>

              <p className="text-center text-xs text-[var(--text-muted)] pt-3">
                No account needed to send files.{" "}
                <a href="/" className="text-nigerian-green hover:underline font-medium">Send files now</a>
              </p>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
