import { useCallback } from "react";
import { useVoipAuth } from "@/contexts/VoipAuthContext";

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string>;
}

export function useVoipApi() {
  const { token, refreshToken, logout } = useVoipAuth();

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

      // Log the full URL for debugging
      console.log(`[useVoipApi] ${method} request to:`, url.toString());

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      };

      try {
        // Use url.href to ensure proper URL formatting (avoid double-encoding issues)
        const fullUrl = url.href;
        console.log(`[useVoipApi] Final URL:`, fullUrl);
        
        const response = await fetch(fullUrl, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        console.log(`[useVoipApi] Response status:`, response.status);

        // Handle token expiration
        if (response.status === 401) {
          console.log("[useVoipApi] Got 401, attempting token refresh...");
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
                return { data: null, error: errorData.error || "Request failed" };
              } catch {
                return { data: null, error: `Request failed with status ${retryResponse.status}` };
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
            return { data: null, error: errorData.error || `Request failed with status ${response.status}` };
          } catch {
            return { data: null, error: `Request failed with status ${response.status}` };
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
        console.error("API call error:", error);
        // Provide more specific error messaging
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[useVoipApi] Detailed error:", errorMessage);
        return { 
          data: null, 
          error: `Connection error: ${errorMessage}. Please check your network and try again.` 
        };
      }
    },
    [token, refreshToken, logout]
  );

  return { apiCall };
}
