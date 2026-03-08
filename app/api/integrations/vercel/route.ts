import { NextResponse } from "next/server";

const VERCEL_API = "https://api.vercel.com";
const PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? "";
const TEAM_ID = process.env.VERCEL_TEAM_ID ?? "";

export async function GET() {
  const token = process.env.VERCEL_API_TOKEN;

  if (!token || !PROJECT_ID || !TEAM_ID) {
    return NextResponse.json({ connected: false, reason: "no_token" });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const [projectRes, deploymentsRes] = await Promise.all([
      fetch(`${VERCEL_API}/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`, { headers }),
      fetch(`${VERCEL_API}/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=5`, { headers }),
    ]);

    if (!projectRes.ok) {
      return NextResponse.json({ connected: false, reason: "api_error" });
    }

    const project = await projectRes.json();
    const deploymentsData = deploymentsRes.ok
      ? await deploymentsRes.json()
      : { deployments: [] };

    const domains: string[] = [];
    if (Array.isArray(project.alias)) {
      for (const d of project.alias) {
        if (typeof d === "string") domains.push(d);
      }
    }

    return NextResponse.json({
      connected: true,
      project: {
        name: project.name,
        framework: project.framework,
        domains: domains.slice(0, 3),
      },
      deployments: (deploymentsData.deployments as Record<string, unknown>[]).map(
        (d) => ({
          id: d.uid ?? d.id,
          state: d.state ?? d.readyState,
          url: d.url,
          createdAt: d.created ? new Date(d.created as number).toISOString() : "",
          commitMessage:
            (d.meta as Record<string, string>)?.githubCommitMessage?.split("\n")[0] ?? "",
          target: d.target ?? "preview",
        })
      ),
    });
  } catch (error) {
    console.error("[integrations/vercel] Error:", error);
    return NextResponse.json({ connected: false, reason: "fetch_error" });
  }
}
