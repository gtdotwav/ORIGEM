import type { Message, Session } from "@/types/session";
import type { Project } from "@/types/project";
import type { FeedSearchContext } from "@/types/feed";
import type { Workspace } from "@/types/workspace";

const STOP_WORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "entre",
  "essa",
  "esse",
  "esta",
  "este",
  "isso",
  "mais",
  "mas",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "por",
  "pra",
  "que",
  "se",
  "sem",
  "ser",
  "sobre",
  "tema",
  "temas",
  "the",
  "this",
  "uma",
  "umas",
  "um",
  "uns",
  "and",
  "for",
  "with",
  "from",
  "into",
  "your",
  "you",
  "are",
  "was",
  "were",
  "will",
  "chat",
  "workspace",
  "workspaces",
  "origem",
]);

const GENERIC_TERMS = new Set(["workspace", "workspaces", "origem", "projeto", "projetos"]);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeWhitespace(value)
    .split(/[^0-9A-Za-zÀ-ÿ#+.-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !STOP_WORDS.has(normalizeToken(token)));
}

function addWeightedTerms(target: Map<string, number>, rawTerms: string[], weight: number) {
  for (const rawTerm of rawTerms) {
    const term = normalizeWhitespace(rawTerm);
    if (term.length < 3) {
      continue;
    }

    const normalized = normalizeToken(term);
    if (STOP_WORDS.has(normalized)) {
      continue;
    }

    target.set(term, (target.get(term) ?? 0) + weight);
  }
}

function addTextTerms(target: Map<string, number>, text: string, weight: number) {
  addWeightedTerms(target, tokenize(text), weight);
}

function buildSessionTerms(
  sessions: Session[],
  messages: Message[]
): string[] {
  const orderedSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4);

  const terms: string[] = [];

  for (const session of orderedSessions) {
    terms.push(session.title);

    const recentMessages = messages
      .filter(
        (message) =>
          message.sessionId === session.id && message.role === "user"
      )
      .slice(-3);

    for (const message of recentMessages) {
      terms.push(message.content.slice(0, 240));
    }
  }

  return terms;
}

function selectTopTerms(scoreMap: Map<string, number>, limit: number) {
  return [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([term]) => term)
    .filter((term, index, array) => {
      const normalized = normalizeToken(term);
      if (GENERIC_TERMS.has(normalized)) {
        return false;
      }

      return array.findIndex((candidate) => normalizeToken(candidate) === normalized) === index;
    })
    .slice(0, limit);
}

export function buildFeedContextFromWorkspace(params: {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  projects: Project[];
  sessions: Session[];
  messages: Message[];
}): FeedSearchContext {
  const { activeWorkspaceId, workspaces, projects, sessions, messages } = params;

  if (!activeWorkspaceId) {
    return {
      mode: "default",
      label: null,
      reason: null,
      topics: [],
    };
  }

  const workspace = workspaces.find((item) => item.id === activeWorkspaceId);
  if (!workspace) {
    return {
      mode: "default",
      label: null,
      reason: null,
      topics: [],
    };
  }

  const relatedProjects = projects.filter(
    (project) => project.workspaceId === workspace.id && project.status === "active"
  );
  const relatedSessions = sessions.filter(
    (session) => session.workspaceId === workspace.id
  );
  const relatedMessages = messages.filter((message) =>
    relatedSessions.some((session) => session.id === message.sessionId)
  );

  const scoreMap = new Map<string, number>();

  addWeightedTerms(scoreMap, [workspace.name], 4);
  addTextTerms(scoreMap, workspace.description, 4);

  for (const project of relatedProjects.slice(0, 6)) {
    addWeightedTerms(scoreMap, [project.name], 3);
    addTextTerms(scoreMap, project.description, 2);
    addWeightedTerms(scoreMap, project.tags, 4);
  }

  const sessionTerms = buildSessionTerms(relatedSessions, relatedMessages);
  for (const sessionTerm of sessionTerms) {
    addTextTerms(scoreMap, sessionTerm, 2);
  }

  const topics = selectTopTerms(scoreMap, 6);
  const reasonParts = [
    relatedProjects.length > 0
      ? `${relatedProjects.length} projeto${relatedProjects.length > 1 ? "s" : ""}`
      : null,
    relatedSessions.length > 0
      ? `${relatedSessions.length} sess${relatedSessions.length > 1 ? "oes" : "ao"}`
      : null,
  ].filter(Boolean);

  return {
    mode: "workspace",
    label: workspace.name,
    reason:
      reasonParts.length > 0
        ? `Baseado em ${reasonParts.join(" e ")} do workspace ativo`
        : "Baseado no contexto do workspace ativo",
    topics,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
  };
}

export const DEFAULT_FEED_QUERY = "inteligencia artificial produto design automacao software";
