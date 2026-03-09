import type { MCPServerDefinition } from "@/types/mcp";

/* ------------------------------------------------------------------ */
/*  ORIGEM MCP Server Registry                                         */
/*  Official + Partner server definitions                              */
/* ------------------------------------------------------------------ */

export const MCP_SERVER_REGISTRY: MCPServerDefinition[] = [
  /* ─── Official ─── */
  {
    id: "supabase",
    name: "Supabase",
    description: "Database, auth, storage and edge functions",
    category: "data",
    transport: "streamable-http",
    requiredAuth: [
      { key: "SUPABASE_URL", label: "Project URL", type: "url", description: "Your Supabase project URL", placeholder: "https://xxx.supabase.co", required: true },
      { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Service Role Key", type: "api_key", description: "Service role key (not anon)", placeholder: "eyJ...", required: true },
    ],
    icon: "database",
    trust: "official",
    documentationUrl: "https://supabase.com/docs",
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
    description: "Read and write files on the local filesystem",
    category: "productivity",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/origem"],
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
      { key: "NOTION_API_KEY", label: "Integration Token", type: "api_key", description: "Notion internal integration token", placeholder: "ntn_...", required: true },
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
    id: "google-drive",
    name: "Google Drive",
    description: "Files, folders, and document management",
    category: "productivity",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic/mcp-server-google-drive"],
    requiredAuth: [
      { key: "GOOGLE_CLIENT_ID", label: "Client ID", type: "api_key", description: "Google OAuth client ID", required: true },
      { key: "GOOGLE_CLIENT_SECRET", label: "Client Secret", type: "api_key", description: "Google OAuth client secret", required: true },
    ],
    icon: "hard-drive",
    trust: "partner",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Products, orders, customers, and store management",
    category: "commerce",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@shopify/mcp-server"],
    requiredAuth: [
      { key: "SHOPIFY_ACCESS_TOKEN", label: "Access Token", type: "token", description: "Shopify Admin API access token", placeholder: "shpat_...", required: true },
      { key: "SHOPIFY_STORE_URL", label: "Store URL", type: "url", description: "Your Shopify store URL", placeholder: "mystore.myshopify.com", required: true },
    ],
    icon: "shopping-bag",
    trust: "partner",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deployments, projects, domains, and logs",
    category: "dev",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@vercel/mcp"],
    requiredAuth: [
      { key: "VERCEL_API_TOKEN", label: "API Token", type: "token", description: "Vercel personal access token", required: true },
    ],
    icon: "triangle",
    trust: "partner",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Issues, projects, cycles, and team management",
    category: "productivity",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@linear/mcp-server"],
    requiredAuth: [
      { key: "LINEAR_API_KEY", label: "API Key", type: "api_key", description: "Linear personal API key", required: true },
    ],
    icon: "layout-list",
    trust: "partner",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design files, components, and collaboration",
    category: "media",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic/mcp-server-figma"],
    requiredAuth: [
      { key: "FIGMA_ACCESS_TOKEN", label: "Access Token", type: "token", description: "Figma personal access token", required: true },
    ],
    icon: "pen-tool",
    trust: "partner",
  },
];

export function getServerDefinition(serverId: string): MCPServerDefinition | undefined {
  return MCP_SERVER_REGISTRY.find((s) => s.id === serverId);
}

export function getServersByCategory(category: string): MCPServerDefinition[] {
  return MCP_SERVER_REGISTRY.filter((s) => s.category === category);
}
