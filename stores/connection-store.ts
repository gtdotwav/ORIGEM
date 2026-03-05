import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Connection, ConnectionStatus, InviteLink } from "@/types/connection";

interface ConnectionState {
  connections: Connection[];
  inviteLinks: InviteLink[];

  addConnection: (data: Omit<Connection, "id" | "createdAt" | "updatedAt">) => Connection;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  removeConnection: (id: string) => void;
  acceptConnection: (id: string) => void;
  blockConnection: (id: string) => void;

  createInviteLink: (label?: string, maxUses?: number) => InviteLink;
  removeInviteLink: (id: string) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  devtools(
    persist(
      (set, get) => ({
        connections: [],
        inviteLinks: [],

        addConnection: (data) => {
          const connection: Connection = {
            ...data,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ connections: [...get().connections, connection] });
          return connection;
        },

        updateConnection: (id, updates) => {
          set({
            connections: get().connections.map((c) =>
              c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
            ),
          });
        },

        removeConnection: (id) => {
          set({ connections: get().connections.filter((c) => c.id !== id) });
        },

        acceptConnection: (id) => {
          set({
            connections: get().connections.map((c) =>
              c.id === id
                ? { ...c, status: "accepted" as ConnectionStatus, updatedAt: new Date().toISOString() }
                : c
            ),
          });
        },

        blockConnection: (id) => {
          set({
            connections: get().connections.map((c) =>
              c.id === id
                ? { ...c, status: "blocked" as ConnectionStatus, updatedAt: new Date().toISOString() }
                : c
            ),
          });
        },

        createInviteLink: (label, maxUses = 10) => {
          const link: InviteLink = {
            id: nanoid(),
            code: nanoid(12),
            label,
            maxUses,
            usedCount: 0,
            createdAt: new Date().toISOString(),
          };
          set({ inviteLinks: [...get().inviteLinks, link] });
          return link;
        },

        removeInviteLink: (id) => {
          set({ inviteLinks: get().inviteLinks.filter((l) => l.id !== id) });
        },
      }),
      {
        name: "origem-connections",
        partialize: (state) => ({
          connections: state.connections,
          inviteLinks: state.inviteLinks,
        }),
      }
    ),
    { name: "connection-store" }
  )
);

/** Get accepted connections */
export function getAcceptedConnections(): Connection[] {
  return useConnectionStore.getState().connections.filter((c) => c.status === "accepted");
}

/** Get pending connections */
export function getPendingConnections(): Connection[] {
  return useConnectionStore.getState().connections.filter((c) => c.status === "pending");
}

/** Get connections by workspace */
export function getConnectionsByWorkspace(workspaceId: string): Connection[] {
  return useConnectionStore
    .getState()
    .connections.filter((c) => c.workspaceId === workspaceId);
}
