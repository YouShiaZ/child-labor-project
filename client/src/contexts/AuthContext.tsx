// Child Labor Project — auth context (mock in Phase 1; Supabase Auth in Phase 2).
// Exposes the current user plus office-aware permission helpers so pages never
// re-implement the access rules.
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  listUsers,
  canEditOffice as _canEditOffice,
  canApprove as _canApprove,
  canManageUsers as _canManageUsers,
  isSuperAdmin as _isSuperAdmin,
} from "@/lib/api";
import type { User, Role, OfficeId } from "@/lib/types";

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  isRole: (...roles: Role[]) => boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  /** Can the current user edit records in this office? */
  canEditOffice: (officeId: OfficeId) => boolean;
  /** Can the current user approve submitted forms in this office? */
  canApprove: (officeId: OfficeId) => boolean;
  /** True if the user can edit at least one office (hides global "add" affordances for viewers). */
  canEditAny: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = "clp_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw) as User;
      // Re-hydrate from the current user list so role/office changes take effect.
      return listUsers().find((u) => u.id === saved.id) ?? saved;
    } catch {
      return null;
    }
  });

  const login = useCallback((email: string, _password: string) => {
    const found = listUsers().find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!found) return { ok: false, error: "No account found with this email." };
    if (!found.active) return { ok: false, error: "This account is disabled." };
    setUser(found);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      login,
      logout,
      isRole,
      isSuperAdmin: _isSuperAdmin(user),
      canManageUsers: _canManageUsers(user),
      canEditOffice: (officeId: OfficeId) => _canEditOffice(user, officeId),
      canApprove: (officeId: OfficeId) => _canApprove(user, officeId),
      canEditAny:
        !!user && (user.role === "super_admin" || user.role === "office_admin" || user.role === "editor"),
    }),
    [user, login, logout, isRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
