// Child Labor Project — authentication + permission context.
//
// REAL mode: Supabase Auth (email + password), profile from `app_users`, data
//            loaded via bootstrap(). Password self-service + super-admin admin
//            actions go through secure Edge Functions.
// DEMO mode: mock auth (matches a seeded email, any password).
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  listUsers,
  getUser,
  upsertUserLocal,
  deleteUser as deleteUserLocal,
  bootstrap,
  canEditOffice as _canEditOffice,
  canApprove as _canApprove,
  canManageUsers as _canManageUsers,
  isSuperAdmin as _isSuperAdmin,
  SUPABASE_ENABLED,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { User, Role, OfficeId } from "@/lib/types";

type Result = { ok: boolean; error?: string };

interface NewUserInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  officeId: OfficeId | null;
}

interface AuthState {
  user: User | null;
  ready: boolean;
  backend: "supabase" | "demo";
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  isRole: (...roles: Role[]) => boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  canEditOffice: (officeId: OfficeId) => boolean;
  canApprove: (officeId: OfficeId) => boolean;
  canEditAny: boolean;
  // Password + account management
  changeOwnPassword: (newPassword: string) => Promise<Result>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<Result>;
  adminCreateUser: (input: NewUserInput) => Promise<Result>;
  adminDeleteUser: (userId: string) => Promise<Result>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = "clp_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // --- Initialization -------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function initSupabase() {
      try {
        const { data } = await supabase!.auth.getSession();
        if (data.session?.user) {
          await bootstrap();
          const profile = listUsers().find((u) => u.id === data.session!.user.id) ?? null;
          if (active) setUser(profile);
        }
      } catch (e) {
        console.error("[CLP] init failed:", e);
      } finally {
        if (active) setReady(true);
      }
      // Keep local user in sync with auth changes (e.g. token refresh, sign-out).
      supabase!.auth.onAuthStateChange(async (_evt, session) => {
        if (!session?.user) {
          setUser(null);
          return;
        }
        if (!listUsers().length) await bootstrap();
        setUser(listUsers().find((u) => u.id === session.user.id) ?? null);
      });
    }

    function initDemo() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as User;
          setUser(getUser(saved.id) ?? saved);
        }
      } catch {
        /* ignore */
      }
      setReady(true);
    }

    if (SUPABASE_ENABLED) initSupabase();
    else initDemo();

    return () => {
      active = false;
    };
  }, []);

  // --- Login / logout -------------------------------------------------------
  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    if (SUPABASE_ENABLED) {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      await bootstrap();
      const profile = listUsers().find((u) => u.id === data.user?.id) ?? null;
      if (!profile) return { ok: false, error: "No profile found for this account." };
      if (!profile.active) {
        await supabase!.auth.signOut();
        return { ok: false, error: "This account is disabled." };
      }
      setUser(profile);
      return { ok: true };
    }
    // Demo
    const found = listUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return { ok: false, error: "No account found with this email." };
    if (!found.active) return { ok: false, error: "This account is disabled." };
    setUser(found);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (SUPABASE_ENABLED) await supabase!.auth.signOut();
    else localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // --- Password + account management ---------------------------------------
  const changeOwnPassword = useCallback(async (newPassword: string): Promise<Result> => {
    if (!SUPABASE_ENABLED)
      return { ok: false, error: "Password change is available once the backend is connected." };
    const { error } = await supabase!.auth.updateUser({ password: newPassword });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const adminResetPassword = useCallback(async (userId: string, newPassword: string): Promise<Result> => {
    if (!SUPABASE_ENABLED)
      return { ok: false, error: "Available once the backend is connected." };
    const { error } = await supabase!.functions.invoke("admin-reset-password", {
      body: { userId, newPassword },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const adminCreateUser = useCallback(async (input: NewUserInput): Promise<Result> => {
    if (!SUPABASE_ENABLED)
      return { ok: false, error: "Available once the backend is connected." };
    const { data, error } = await supabase!.functions.invoke("admin-create-user", { body: input });
    if (error) return { ok: false, error: error.message };
    const created = (data as { user?: User })?.user;
    if (created) upsertUserLocal(created);
    return { ok: true };
  }, []);

  const adminDeleteUser = useCallback(async (userId: string): Promise<Result> => {
    if (!SUPABASE_ENABLED)
      return { ok: false, error: "Available once the backend is connected." };
    const { error } = await supabase!.functions.invoke("admin-delete-user", { body: { userId } });
    if (error) return { ok: false, error: error.message };
    deleteUserLocal(userId);
    return { ok: true };
  }, []);

  const isRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      backend: SUPABASE_ENABLED ? "supabase" : "demo",
      login,
      logout,
      isRole,
      isSuperAdmin: _isSuperAdmin(user),
      canManageUsers: _canManageUsers(user),
      canEditOffice: (officeId: OfficeId) => _canEditOffice(user, officeId),
      canApprove: (officeId: OfficeId) => _canApprove(user, officeId),
      canEditAny:
        !!user && (user.role === "super_admin" || user.role === "office_admin" || user.role === "editor"),
      changeOwnPassword,
      adminResetPassword,
      adminCreateUser,
      adminDeleteUser,
    }),
    [user, ready, login, logout, isRole, changeOwnPassword, adminResetPassword, adminCreateUser, adminDeleteUser],
  );

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
