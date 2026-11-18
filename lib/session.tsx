"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface SessionUser {
  name: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  signOut: () => void;
}

const STORAGE_KEY = "av_user";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Empieza en null para coincidir con el HTML del servidor; se lee tras el montaje.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed.name === "string") {
        setUser({ name: parsed.name });
      }
    } catch {
      // localStorage bloqueado o JSON corrupto: se queda como invitado
    }
  }, []);

  const login = useCallback((next: SessionUser) => {
    setUser(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(() => ({ user, login, signOut }), [user, login, signOut]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
