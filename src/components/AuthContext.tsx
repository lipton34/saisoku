import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiRequestError, type User } from "../lib/api";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  authCheckError: string | null;
  retryAuthCheck: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckError, setAuthCheckError] = useState<string | null>(null);
  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setAuthCheckError(null);
    void api.me()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setUser(null);
        if (!(error instanceof ApiRequestError && error.status === 401)) {
          setAuthCheckError("認証状態を確認できませんでした。通信状況を確認して再試行してください。");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [checkVersion]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      authCheckError,
      retryAuthCheck: () => setCheckVersion((version) => version + 1),
      login: async (username, password) => {
        const data = await api.login(username, password);
        setUser(data.user);
        setAuthCheckError(null);
      },
      register: async (username, password, displayName, inviteCode) => {
        const data = await api.register(username, password, displayName, inviteCode);
        setUser(data.user);
      },
      logout: async () => {
        await api.logout();
        setUser(null);
      }
    }),
    [authCheckError, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
