import { Briefcase, GraduationCap, MessageSquare, Code, Brain, Paintbrush, Film, HeartHandshake, type LucideIcon } from "lucide-react";
import type { AgentPersona } from "@/types/agent-task";
import type { Intent } from "@/types/decomposition";

export const AGENT_PERSONA_ICONS: Record<string, LucideIcon> = {
  "mentor-negocios": Briefcase,
  "professor-ia": GraduationCap,
  "criador-conteudo": MessageSquare,
  "programador-ia": Code,
  "psicologo-ia": Brain,
  "criador-imagens": Paintbrush,
  "criador-videos": Film,
  "companheiro-ia": HeartHandshake,
};

export const AGENT_PERSONAS: AgentPersona[] = [
  {
    id: "mentor-negocios",
    name: "Mentor de Negocios",
    iconId: "mentor-negocios",
    role: "Estrategia e modelo de negocio",
    color: "orange",
    specialties: ["business", "strategy", "product", "marketing"],
  },
  {
    id: "professor-ia",
    name: "Professor IA",
    iconId: "professor-ia",
    role: "Ensino e didatica de IA",
    color: "cyan",
    specialties: ["education", "ai", "tutorial", "explanation"],
  },
  {
    id: "criador-conteudo",
    name: "Criador de Conteudo",
    iconId: "criador-conteudo",
    role: "Texto, copy e marketing",
    color: "pink",
    specialties: ["content", "marketing", "writing", "copy"],
  },
  {
    id: "programador-ia",
    name: "Programador IA",
    iconId: "programador-ia",
    role: "Codigo, debug e arquitetura",
    color: "green",
    specialties: ["code", "backend", "frontend", "debug", "architecture"],
  },
  {
    id: "psicologo-ia",
    name: "Psicologo IA",
    iconId: "psicologo-ia",
    role: "Comportamento e bem-estar",
    color: "purple",
    specialties: ["psychology", "behavior", "wellness", "emotional"],
  },
  {
    id: "criador-imagens",
    name: "Criador de Imagens",
    iconId: "criador-imagens",
    role: "Design visual e imagens IA",
    color: "pink",
    specialties: ["image", "design", "visual", "art"],
  },
  {
    id: "criador-videos",
    name: "Criador de Videos",
    iconId: "criador-videos",
    role: "Video e producao audiovisual",
    color: "orange",
    specialties: ["video", "audio", "production", "media"],
  },
  {
    id: "companheiro-ia",
    name: "Companheiro IA",
    iconId: "companheiro-ia",
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
