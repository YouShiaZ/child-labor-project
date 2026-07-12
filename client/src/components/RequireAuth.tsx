// Route guard: redirect to /login if not authenticated; optional role restriction.
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/types";
import AppLayout from "./AppLayout";

export default function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  if (roles && !roles.includes(user.role)) {
    return (
      <AppLayout>
        <div className="grid place-items-center py-24 text-center">
          <h2 className="font-display text-xl font-semibold text-primary">Access restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
