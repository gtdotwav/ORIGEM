import { NextResponse } from "next/server";
import { MCP_SERVER_REGISTRY, getServersByCategory } from "@/config/mcp-registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");

  let servers = category ? getServersByCategory(category) : [...MCP_SERVER_REGISTRY];

  if (search) {
    const q = search.toLowerCase();
    servers = servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({ servers });
}
