// Child Labor Project — Login page. Mock auth in Phase 1 (see AuthContext);
// swap for Supabase Auth in Phase 2. Navy/green brand split layout.
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle } from "lucide-react";

const LOGO_URL = "/favicon.png";

export default function Login() {
  const { login, user } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (res.ok) navigate("/dashboard");
    else setError(res.error ?? "Login failed.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(58,170,53,0.6), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25), transparent 45%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1.5">
            <img src={LOGO_URL} alt="CLP" className="h-9 w-9 object-contain" />
          </span>
          <span className="font-display text-lg font-semibold">Child Labor Project</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Keeping children in school, <span className="text-[var(--color-brand-green)]">out of labor.</span>
          </h1>
          <p className="mt-4 text-primary-foreground/80">
            A secure case-management system to support beneficiaries academically, medically and
            socially across a three-year program.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-primary-foreground/70">
          <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)]" />
          Authorized staff access only
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <img src={LOGO_URL} alt="Child Labor Project" className="h-20 w-20 object-contain" />
            <span className="font-display text-lg font-semibold text-primary">
              Child Labor Project
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-primary">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the system.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@clp.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
