import type { AgentPersona } from "@/types/agent-task";
import type { Intent } from "@/types/decomposition";

export const AGENT_PERSONAS: AgentPersona[] = [
  {
    id: "mentor-negocios",
    name: "Mentor de Negocios",
    emoji: "\u{1F4BC}",
    role: "Estrategia e modelo de negocio",
    color: "orange",
    specialties: ["business", "strategy", "product", "marketing"],
  },
  {
    id: "professor-ia",
    name: "Professor IA",
    emoji: "\u{1F9D1}\u200D\u{1F393}",
    role: "Ensino e didatica de IA",
    color: "cyan",
    specialties: ["education", "ai", "tutorial", "explanation"],
  },
  {
    id: "criador-conteudo",
    name: "Criador de Conteudo",
    emoji: "\u{1F4AC}",
    role: "Texto, copy e marketing",
    color: "pink",
    specialties: ["content", "marketing", "writing", "copy"],
  },
  {
    id: "programador-ia",
    name: "Programador IA",
    emoji: "\u{1F9D1}\u200D\u{1F4BB}",
    role: "Codigo, debug e arquitetura",
    color: "green",
    specialties: ["code", "backend", "frontend", "debug", "architecture"],
  },
  {
    id: "psicologo-ia",
    name: "Psicologo IA",
    emoji: "\u{1F9E0}",
    role: "Comportamento e bem-estar",
    color: "purple",
    specialties: ["psychology", "behavior", "wellness", "emotional"],
  },
  {
    id: "criador-imagens",
    name: "Criador de Imagens",
    emoji: "\u{1F3A8}",
    role: "Design visual e imagens IA",
    color: "pink",
    specialties: ["image", "design", "visual", "art"],
  },
  {
    id: "criador-videos",
    name: "Criador de Videos",
    emoji: "\u{1F3AC}",
    role: "Video e producao audiovisual",
    color: "orange",
    specialties: ["video", "audio", "production", "media"],
  },
  {
    id: "companheiro-ia",
    name: "Companheiro IA",
    emoji: "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}",
    role: "Suporte emocional e conversa",
    color: "blue",
    specialties: ["companion", "emotional", "social", "chat"],
  },
];

const INTENT_PERSONA_MAP: Record<Intent, string[]> = {
  create: [
    "programador-ia",
    "mentor-negocios",
    "criador-conteudo",
    "criador-imagens",
  ],
  analyze: [
    "professor-ia",
    "psicologo-ia",
    "mentor-negocios",
  ],
  transform: [
    "programador-ia",
    "criador-conteudo",
    "criador-imagens",
  ],
  question: [
    "professor-ia",
    "psicologo-ia",
    "companheiro-ia",
  ],
  explore: [
    "professor-ia",
    "mentor-negocios",
    "criador-conteudo",
  ],
  fix: [
    "programador-ia",
    "professor-ia",
    "mentor-negocios",
  ],
  compare: [
    "professor-ia",
    "mentor-negocios",
    "psicologo-ia",
  ],
  summarize: [
    "criador-conteudo",
    "professor-ia",
    "mentor-negocios",
  ],
  design: [
    "criador-imagens",
    "programador-ia",
    "criador-videos",
    "criador-conteudo",
  ],
  execute: [
    "programador-ia",
    "mentor-negocios",
    "criador-conteudo",
    "criador-videos",
  ],
};

export function selectPersonasForIntent(intent: Intent): AgentPersona[] {
  const ids = INTENT_PERSONA_MAP[intent] ?? INTENT_PERSONA_MAP.question;
  return ids
    .map((id) => AGENT_PERSONAS.find((p) => p.id === id))
    .filter((p): p is AgentPersona => p !== undefined);
}

export function getPersonaById(id: string): AgentPersona | undefined {
  return AGENT_PERSONAS.find((p) => p.id === id);
}
