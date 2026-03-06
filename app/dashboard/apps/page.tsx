"use client";

import { Sparkles, Trash2, Drama, Rocket, Code2, Presentation } from "lucide-react";
import { AppCard } from "@/components/apps/app-card";
import { AppBuilderDialog } from "@/components/apps/app-builder-dialog";
import { useCustomAppStore } from "@/stores/custom-app-store";

const STATUS_BADGE: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
};

export default function AppsPage() {
  const customApps = useCustomAppStore((s) => s.apps);
  const removeApp = useCustomAppStore((s) => s.removeApp);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
          <Sparkles className="h-5 w-5 text-neon-cyan" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Apps</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Experiencias especializadas com IA — agentes unicos para criar
            diferencial e engajamento
          </p>
        </div>
      </div>

      {/* Apps grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard
          title="Code"
          description="Explore e acompanhe arquivos do seu projeto em tempo real. Conecte um agente de codigo para analise e edicao inteligente."
          icon={Code2}
          color="green"
          href="/dashboard/apps/code"
          badge="Novo"
        />

        <AppCard
          title="Slides"
          description="Crie apresentacoes profissionais com temas e layouts variados. Edite slides visualmente com titulos, conteudo, citacoes e mais."
          icon={Presentation}
          color="orange"
          href="/dashboard/apps/slides"
          badge="Novo"
        />

        <AppCard
          title="Converse com uma Celebridade IA"
          description="Escolha uma persona historica e converse com ela. A IA responde em personagem, usando analise psicossemantica para criar uma experiencia didatica e imersiva."
          icon={Drama}
          color="purple"
          href="/dashboard/apps/celebrity-chat"
          badge="Novo"
        />

        {/* Custom apps */}
        {customApps.map((app) => (
          <div
            key={app.id}
            className="group relative rounded-2xl border border-foreground/[0.08] bg-card/70 p-6 backdrop-blur-xl transition-all hover:border-foreground/[0.15]"
          >
            <button
              type="button"
              onClick={() => removeApp(app.id)}
              className="absolute right-3 top-3 rounded-md p-1 text-foreground/15 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              title="Remover app"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-neon-cyan" />
              <span className="rounded-md border border-neon-cyan/25 bg-neon-cyan/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-neon-cyan">
                {STATUS_BADGE[app.status] ?? app.status}
              </span>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground/90">
              {app.name}
            </h3>
            <p className="mb-2 text-[11px] text-neon-cyan/70">
              {app.intention}
            </p>
            <p className="text-xs text-foreground/40 line-clamp-2">
              {app.description}
            </p>
            {app.advancedContext && (
              <div className="mt-2 flex gap-2">
                {app.advancedContext.urls.length > 0 && (
                  <span className="text-[9px] text-foreground/25">
                    {app.advancedContext.urls.length} sites
                  </span>
                )}
                {app.advancedContext.media.length > 0 && (
                  <span className="text-[9px] text-foreground/25">
                    {app.advancedContext.media.length} midias
                  </span>
                )}
                {app.advancedContext.sources.length > 0 && (
                  <span className="text-[9px] text-foreground/25">
                    {app.advancedContext.sources.length} fontes
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Builder trigger */}
        <AppBuilderDialog />
      </div>
    </div>
  );
}
