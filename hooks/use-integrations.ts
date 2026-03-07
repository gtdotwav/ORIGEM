"use client";

import { useState, useEffect, useCallback } from "react";
import type { GitHubIntegration, VercelIntegration } from "@/types/integrations";

interface IntegrationState {
  github: GitHubIntegration | null;
  vercel: VercelIntegration | null;
  loading: boolean;
}

export function useIntegrations() {
  const [state, setState] = useState<IntegrationState>({
    github: null,
    vercel: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const [ghRes, vcRes] = await Promise.allSettled([
      fetch("/api/integrations/github").then((r) => r.json()),
      fetch("/api/integrations/vercel").then((r) => r.json()),
    ]);

    setState({
      github: ghRes.status === "fulfilled" ? ghRes.value : { connected: false },
      vercel: vcRes.status === "fulfilled" ? vcRes.value : { connected: false },
      loading: false,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
