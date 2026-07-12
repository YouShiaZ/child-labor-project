// Child Labor Project — mock auth context.
// Replace login() with POST /api/auth/login per STRUCTURE.md.
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { listUsers } from "@/lib/api";
import type { User, Role } from "@/lib/types";

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  isRole: (...roles: Role[]) => boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "clp_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((email: string, _password: string) => {
    // Mock: match by email against seeded users. Any password accepted.
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

  const canEdit = user ? user.role === "admin" || user.role === "editor" : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isRole, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
