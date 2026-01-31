import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// Demo user when auth fails (no OAuth / no DB) - never block the app
const DEMO_FALLBACK_USER = {
  id: 1,
  openId: "local-dev-demo",
  name: "Demo User",
  email: "demo@local",
  loginMethod: "local" as const,
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // When auth fails (no DB, network error), don't block - use demo user
    placeholderData: DEMO_FALLBACK_USER,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // No OAuth = demo mode: use demo user and never block on loading
  const isDemoMode = getLoginUrl() === "#";
  const user =
    meQuery.data ??
    (meQuery.isError ? DEMO_FALLBACK_USER : null) ??
    (isDemoMode ? DEMO_FALLBACK_USER : null);

  const state = useMemo(() => {
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    return {
      user,
      // Demo mode: never block. Otherwise: loading only while waiting for auth
      loading:
        isDemoMode || user
          ? false
          : (meQuery.isLoading || logoutMutation.isPending) && !meQuery.isError,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [
    user,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    isDemoMode,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
