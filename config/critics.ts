import type { CriticConfig, CriticType } from "@/types/chat";

export const DEFAULT_CRITICS: CriticConfig[] = [
  {
    type: "logica",
    label: "Logica",
    description: "Verifica consistencia logica e coerencia",
    icon: "Brain",
    color: "neon-cyan",
    enabled: false,
    guidance: "",
  },
  {
    type: "clareza",
    label: "Clareza",
    description: "Garante comunicacao clara e compreensivel",
    icon: "Eye",
    color: "neon-green",
    enabled: false,
    guidance: "",
  },
  {
    type: "profundidade",
    label: "Profundidade",
    description: "Empurra para analise mais aprofundada",
    icon: "Layers",
    color: "neon-purple",
    enabled: false,
    guidance: "",
  },
  {
    type: "criatividade",
    label: "Criatividade",
    description: "Sugere alternativas e abordagens criativas",
    icon: "Lightbulb",
    color: "neon-orange",
    enabled: false,
    guidance: "",
  },
  {
    type: "precisao",
    label: "Precisao",
    description: "Verificacao de fatos e acuracia",
    icon: "Target",
    color: "neon-pink",
    enabled: false,
    guidance: "",
  },
];

export function buildCriticSystemPrompt(critic: CriticConfig): string {
  const basePrompts: Record<CriticType, string> = {
    logica:
      "Analise a resposta abaixo quanto a consistencia logica. Identifique falhas de raciocinio, contradicoes ou premissas frageis.",
    clareza:
      "Avalie a clareza da resposta abaixo. Identifique trechos confusos, ambiguos ou que poderiam ser simplificados.",
    profundidade:
      "Avalie se a resposta abaixo e suficientemente profunda e abrangente. Sugira areas que precisam de mais detalhe.",
    criatividade:
      "Avalie a resposta abaixo sob o aspecto criativo. Sugira alternativas, analogias ou abordagens inovadoras.",
    precisao:
      "Verifique a precisao factual da resposta abaixo. Identifique afirmacoes que podem ser imprecisas.",
  };

  let prompt = basePrompts[critic.type];
  if (critic.guidance.trim()) {
    prompt += `\n\nOrientacao adicional do usuario: ${critic.guidance}`;
  }
  prompt +=
    "\n\nResponda em portugues brasileiro. Formato: comece com VEREDITO: (Aprovado|Revisado|Sinalizado), depois sua analise breve, e finalmente o texto revisado se necessario (precedido de REVISAO:).";
  return prompt;
}
