"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Blocks,
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
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
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

const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  Sparkles: Blocks,
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
  savedKeyHint: string | null;
  selectedModel: string;
  showKey: boolean;
  status: "idle" | "testing" | "success" | "error";
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
}

interface ProviderRecord {
  provider: ProviderName;
  hasApiKey: boolean;
  keyHint: string | null;
  selectedModel: string;
  updatedAt: number;
}

interface ProviderListResponse {
  providers: ProviderRecord[];
}

export default function ProvidersPage() {
  const [states, setStates] = useState<
    Record<ProviderName, ProviderCardState>
  >(() => {
    const initial = {} as Record<ProviderName, ProviderCardState>;
    for (const provider of PROVIDER_CATALOG) {
      initial[provider.name] = {
        apiKey: "",
        savedKeyHint: null,
        selectedModel: provider.models[0]?.id ?? "",
        showKey: false,
        status: "idle",
        saveStatus: "idle",
        isDirty: false,
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

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const response = await fetch("/api/settings/providers", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok || !alive) {
          return;
        }

        const data = (await response.json()) as ProviderListResponse;
        const recordsByProvider = new Map<ProviderName, ProviderRecord>();

        for (const record of data.providers) {
          recordsByProvider.set(record.provider, record);
        }

        setStates((prev) => {
          const next = { ...prev };

          for (const provider of PROVIDER_CATALOG) {
            const saved = recordsByProvider.get(provider.name);
            if (!saved) {
              continue;
            }

            next[provider.name] = {
              ...next[provider.name],
              apiKey: "",
              savedKeyHint: saved.hasApiKey ? saved.keyHint : null,
              selectedModel:
                saved.selectedModel ||
                provider.models[0]?.id ||
                next[provider.name].selectedModel,
              isDirty: false,
              saveStatus: "saved",
            };
          }

          return next;
        });
      } catch (error) {
        console.error("Failed to load provider settings", error);
        toast.error("Falha ao carregar configuracoes de provedores.");
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const saveProviderConfig = async (name: ProviderName) => {
    updateState(name, { saveStatus: "saving" });

    try {
      const response = await fetch("/api/settings/providers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: name,
          apiKey: states[name].apiKey,
          selectedModel: states[name].selectedModel,
        }),
      });

      if (!response.ok) {
        updateState(name, { saveStatus: "error" });
        return;
      }

      updateState(name, {
        apiKey: "",
        savedKeyHint: (() => {
          const currentApiKey = states[name].apiKey.trim();
          const tail = currentApiKey.slice(-4);
          return tail ? `••••${tail}` : states[name].savedKeyHint;
        })(),
        isDirty: false,
        saveStatus: "saved",
      });
      toast.success("Provider salvo com sucesso!");
    } catch {
      updateState(name, { saveStatus: "error" });
      toast.error("Falha ao salvar provider.");
    }
  };

  const testConnection = async (name: ProviderName) => {
    const apiKey = states[name].apiKey.trim();
    updateState(name, { status: "testing" });

    try {
      const response = await fetch("/api/settings/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: name,
          ...(apiKey ? { apiKey } : {}),
        }),
      });

      if (response.ok) {
        updateState(name, { status: "success" });
        toast.success(`${name} — conexao verificada!`);
      } else {
        const data = await response.json().catch(() => null);
        updateState(name, { status: "error" });
        if (data?.reason === "invalid_key") {
          toast.error("API key invalida ou sem permissao.");
        } else if (data?.error === "no_api_key") {
          toast.error("Nenhuma API key configurada. Insira e salve antes de testar.");
        } else {
          toast.error("Falha na conexao com o provider.");
        }
      }
    } catch {
      updateState(name, { status: "error" });
      toast.error("Erro ao verificar conexao.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
            <Key className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Provedores de IA</h1>
            <p className="mt-1 text-sm text-foreground/40">
              Conecte suas API keys para ativar o motor de decomposicao e orquestracao de agentes do ORIGEM
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
              className="rounded-2xl border border-foreground/[0.08] bg-card/70 p-5 backdrop-blur-xl transition-all hover:border-foreground/[0.14] hover:bg-card/80"
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
                    <p className="text-[10px] text-foreground/30">
                      {provider.models.length} model
                      {provider.models.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div
                  className={`h-2 w-2 rounded-full ${state.status === "success"
                    ? "bg-green-400 shadow-[0_0_6px_oklch(0.78_0.2_145/0.4)]"
                    : state.status === "error"
                      ? "bg-red-400"
                      : state.status === "testing"
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-foreground/10"
                    }`}
                />
              </div>

              {/* API Key Input */}
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground/25">
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={state.showKey ? "text" : "password"}
                    value={state.apiKey}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateState(provider.name, {
                        apiKey: value,
                        savedKeyHint: value ? null : state.savedKeyHint,
                        status: "idle",
                        saveStatus: "idle",
                        isDirty: true,
                      });
                    }}
                    placeholder={
                      state.savedKeyHint
                        ? `Key salva no backend (${state.savedKeyHint})`
                        : "sk-..."
                    }
                    className="pr-10 font-mono text-xs bg-black/20 border-foreground/[0.06] text-foreground placeholder:text-foreground/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateState(provider.name, {
                        showKey: !state.showKey,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/50"
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
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-foreground/25">
                  Modelo padrao
                </label>
                <Select
                  value={state.selectedModel}
                  onValueChange={(v) =>
                    updateState(provider.name, {
                      selectedModel: v,
                      saveStatus: "idle",
                      isDirty: true,
                    })
                  }
                >
                  <SelectTrigger className="text-xs bg-black/20 border-foreground/[0.06] text-foreground">
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

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-neon-cyan/25 bg-neon-cyan/10 text-xs text-neon-cyan hover:border-neon-cyan/50 hover:bg-neon-cyan/20 hover:text-neon-cyan"
                  onClick={() => void saveProviderConfig(provider.name)}
                  disabled={
                    (!state.apiKey.trim() && !state.savedKeyHint) ||
                    state.saveStatus === "saving"
                  }
                >
                  {state.saveStatus === "saving" && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {state.saveStatus === "saved" && !state.isDirty && (
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  )}
                  {state.saveStatus === "error" && (
                    <XCircle className="h-3 w-3 text-red-400" />
                  )}
                  {state.saveStatus === "saving"
                    ? "Salvando..."
                    : state.saveStatus === "saved" && !state.isDirty
                      ? "Salvo"
                      : state.saveStatus === "error"
                        ? "Falhou"
                        : "Salvar Key"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-foreground/[0.06] bg-foreground/[0.03] text-xs text-foreground/60 hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-foreground"
                  onClick={() => testConnection(provider.name)}
                  disabled={
                    (!state.apiKey.trim() && !state.savedKeyHint) ||
                    state.status === "testing"
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
                    ? "Testando..."
                    : state.status === "success"
                      ? "Conectado"
                      : state.status === "error"
                        ? "Falhou"
                        : "Testar Conexao"}
                </Button>
              </div>

              <p className="mt-2 text-[10px] text-foreground/35">
                {state.isDirty
                  ? "Alteracoes pendentes. Clique em Salvar Key."
                  : state.saveStatus === "saved"
                    ? `Configuracao protegida no backend${state.savedKeyHint ? ` (${state.savedKeyHint})` : "."
                    }`
                    : "Chave salva apenas apos confirmar no botao."}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
