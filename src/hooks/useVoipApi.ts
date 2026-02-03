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

      if (!token) {
        return { data: null, error: "Not authenticated" };
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
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(url.toString(), {
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
            const retryResponse = await fetch(url.toString(), {
              method,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
              body: body ? JSON.stringify(body) : undefined,
            });

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json();
              return { data: null, error: errorData.error || "Request failed" };
            }

            return { data: await retryResponse.json(), error: null };
          } else {
            logout();
            return { data: null, error: "Session expired. Please log in again." };
          }
        }

        if (!response.ok) {
          const errorData = await response.json();
          return { data: null, error: errorData.error || "Request failed" };
        }

        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        console.error("API call error:", error);
        return { data: null, error: "Connection error. Please try again." };
      }
    },
    [token, refreshToken, logout]
  );

  return { apiCall };
}
