"use client";

import { useState, useEffect } from "react";
import type { ProviderName } from "@/types/provider";

interface ConfiguredProviderInfo {
  provider: ProviderName;
  selectedModel: string;
  hasApiKey: boolean;
}

export function useConfiguredProviders() {
  const [providers, setProviders] = useState<ConfiguredProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/providers")
      .then((res) => res.json())
      .then((data: { providers: ConfiguredProviderInfo[] }) => {
        setProviders(data.providers.filter((p) => p.hasApiKey));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { providers, loading, hasAny: providers.length > 0 };
}
