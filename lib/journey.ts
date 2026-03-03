import type { JourneyStepKey } from "@/types/runtime";

export interface JourneyStepDescriptor {
  key: JourneyStepKey;
  label: string;
  description: string;
  cta: string;
  href: (sessionId: string) => string;
}

export const JOURNEY_STEPS: JourneyStepDescriptor[] = [
  {
    key: "contexts",
    label: "Contextos",
    description: "Mapear intencao, dominio e requisitos semanticos.",
    cta: "Abrir Contextos",
    href: () => "/dashboard/contexts",
  },
  {
    key: "agents",
    label: "Agentes",
    description: "Selecionar e ajustar os agentes responsaveis por cada funcao.",
    cta: "Abrir Agentes",
    href: () => "/dashboard/agents",
  },
  {
    key: "projects",
    label: "Projetos",
    description: "Consolidar a estrategia em um projeto executavel.",
    cta: "Abrir Projetos",
    href: () => "/dashboard/projects",
  },
  {
    key: "groups",
    label: "Grupos",
    description: "Definir como os agentes colaboram em paralelo/sequencia.",
    cta: "Abrir Grupos",
    href: () => "/dashboard/groups",
  },
  {
    key: "flows",
    label: "Fluxos",
    description: "Ativar pipeline de execucao e checkpoints da engrenagem.",
    cta: "Abrir Fluxos",
    href: () => "/dashboard/flows",
  },
  {
    key: "orchestra",
    label: "Orquestra",
    description: "Visualizar e rodar a orquestracao completa no canvas.",
    cta: "Abrir Orquestra",
    href: (sessionId) => `/dashboard/orchestra/${sessionId}`,
  },
];

export const JOURNEY_ORDER = JOURNEY_STEPS.map((step) => step.key);

export function getJourneyStepDescriptor(key: JourneyStepKey) {
  return JOURNEY_STEPS.find((step) => step.key === key);
}
