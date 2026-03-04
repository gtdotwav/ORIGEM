"use client";

import { useState } from "react";
import { Plus, Rocket, Globe, Image, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomAppStore } from "@/stores/custom-app-store";

function createId() {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppBuilderDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [intention, setIntention] = useState("");
  const [description, setDescription] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urls, setUrls] = useState("");
  const [media, setMedia] = useState("");
  const [sources, setSources] = useState("");

  const addApp = useCustomAppStore((s) => s.addApp);

  const canSubmit = name.trim() && intention.trim() && description.trim();

  function handleSubmit() {
    if (!canSubmit) return;

    const now = new Date().toISOString();
    addApp({
      id: createId(),
      name: name.trim(),
      intention: intention.trim(),
      description: description.trim(),
      advancedContext: showAdvanced
        ? {
            urls: urls
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            media: media
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            sources: sources
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : undefined,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    // Reset
    setName("");
    setIntention("");
    setDescription("");
    setShowAdvanced(false);
    setUrls("");
    setMedia("");
    setSources("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-full min-h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] bg-neutral-900/30 p-6 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <Plus className="h-5 w-5 text-neon-cyan" />
          </div>
          <p className="text-xs font-medium text-white/40">
            Desenvolver App
          </p>
        </button>
      </DialogTrigger>
      <DialogContent className="border-white/[0.08] bg-neutral-950/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Rocket className="h-4 w-4 text-neon-cyan" />
            Desenvolver Novo App
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/35">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Assistente de Vendas"
              className="w-full rounded-md border border-white/[0.08] bg-neutral-900 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/30"
            />
          </div>

          {/* Intention */}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/35">
              Intencao
            </label>
            <input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ex: Ajudar na qualificacao de leads"
              className="w-full rounded-md border border-white/[0.08] bg-neutral-900 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-white/35">
              Descricao
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que o app deve fazer, como e para quem..."
              rows={3}
              className="w-full rounded-md border border-white/[0.08] bg-neutral-900 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-neon-cyan/30 resize-none"
            />
          </div>

          {/* Advanced context toggle */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="advanced-ctx"
              checked={showAdvanced}
              onCheckedChange={(v) => setShowAdvanced(v === true)}
              className="border-white/20"
            />
            <label
              htmlFor="advanced-ctx"
              className="text-[11px] text-white/50 cursor-pointer"
            >
              Habilitar contexto avancado (sites, midias, fontes)
            </label>
          </div>

          {/* Advanced context fields */}
          {showAdvanced && (
            <div className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/35">
                  <Globe className="h-3 w-3" />
                  Sites / URLs
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="Cole links de sites relevantes (um por linha)..."
                  rows={2}
                  className="w-full rounded-md border border-white/[0.06] bg-neutral-900/50 px-3 py-2 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-neon-cyan/20 resize-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/35">
                  <Image className="h-3 w-3" />
                  Midias
                </label>
                <textarea
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                  placeholder="Referencias de midia, imagens, videos (um por linha)..."
                  rows={2}
                  className="w-full rounded-md border border-white/[0.06] bg-neutral-900/50 px-3 py-2 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-neon-cyan/20 resize-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/35">
                  <BookOpen className="h-3 w-3" />
                  Fontes
                </label>
                <textarea
                  value={sources}
                  onChange={(e) => setSources(e.target.value)}
                  placeholder="Fontes que fortalecem o contexto do app (um por linha)..."
                  rows={2}
                  className="w-full rounded-md border border-white/[0.06] bg-neutral-900/50 px-3 py-2 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-neon-cyan/20 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2 text-xs font-medium text-neon-cyan transition-all hover:border-neon-cyan/60 hover:bg-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Rocket className="h-3.5 w-3.5" />
            Criar App
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
