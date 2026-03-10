import type { MCPServerDefinition } from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Server Registry                                         */
/*  Official + Partner server definitions                              */
/* ------------------------------------------------------------------ */

export const MCP_SERVER_REGISTRY: MCPServerDefinition[] = [
  /* ─── Supported ─── */
  {
    id: "supabase",
    name: "Supabase",
    description: "Query a Supabase PostgREST endpoint with MCP tools",
    category: "data",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@supabase/mcp-server-postgrest"],
    requiredAuth: [
      {
        key: "SUPABASE_API_URL",
        label: "REST API URL",
        type: "url",
        description: "PostgREST endpoint, e.g. https://project.supabase.co/rest/v1",
        placeholder: "https://project.supabase.co/rest/v1",
        required: true,
      },
      {
        key: "SUPABASE_API_KEY",
        label: "API Key",
        type: "api_key",
        description: "Anon, service role, or user JWT for the PostgREST API",
        placeholder: "sb_secret_...",
        required: true,
      },
      {
        key: "SUPABASE_SCHEMA",
        label: "Schema",
        type: "api_key",
        description: "Optional Postgres schema exposed by PostgREST",
        placeholder: "public",
        required: false,
      },
    ],
    icon: "database",
    trust: "official",
    documentationUrl: "https://supabase.com/docs/guides/getting-started/mcp",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repositories, issues, pull requests, and code",
    category: "dev",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    requiredAuth: [
      { key: "GITHUB_PERSONAL_ACCESS_TOKEN", label: "Personal Access Token", type: "token", description: "GitHub PAT with repo scope", placeholder: "ghp_...", required: true },
    ],
    icon: "git-branch",
    trust: "official",
  },
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Read and write files in the current project workspace",
    category: "productivity",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem"],
    requiredAuth: [],
    icon: "folder",
    trust: "official",
  },

  /* ─── Partner ─── */
  {
    id: "slack",
    name: "Slack",
    description: "Send messages, read channels, manage workspaces",
    category: "comms",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    requiredAuth: [
      { key: "SLACK_BOT_TOKEN", label: "Bot Token", type: "token", description: "Slack bot OAuth token", placeholder: "xoxb-...", required: true },
      { key: "SLACK_TEAM_ID", label: "Team ID", type: "api_key", description: "Slack workspace team ID", placeholder: "T...", required: true },
    ],
    icon: "message-square",
    trust: "partner",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Pages, databases, and knowledge base management",
    category: "productivity",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@notionhq/notion-mcp-server"],
    requiredAuth: [
      {
        key: "NOTION_TOKEN",
        label: "Integration Token",
        type: "api_key",
        description: "Notion internal integration token",
        placeholder: "ntn_...",
        required: true,
      },
    ],
    icon: "book-open",
    trust: "partner",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments, subscriptions, customers, and invoices",
    category: "commerce",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@stripe/mcp"],
    requiredAuth: [
      { key: "STRIPE_SECRET_KEY", label: "Secret Key", type: "api_key", description: "Stripe secret key (sk_live or sk_test)", placeholder: "sk_...", required: true },
    ],
    icon: "credit-card",
    trust: "partner",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Issues, projects, cycles, and team workflows via Linear's remote MCP",
    category: "productivity",
    transport: "streamable-http",
    url: "https://mcp.linear.app/mcp",
    requiredAuth: [
      {
        key: "LINEAR_ACCESS_TOKEN",
        label: "API Key or OAuth Token",
        type: "token",
        description: "Sent as Authorization: Bearer <token> to the Linear MCP server",
        placeholder: "lin_api_...",
        required: true,
      },
    ],
    icon: "book-open",
    trust: "official",
    documentationUrl: "https://linear.app/docs/mcp",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design context and live UI capture through Figma's remote MCP server",
    category: "media",
    transport: "streamable-http",
    url: "https://mcp.figma.com/mcp",
    requiredAuth: [
      {
        key: "FIGMA_ACCESS_TOKEN",
        label: "Access Token",
        type: "token",
        description: "Bearer token used for the Figma MCP server",
        placeholder: "figd_...",
        required: true,
      },
    ],
    icon: "book-open",
    trust: "official",
    documentationUrl: "https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Projects, deployments, logs, and docs through Vercel MCP (client restrictions may apply)",
    category: "dev",
    transport: "streamable-http",
    url: "https://mcp.vercel.com",
    requiredAuth: [
      {
        key: "VERCEL_ACCESS_TOKEN",
        label: "Access Token",
        type: "token",
        description: "Bearer token for Vercel APIs and MCP requests",
        placeholder: "vca_...",
        required: true,
      },
    ],
    icon: "git-branch",
    trust: "official",
    documentationUrl: "https://vercel.com/docs/agent-resources/vercel-mcp",
  },
];

export function getServerDefinition(serverId: string): MCPServerDefinition | undefined {
  return MCP_SERVER_REGISTRY.find((s) => s.id === serverId);
}

export function getServersByCategory(category: string): MCPServerDefinition[] {
  return MCP_SERVER_REGISTRY.filter((s) => s.category === category);
}
