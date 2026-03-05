import { nanoid } from "nanoid";
import type { FeedItem } from "@/types/feed";

export function generateSeedFeedItems(): FeedItem[] {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  return [
    // --- NEWS ---
    {
      id: nanoid(),
      type: "news",
      title: "OpenAI revela GPT-5 com raciocínio em cadeia avançado",
      content:
        "A OpenAI apresentou oficialmente o GPT-5, modelo de linguagem com capacidade de raciocínio multi-etapa e integração nativa com ferramentas externas. O novo modelo demonstra performance 40% superior em benchmarks de código e matemática.",
      source: "TechCrunch",
      author: "Maria Fernandes",
      tags: ["ia", "openai", "gpt-5", "llm"],
      publishedAt: new Date(now - 2 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "news",
      title: "Anthropic lança Claude 4.5 com context window de 1M tokens",
      content:
        "A Anthropic anunciou o Claude 4.5, nova geração do seu modelo de IA com janela de contexto expandida para 1 milhão de tokens e melhorias significativas em seguir instruções complexas.",
      source: "The Verge",
      author: "Lucas Mendes",
      tags: ["ia", "anthropic", "claude", "llm"],
      publishedAt: new Date(now - 5 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "news",
      title: "Google DeepMind apresenta Gemini Ultra 2 com visão 3D",
      content:
        "O Google DeepMind revelou o Gemini Ultra 2, capaz de processar e gerar conteúdo 3D a partir de descrições textuais. A novidade posiciona o Google na liderança da IA multimodal.",
      source: "Wired",
      author: "Ana Costa",
      tags: ["ia", "google", "gemini", "3d", "multimodal"],
      publishedAt: new Date(now - 1 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "news",
      title: "Brasil anuncia marco regulatório para IA generativa",
      content:
        "O governo brasileiro publicou as diretrizes do novo marco regulatório para inteligência artificial generativa, incluindo requisitos de transparência, auditoria algorítmica e proteção de dados pessoais.",
      source: "Folha de S.Paulo",
      author: "Roberto Silva",
      tags: ["regulacao", "brasil", "ia", "legislacao"],
      publishedAt: new Date(now - 1.5 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "news",
      title: "Startups de agentes autônomos captam US$ 2.8 bi no Q1 2026",
      content:
        "O setor de agentes autônomos de IA registrou investimentos recordes no primeiro trimestre de 2026, com destaque para frameworks de orquestração multi-agente e ferramentas de automação empresarial.",
      source: "Bloomberg",
      author: "Carla Dias",
      tags: ["agentes", "investimento", "startups", "automacao"],
      publishedAt: new Date(now - 2 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },

    // --- TWEETS ---
    {
      id: nanoid(),
      type: "tweet",
      title: "@karpathy",
      content:
        "O futuro não é um modelo gigante. É uma orquestra de agentes especializados trabalhando em harmonia. Cada agente domina seu domínio. A inteligência emerge da colaboração.",
      source: "X",
      author: "Andrej Karpathy",
      tags: ["agentes", "orquestracao", "ia"],
      publishedAt: new Date(now - 3 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "tweet",
      title: "@ylecun",
      content:
        "LLMs são apenas o começo. A verdadeira revolução será quando sistemas de IA conseguirem aprender continuamente do mundo real, não apenas de texto estático. World models > language models.",
      source: "X",
      author: "Yann LeCun",
      tags: ["ia", "pesquisa", "world-models"],
      publishedAt: new Date(now - 8 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "tweet",
      title: "@levelsio",
      content:
        "Construí um SaaS inteiro com agentes de IA em 48h. Frontend, backend, deploy, marketing. O custo? $12 em tokens. Estamos vivendo no futuro e a maioria não percebeu.",
      source: "X",
      author: "Pieter Levels",
      tags: ["saas", "ia", "indie-hacker", "automacao"],
      publishedAt: new Date(now - 12 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "tweet",
      title: "@emaborges_dev",
      content:
        "Dica: se você está usando IA para código, não peça para ela 'escrever' — peça para ela 'pensar em voz alta' primeiro. A qualidade do output muda completamente. Chain-of-thought > prompt direto.",
      source: "X",
      author: "Emanuel Borges",
      tags: ["dica", "prompting", "desenvolvimento"],
      publishedAt: new Date(now - 1 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "tweet",
      title: "@raaborges",
      content:
        "O pipeline ORIGEM está absurdo. Decomposição semântica → agentes → grupos → orquestração. É como ter uma equipe inteira de especialistas rodando em paralelo. 🚀",
      source: "X",
      author: "Rafael Borges",
      tags: ["origem", "orquestracao", "agentes"],
      publishedAt: new Date(now - 6 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },

    // --- BLOG ---
    {
      id: nanoid(),
      type: "blog",
      title: "Como construir um sistema de orquestração multi-agente do zero",
      content:
        "Neste artigo, detalho a arquitetura por trás de um orquestrador multi-agente real: decomposição de contexto, roteamento inteligente, estratégias de consenso e agregação de resultados. Inclui exemplos em TypeScript.",
      source: "Dev.to",
      author: "Gabriel Andrade",
      tags: ["tutorial", "agentes", "orquestracao", "typescript"],
      publishedAt: new Date(now - 3 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "blog",
      title: "Zustand 5 + React 19: padrões avançados de estado global",
      content:
        "Exploramos os novos padrões do Zustand 5 com React 19, incluindo middleware de persistência, devtools, cross-store subscriptions e otimização de re-renders com selectors.",
      source: "Medium",
      author: "Juliana Rocha",
      tags: ["zustand", "react", "estado", "frontend"],
      publishedAt: new Date(now - 4 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "blog",
      title: "RAG vs Fine-tuning: quando usar cada abordagem em produção",
      content:
        "Uma análise prática comparando Retrieval-Augmented Generation e fine-tuning para aplicações empresariais. Métricas de custo, latência, precisão e manutenção de cada estratégia.",
      source: "Towards AI",
      author: "Pedro Lima",
      tags: ["rag", "fine-tuning", "producao", "ia"],
      publishedAt: new Date(now - 5 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "blog",
      title: "Design system com glassmorphism: tokens, elevação e micro-interações",
      content:
        "Como criar um design system moderno com efeitos de vidro, sistema de cores OKLCH, elevação por sombras e micro-interações com Motion 12. Guia completo com código.",
      source: "Smashing Magazine",
      author: "Lara Santos",
      tags: ["design", "glassmorphism", "css", "oklch"],
      publishedAt: new Date(now - 2 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "blog",
      title: "Next.js 16 em produção: lições aprendidas em 6 meses",
      content:
        "Compartilho as lições de usar Next.js 16 em produção: App Router, Server Components, streaming, cache, middleware e integração com Vercel. O que funcionou e o que evitar.",
      source: "Dev.to",
      author: "Thiago Oliveira",
      tags: ["nextjs", "producao", "react", "vercel"],
      publishedAt: new Date(now - 6 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },

    // --- ANNOUNCEMENTS ---
    {
      id: nanoid(),
      type: "announcement",
      title: "Vercel anuncia AI SDK 5.0 com suporte nativo a streaming de agentes",
      content:
        "O AI SDK 5.0 traz streaming bidirecional para agentes, integração com 15+ provedores de LLM, e um novo sistema de tools que simplifica a construção de pipelines complexos.",
      source: "Vercel Blog",
      author: "Vercel Team",
      tags: ["vercel", "ai-sdk", "agentes", "lancamento"],
      publishedAt: new Date(now - 4 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "announcement",
      title: "shadcn/ui v3 lançado com componentes de IA e data visualization",
      content:
        "A nova versão do shadcn/ui inclui componentes otimizados para interfaces de IA: chat bubbles, streaming indicators, tool result cards, e gráficos interativos com Recharts.",
      source: "shadcn",
      author: "shadcn",
      tags: ["shadcn", "ui", "componentes", "lancamento"],
      publishedAt: new Date(now - 1 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "announcement",
      title: "Tailwind CSS 5 entra em beta com OKLCH nativo e container queries",
      content:
        "O Tailwind CSS 5 beta traz suporte nativo a cores OKLCH, container queries sem plugin, e um novo sistema de temas dinâmicos que elimina a necessidade de CSS customizado para dark mode.",
      source: "Tailwind Labs",
      author: "Adam Wathan",
      tags: ["tailwind", "css", "oklch", "beta"],
      publishedAt: new Date(now - 3 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "announcement",
      title: "ORIGEM v2.0 — Pipeline 360º com orquestração visual",
      content:
        "Nova versão do ORIGEM com pipeline completo de decomposição semântica, roteamento de agentes, execução em grupo e canvas de orquestração visual. Inclui calendário inteligente e sistema de workspaces.",
      source: "ORIGEM",
      author: "Equipe ORIGEM",
      tags: ["origem", "lancamento", "orquestracao", "v2"],
      publishedAt: new Date(now - 10 * hour).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
    {
      id: nanoid(),
      type: "announcement",
      title: "React 19.1 corrige problemas de Suspense e melhora Server Components",
      content:
        "A atualização 19.1 do React resolve bugs críticos de Suspense boundaries, melhora o desempenho de Server Components e adiciona novas APIs para estado otimista em formulários.",
      source: "React Blog",
      author: "React Team",
      tags: ["react", "atualizacao", "server-components"],
      publishedAt: new Date(now - 5 * day).toISOString(),
      createdAt: new Date(now).toISOString(),
    },
  ];
}
