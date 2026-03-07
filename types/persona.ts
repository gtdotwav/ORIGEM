export type PersonaColor = "cyan" | "purple" | "green" | "orange" | "pink" | "blue";

export type ChatMode = "direct" | "ecosystem";

export interface Persona {
  id: string;
  name: string;
  iconId: string;
  description: string;
  systemPrompt: string;
  color: PersonaColor;
  greeting: string;
}

export interface PersonaChatMessage {
  id: string;
  personaId: string;
  role: "user" | "persona" | "system";
  content: string;
  mode: ChatMode;
  createdAt: string;
}

export interface PersonaChatSession {
  id: string;
  personaId: string;
  messages: PersonaChatMessage[];
  createdAt: string;
  updatedAt: string;
}
