"use client";

import { useState } from "react";
import { Plus, Rocket, Globe, Image, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
          className="flex h-full min-h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/[0.08] bg-card/30 p-6 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
            <Plus className="h-5 w-5 text-neon-cyan" />
          </div>
          <p className="text-xs font-medium text-foreground/40">
            Desenvolver App
          </p>
        </button>
      </DialogTrigger>
      <DialogContent className="border-foreground/[0.08] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-neon-cyan" />
            Desenvolver Novo App
          </DialogTitle>
          <DialogDescription>
            Configure um agente de IA com proposito especializado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Nome
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Assistente de Vendas"
              className="border-foreground/[0.08] bg-foreground/[0.04] text-sm text-foreground/90 placeholder:text-foreground/25"
            />
          </div>

          {/* Intention */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Intencao
            </label>
            <Input
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ex: Ajudar na qualificacao de leads"
              className="border-foreground/[0.08] bg-foreground/[0.04] text-sm text-foreground/90 placeholder:text-foreground/25"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/50">
              Descricao
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que o app deve fazer, como e para quem..."
              rows={3}
              className="min-h-[60px] resize-none border-foreground/[0.08] bg-foreground/[0.04] text-sm text-foreground/90 placeholder:text-foreground/25"
            />
          </div>

          {/* Advanced context toggle */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="advanced-ctx"
              checked={showAdvanced}
              onCheckedChange={(v) => setShowAdvanced(v === true)}
              className="border-foreground/20"
            />
            <label
              htmlFor="advanced-ctx"
              className="cursor-pointer text-xs text-foreground/50"
            >
              Habilitar contexto avancado (sites, midias, fontes)
            </label>
          </div>

          {/* Advanced context fields */}
          {showAdvanced && (
            <div className="dialog-section space-y-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-foreground/35">
                  <Globe className="h-3 w-3" />
                  Sites / URLs
                </label>
                <Textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="Cole links de sites relevantes (um por linha)..."
                  rows={2}
                  className="min-h-[48px] resize-none border-foreground/[0.06] bg-foreground/[0.03] text-[11px] text-foreground/70 placeholder:text-foreground/20"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-foreground/35">
                  <Image className="h-3 w-3" />
                  Midias
                </label>
                <Textarea
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                  placeholder="Referencias de midia, imagens, videos (um por linha)..."
                  rows={2}
                  className="min-h-[48px] resize-none border-foreground/[0.06] bg-foreground/[0.03] text-[11px] text-foreground/70 placeholder:text-foreground/20"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-foreground/35">
                  <BookOpen className="h-3 w-3" />
                  Fontes
                </label>
                <Textarea
                  value={sources}
                  onChange={(e) => setSources(e.target.value)}
                  placeholder="Fontes que fortalecem o contexto do app (um por linha)..."
                  rows={2}
                  className="min-h-[48px] resize-none border-foreground/[0.06] bg-foreground/[0.03] text-[11px] text-foreground/70 placeholder:text-foreground/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-xs text-foreground/50 hover:text-foreground/70"
          >
            Cancelar
          </Button>
          <Button
            variant="neon"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            <Rocket className="h-3.5 w-3.5" />
            Criar App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
