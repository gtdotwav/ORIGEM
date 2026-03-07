import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const GH_API = "https://api.github.com";
const HEADERS = (token: string) => ({
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "ORIGEM-App",
});

function mapEvent(event: Record<string, unknown>): {
  type: string;
  repo: string;
  created_at: string;
  title: string;
} | null {
  const type = event.type as string;
  const repo = (event.repo as Record<string, string>)?.name ?? "";
  const created_at = (event.created_at as string) ?? "";
  const payload = event.payload as Record<string, unknown> | undefined;

  switch (type) {
    case "PushEvent": {
      const commits = (payload?.commits as Array<Record<string, string>>) ?? [];
      const msg = commits[commits.length - 1]?.message ?? "push";
      return { type, repo, created_at, title: msg.split("\n")[0] };
    }
    case "PullRequestEvent": {
      const pr = payload?.pull_request as Record<string, unknown> | undefined;
      const action = payload?.action as string;
      return { type, repo, created_at, title: `${action} PR: ${pr?.title ?? ""}` };
    }
    case "CreateEvent":
      return {
        type, repo, created_at,
        title: `created ${payload?.ref_type ?? "branch"} ${(payload?.ref as string) ?? ""}`,
      };
    case "IssuesEvent": {
      const issue = payload?.issue as Record<string, unknown> | undefined;
      return { type, repo, created_at, title: `${payload?.action ?? ""} issue: ${issue?.title ?? ""}` };
    }
    case "WatchEvent":
      return { type, repo, created_at, title: `starred ${repo}` };
    case "ForkEvent":
      return { type, repo, created_at, title: `forked ${repo}` };
    default:
      return null;
  }
}

export async function GET() {
  if (!auth) {
    return NextResponse.json({ connected: false });
  }

  const session = await auth();
  const accessToken = (session as unknown as Record<string, unknown>)
    ?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ connected: false });
  }

  try {
    const headers = HEADERS(accessToken);
    const userRes = await fetch(`${GH_API}/user`, { headers });

    if (!userRes.ok) {
      return NextResponse.json({ connected: false });
    }

    const user = await userRes.json();

    const [reposRes, eventsRes] = await Promise.all([
      fetch(`${GH_API}/user/repos?sort=updated&per_page=8&affiliation=owner`, { headers }),
      fetch(`${GH_API}/users/${user.login}/events?per_page=15`, { headers }),
    ]);

    const repos = reposRes.ok ? await reposRes.json() : [];
    const rawEvents = eventsRes.ok ? await eventsRes.json() : [];

    const activity = (rawEvents as Record<string, unknown>[])
      .map(mapEvent)
      .filter(Boolean)
      .slice(0, 10);

    return NextResponse.json({
      connected: true,
      user: { login: user.login, avatar_url: user.avatar_url, name: user.name },
      repos: (repos as Record<string, unknown>[]).map((r) => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        updated_at: r.updated_at,
        language: r.language,
        stargazers_count: r.stargazers_count,
      })),
      activity,
    });
  } catch (error) {
    console.error("[integrations/github] Error:", error);
    return NextResponse.json({ connected: false });
  }
}
