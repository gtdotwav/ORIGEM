export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
}

export interface GitHubActivity {
  type: string;
  repo: string;
  created_at: string;
  title: string;
}

export interface GitHubIntegration {
  connected: boolean;
  user?: GitHubUser;
  repos?: GitHubRepo[];
  activity?: GitHubActivity[];
}

export interface VercelDeployment {
  id: string;
  state: string;
  url: string;
  createdAt: string;
  commitMessage: string;
  target: string;
}

export interface VercelProject {
  name: string;
  framework: string;
  domains: string[];
}

export interface VercelIntegration {
  connected: boolean;
  reason?: string;
  project?: VercelProject;
  deployments?: VercelDeployment[];
}
