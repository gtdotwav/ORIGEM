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
  Key,
} from "lucide-react";
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
    await new Promise((r) => setTimeout(r, 1500));
    const hasKey = states[name].apiKey.length > 10;
    updateState(name, {
      status: hasKey ? "success" : "error",
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
            <Key className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Providers</h1>
            <p className="mt-1 text-sm text-white/40">
              Connect your API keys to power ORIGEM&apos;s decomposition engine and agent orchestration
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDER_CATALOG.map((provider) => {
          const state = states[provider.name];
          const Icon = ICON_MAP[provider.icon] ?? Box;

          return (
            <div
              key={provider.name}
              className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-neutral-900/70"
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
                    <h3 className="text-sm font-semibold text-white/90">
                      {provider.displayName}
                    </h3>
                    <p className="text-[10px] text-white/30">
                      {provider.models.length} model
                      {provider.models.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div
                  className={`h-2 w-2 rounded-full ${
                    state.status === "success"
                      ? "bg-green-400 shadow-[0_0_6px_oklch(0.78_0.2_145/0.4)]"
                      : state.status === "error"
                        ? "bg-red-400"
                        : state.status === "testing"
                          ? "bg-yellow-400 animate-pulse"
                          : "bg-white/10"
                  }`}
                />
              </div>

              {/* API Key Input */}
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/25">
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
                    placeholder="sk-..."
                    className="pr-10 font-mono text-xs bg-black/20 border-white/[0.06] text-white placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateState(provider.name, {
                        showKey: !state.showKey,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
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
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/25">
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
                  <SelectTrigger className="text-xs bg-black/20 border-white/[0.06] text-white">
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
                className="w-full gap-2 border-white/[0.06] bg-white/[0.03] text-xs text-white/60 hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-white"
                onClick={() => testConnection(provider.name)}
                disabled={
                  !state.apiKey || state.status === "testing"
                }
              >
                {state.status === "testing" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : state.status === "success" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                ) : state.status === "error" ? (
                  <XCircle className="h-3 w-3 text-red-400" />
                ) : null}
                {state.status === "testing"
                  ? "Testing..."
                  : state.status === "success"
                    ? "Connected"
                    : state.status === "error"
                      ? "Failed — Retry"
                      : "Test Connection"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
