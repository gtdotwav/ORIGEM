import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  TokenTier,
  CriticConfig,
  CriticType,
  EcosystemConfig,
} from "@/types/chat";
import type { ProviderName } from "@/types/provider";
import type { RuntimeLanguage } from "@/types/runtime";
import { DEFAULT_CRITICS } from "@/config/critics";

interface ChatSettingsState {
  /* Token tier */
  selectedTier: TokenTier;
  setSelectedTier: (tier: TokenTier) => void;

  /* 360/Ecosystem config */
  ecosystemConfig: EcosystemConfig;
  setEcosystemProvider: (provider: ProviderName | null) => void;
  setEcosystemModel: (model: string) => void;
  setEcosystemLanguage: (language: RuntimeLanguage | "origem") => void;

  /* Critics */
  critics: CriticConfig[];
  toggleCritic: (type: CriticType) => void;
  setCriticGuidance: (type: CriticType, guidance: string) => void;
  getActiveCritics: () => CriticConfig[];
}

export const useChatSettingsStore = create<ChatSettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        selectedTier: "medium" as TokenTier,

        setSelectedTier: (tier) => set({ selectedTier: tier }),

        ecosystemConfig: {
          provider: null,
          model: "",
          language: "pt-BR" as RuntimeLanguage | "origem",
        },

        setEcosystemProvider: (provider) =>
          set((s) => ({
            ecosystemConfig: { ...s.ecosystemConfig, provider, model: "" },
          })),

        setEcosystemModel: (model) =>
          set((s) => ({
            ecosystemConfig: { ...s.ecosystemConfig, model },
          })),

        setEcosystemLanguage: (language) =>
          set((s) => ({
            ecosystemConfig: { ...s.ecosystemConfig, language },
          })),

        critics: DEFAULT_CRITICS,

        toggleCritic: (type) =>
          set((s) => ({
            critics: s.critics.map((c) =>
              c.type === type ? { ...c, enabled: !c.enabled } : c
            ),
          })),

        setCriticGuidance: (type, guidance) =>
          set((s) => ({
            critics: s.critics.map((c) =>
              c.type === type ? { ...c, guidance } : c
            ),
          })),

        getActiveCritics: () => get().critics.filter((c) => c.enabled),
      }),
      {
        name: "origem-chat-settings",
        partialize: (state) => ({
          selectedTier: state.selectedTier,
          ecosystemConfig: state.ecosystemConfig,
          critics: state.critics,
        }),
      }
    ),
    { name: "chat-settings-store" }
  )
);
