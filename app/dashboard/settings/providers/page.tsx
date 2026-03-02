"use client";

import { useState } from "react";
import {
  Brain,
  Sparkles,
  Gem,
  Zap,
  Flame,
  Wind,
  Box,
  Globe,
  Users,
  MessageSquare,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { GradientText } from "@/components/shared/gradient-text";
import { StatusPulse } from "@/components/shared/status-pulse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDER_CATALOG } from "@/config/providers";
import type { ProviderName } from "@/types/provider";

const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  Sparkles,
  Gem,
  Zap,
  Flame,
  Wind,
  Box,
  Globe,
  Users,
  MessageSquare,
};

interface ProviderCardState {
  apiKey: string;
  selectedModel: string;
  showKey: boolean;
  status: "idle" | "testing" | "success" | "error";
}

export default function ProvidersPage() {
  const [states, setStates] = useState<
    Record<ProviderName, ProviderCardState>
  >(() => {
    const initial = {} as Record<ProviderName, ProviderCardState>;
    for (const provider of PROVIDER_CATALOG) {
      initial[provider.name] = {
        apiKey: "",
        selectedModel: provider.models[0]?.id ?? "",
        showKey: false,
        status: "idle",
      };
    }
    return initial;
  });

  const updateState = (
    name: ProviderName,
    updates: Partial<ProviderCardState>
  ) => {
    setStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...updates },
    }));
  };

  const testConnection = async (name: ProviderName) => {
    updateState(name, { status: "testing" });
    // Simulated test — will be replaced with real API call
    await new Promise((r) => setTimeout(r, 1500));
    const hasKey = states[name].apiKey.length > 10;
    updateState(name, {
      status: hasKey ? "success" : "error",
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">
          <GradientText>AI Providers</GradientText>
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect your API keys to power ORIGEM&apos;s decomposition
          engine and agent orchestration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDER_CATALOG.map((provider) => {
          const state = states[provider.name];
          const Icon = ICON_MAP[provider.icon] ?? Box;

          return (
            <GlassCard
              key={provider.name}
              hover
              className="relative"
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${provider.color}15`,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: provider.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/90">
                      {provider.displayName}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {provider.models.length} model
                      {provider.models.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <StatusPulse
                  status={
                    state.status === "success"
                      ? "success"
                      : state.status === "error"
                        ? "error"
                        : state.status === "testing"
                          ? "active"
                          : "idle"
                  }
                />
              </div>

              {/* API Key Input */}
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={state.showKey ? "text" : "password"}
                    value={state.apiKey}
                    onChange={(e) =>
                      updateState(provider.name, {
                        apiKey: e.target.value,
                        status: "idle",
                      })
                    }
                    placeholder={`sk-...`}
                    className="pr-10 font-mono text-xs bg-black/20 border-white/5"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateState(provider.name, {
                        showKey: !state.showKey,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                  >
                    {state.showKey ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Model Selector */}
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Default Model
                </label>
                <Select
                  value={state.selectedModel}
                  onValueChange={(v) =>
                    updateState(provider.name, {
                      selectedModel: v,
                    })
                  }
                >
                  <SelectTrigger className="text-xs bg-black/20 border-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {provider.models.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        className="text-xs"
                      >
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-white/5 text-xs"
                onClick={() => testConnection(provider.name)}
                disabled={
                  !state.apiKey || state.status === "testing"
                }
              >
                {state.status === "testing" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : state.status === "success" ? (
                  <CheckCircle2 className="h-3 w-3 text-neon-green" />
                ) : state.status === "error" ? (
                  <XCircle className="h-3 w-3 text-destructive" />
                ) : null}
                {state.status === "testing"
                  ? "Testing..."
                  : state.status === "success"
                    ? "Connected"
                    : state.status === "error"
                      ? "Failed — Retry"
                      : "Test Connection"}
              </Button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
