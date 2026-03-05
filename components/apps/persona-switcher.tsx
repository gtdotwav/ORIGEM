"use client";

import { useState } from "react";
import { Check, ChevronDown, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePersonaStore } from "@/stores/persona-store";
import { CELEBRITY_PERSONAS, PERSONA_COLORS, PERSONA_ICONS } from "@/lib/personas";
import { cn } from "@/lib/utils";

export function PersonaSwitcher() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const setActivePersona = usePersonaStore((s) => s.setActivePersona);
  const [open, setOpen] = useState(false);

  const activePersona = CELEBRITY_PERSONAS.find((p) => p.id === activePersonaId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-card/80 px-3 py-2 text-sm backdrop-blur-xl transition-all hover:border-foreground/[0.15] hover:bg-card/90"
        >
          {activePersona ? (
            <>
              {(() => {
                const Icon = PERSONA_ICONS[activePersona.id];
                const colors = PERSONA_COLORS[activePersona.color];
                return Icon ? <Icon className={cn("h-4.5 w-4.5", colors.text)} /> : null;
              })()}
              <span className="max-w-[120px] truncate text-foreground/80">
                {activePersona.name}
              </span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4 text-foreground/40" />
              <span className="text-foreground/50">Escolher persona</span>
            </>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-foreground/30" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-foreground/[0.08] bg-card/95 p-2 backdrop-blur-xl"
      >
        <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-foreground/30">
          Escolha uma persona
        </p>

        {CELEBRITY_PERSONAS.map((persona) => {
          const colors = PERSONA_COLORS[persona.color];
          const isActive = activePersonaId === persona.id;

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => {
                setActivePersona(persona.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all hover:bg-foreground/[0.06]",
                isActive ? "bg-foreground/[0.04]" : ""
              )}
            >
              {(() => {
                const Icon = PERSONA_ICONS[persona.id];
                return Icon ? <Icon className={cn("h-5 w-5", colors.text)} /> : null;
              })()}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-foreground/90" : "text-foreground/70"
                    )}
                  >
                    {persona.name}
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      colors.bg
                    )}
                  />
                </div>
                <p className="truncate text-[10px] text-foreground/35">
                  {persona.description}
                </p>
              </div>
              {isActive && (
                <Check className="h-3.5 w-3.5 shrink-0 text-neon-cyan" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
