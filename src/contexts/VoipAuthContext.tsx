import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VoipUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client";
  status?: string;
  suspension_reason?: string;
}

interface VoipAuthContextType {
  user: VoipUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userStatus: string | null;
  suspensionReason: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, inviteToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  checkUserStatus: () => Promise<void>;
}

const VoipAuthContext = createContext<VoipAuthContextType | undefined>(undefined);

const TOKEN_KEY = "voip_token";
const REFRESH_TOKEN_KEY = "voip_refresh_token";
const USER_KEY = "voip_user";

// Helper to decode JWT and check expiry
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Add 60 second buffer for clock skew
    return payload.exp * 1000 < Date.now() - 60000;
  } catch {
    return true; // If we can't decode it, treat as expired
  }
}

export function VoipAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VoipUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (storedToken && storedUser) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log("[VoipAuth] Token expired, attempting refresh...");
          // Token expired, try to refresh
          if (storedRefreshToken && !isTokenExpired(storedRefreshToken)) {
            // Refresh in background
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-auth?action=refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            })
              .then(res => res.ok ? res.json() : Promise.reject())
              .then(result => {
                localStorage.setItem(TOKEN_KEY, result.token);
                localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
                setToken(result.token);
                setUser(JSON.parse(storedUser));
              })
              .catch(() => {
                // Refresh failed, clear everything
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setToken(null);
                setUser(null);
              })
              .finally(() => setIsLoading(false));
            return; // Exit early, setIsLoading handled in finally
          } else {
            // No valid refresh token, clear everything
            console.log("[VoipAuth] Refresh token also expired, logging out");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } else {
          // Token is valid
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
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
    // End session on logout
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-analytics?action=end-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      }).catch(() => {});
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setUserStatus(null);
    setSuspensionReason(null);
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

  // Check user status for live kick
  const checkUserStatus = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-auth?action=me`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserStatus(data.status);
        setSuspensionReason(data.suspension_reason || null);

        if (data.status !== "active") {
          // User is suspended/disabled, update local state
          const storedUser = localStorage.getItem(USER_KEY);
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            parsedUser.status = data.status;
            parsedUser.suspension_reason = data.suspension_reason;
            setUser(parsedUser);
          }
        }
      }
    } catch {
      // Silently fail status checks
    }
  }, []);

  // Heartbeat and status check
  useEffect(() => {
    if (!token || !user) return;

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-analytics?action=heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
      } catch {
        // Silently fail heartbeats
      }
    };

    sendHeartbeat();
    checkUserStatus();

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Status check every 30 seconds
    const statusInterval = setInterval(checkUserStatus, 30000);

    // Idle detection (5 minutes)
    let idleTimer: NodeJS.Timeout;
    const markIdle = async () => {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-analytics?action=idle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
      } catch {
        // Silently fail
      }
    };

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(markIdle, 5 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keypress", resetIdle);
    window.addEventListener("click", resetIdle);
    resetIdle();

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(statusInterval);
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keypress", resetIdle);
      window.removeEventListener("click", resetIdle);
    };
  }, [token, user, checkUserStatus]);

  return (
    <VoipAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        userStatus,
        suspensionReason,
        login,
        signup,
        logout,
        refreshToken,
        checkUserStatus,
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
