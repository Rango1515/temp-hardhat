import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VoipUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client";
}

interface VoipAuthContextType {
  user: VoipUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, inviteToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const VoipAuthContext = createContext<VoipAuthContextType | undefined>(undefined);

const TOKEN_KEY = "voip_token";
const REFRESH_TOKEN_KEY = "voip_refresh_token";
const USER_KEY = "voip_user";

export function VoipAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VoipUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload = { email, password };
      console.log("[VoipAuth] Login request:", { email, password: "***" });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-auth?action=login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("[VoipAuth] Login response:", { status: response.status, result });

      if (!response.ok) {
        return { success: false, error: result.error || "Login failed" };
      }

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));

      setToken(result.token);
      setUser(result.user);

      return { success: true };
    } catch (error) {
      console.error("[VoipAuth] Login error:", error);
      return { success: false, error: "Connection error. Please try again." };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, inviteToken: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-auth?action=signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, inviteToken }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || "Signup failed" };
      }

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));

      setToken(result.token);
      setUser(result.user);

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "Connection error. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return false;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-auth?action=refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        }
      );

      if (!response.ok) {
        logout();
        return false;
      }

      const result = await response.json();
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      setToken(result.token);

      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  return (
    <VoipAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        login,
        signup,
        logout,
        refreshToken,
      }}
    >
      {children}
    </VoipAuthContext.Provider>
  );
}

export function useVoipAuth() {
  const context = useContext(VoipAuthContext);
  if (context === undefined) {
    throw new Error("useVoipAuth must be used within a VoipAuthProvider");
  }
  return context;
}
