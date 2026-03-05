export type ConnectionStatus = "pending" | "accepted" | "blocked";

export interface Connection {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  title?: string;
  status: ConnectionStatus;
  direction: "sent" | "received";
  tags: string[];
  notes?: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLink {
  id: string;
  code: string;
  label?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
}
