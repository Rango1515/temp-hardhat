import { useCallback, useRef } from "react";
import { useVoipAuth } from "@/contexts/VoipAuthContext";

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string>;
}

export function useVoipApi() {
  const { token, refreshToken, logout } = useVoipAuth();
  const errorLogInflight = useRef(false);
  const securityLogInflight = useRef(false);
  const lastSecurityLogTime = useRef(0);

  const logError = useCallback(
    async (endpoint: string, method: string, status: number | null, error: string) => {
      // Prevent infinite loop: don't log errors from the error-logging endpoint
      if (errorLogInflight.current) return;
      errorLogInflight.current = true;

      try {
        const currentToken = localStorage.getItem("voip_token");
        if (!currentToken) return;

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-admin-ext?action=log-error`;
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            endpoint,
            method,
            status,
            error: error.slice(0, 500),
            context: window.location.pathname,
          }),
        }).catch(() => {}); // Silently fail
      } catch {
        // Never throw from error logging
      } finally {
        errorLogInflight.current = false;
      }
    },
    []
  );

  // Fire-and-forget security log (throttled to 1 per 2s, never recursive)
  const logRequest = useCallback(
    (endpoint: string, method: string, statusCode?: number, responseMs?: number) => {
      // Skip logging security calls to prevent recursion
      if (endpoint.includes("voip-security")) return;
      if (securityLogInflight.current) return;

      const now = Date.now();
      if (now - lastSecurityLogTime.current < 2000) return;
      lastSecurityLogTime.current = now;
      securityLogInflight.current = true;

      const currentToken = localStorage.getItem("voip_token");
      if (!currentToken) {
        securityLogInflight.current = false;
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-security?action=log-request`;
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          endpoint,
          method,
          userAgent: navigator.userAgent,
          statusCode,
          responseMs,
        }),
      })
        .catch(() => {})
        .finally(() => {
          securityLogInflight.current = false;
        });
    },
    []
  );

  const apiCall = useCallback(
    async <T = unknown>(
      endpoint: string,
      options: ApiOptions = {}
    ): Promise<{ data: T | null; error: string | null }> => {
      const { method = "GET", body, params } = options;

      // Get current token from localStorage as it might have been refreshed
      let currentToken = token || localStorage.getItem("voip_token");

      if (!currentToken) {
        logout();
        return { data: null, error: "Not authenticated. Please log in again." };
      }

      // Check if token is expired before making request
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now() - 30000; // 30 second buffer
        
        if (isExpired) {
          console.log("[useVoipApi] Token expired, attempting refresh...");
          const refreshed = await refreshToken();
          if (refreshed) {
            currentToken = localStorage.getItem("voip_token");
            if (!currentToken) {
              logout();
              return { data: null, error: "Session expired. Please log in again." };
            }
          } else {
            logout();
            return { data: null, error: "Session expired. Please log in again." };
          }
        }
      } catch {
        // Token malformed, try to continue anyway
        console.warn("[useVoipApi] Could not parse token, continuing with request");
      }

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`
      );

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      };

      try {
        const fullUrl = url.href;
        const requestStart = Date.now();

        // Fire background security log (pre-request, status unknown)
        logRequest(endpoint, method);
        
        const response = await fetch(fullUrl, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Handle token expiration
        if (response.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry with new token
            const newToken = localStorage.getItem("voip_token");
            if (!newToken) {
              logout();
              return { data: null, error: "Session expired. Please log in again." };
            }
            const retryResponse = await fetch(fullUrl, {
              method,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
              body: body ? JSON.stringify(body) : undefined,
            });

            if (!retryResponse.ok) {
              try {
                const errorData = await retryResponse.json();
                const errMsg = errorData.error || "Request failed";
                logError(endpoint, method, retryResponse.status, errMsg);
                return { data: null, error: errMsg };
              } catch {
                const errMsg = `Request failed with status ${retryResponse.status}`;
                logError(endpoint, method, retryResponse.status, errMsg);
                return { data: null, error: errMsg };
              }
            }

            try {
              return { data: await retryResponse.json(), error: null };
            } catch {
              return { data: null as T, error: null };
            }
          } else {
            logout();
            return { data: null, error: "Session expired. Please log in again." };
          }
        }

        if (!response.ok) {
          try {
            const errorData = await response.json();
            const errMsg = errorData.error || `Request failed with status ${response.status}`;
            logError(endpoint, method, response.status, errMsg);
            return { data: null, error: errMsg };
          } catch {
            const errMsg = `Request failed with status ${response.status}`;
            logError(endpoint, method, response.status, errMsg);
            return { data: null, error: errMsg };
          }
        }

        try {
          const data = await response.json();
          return { data, error: null };
        } catch {
          // Some endpoints might not return JSON (e.g., successful DELETE)
          return { data: null as T, error: null };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errMsg = `Connection error: ${errorMessage}. Please check your network and try again.`;
        logError(endpoint, method, null, errMsg);
        return { data: null, error: errMsg };
      }
    },
    [token, refreshToken, logout, logError, logRequest]
  );

  return { apiCall };
}
