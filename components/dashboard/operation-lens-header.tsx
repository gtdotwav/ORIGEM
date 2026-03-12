"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Clock3, Sparkles } from "lucide-react";

interface OperationLensMetaItem {
  label: string;
  value: string;
}

interface OperationLensHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
  supportingCopy?: string;
  iconClassName?: string;
  sessionTitle?: string | null;
  updatedAtLabel?: string | null;
  meta?: OperationLensMetaItem[];
}

export function OperationLensHeader({
  icon: Icon,
  title,
  description,
  actions,
  eyebrow = "Visao derivada da operacao",
  supportingCopy = "Tudo aqui responde a mesma sessao, ao mesmo contexto e as mesmas decisoes registradas no chat.",
  iconClassName = "text-neon-cyan",
  sessionTitle,
  updatedAtLabel,
  meta = [],
}: OperationLensHeaderProps) {
  const details = [
    sessionTitle ? { label: "Sessao", value: sessionTitle } : null,
    updatedAtLabel ? { label: "Atualizada", value: updatedAtLabel } : null,
    ...meta,
  ].filter((item): item is OperationLensMetaItem => Boolean(item));

  return (
    <div className="mb-6 rounded-[28px] border border-foreground/[0.08] bg-card/72 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.10] bg-foreground/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground/48">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04]">
              <Icon className={`h-5 w-5 ${iconClassName}`} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground/55">
                {description}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-foreground/45">
            {supportingCopy}
          </p>

          {details.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {details.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.10] bg-black/20 px-3 py-1.5 text-[11px] text-foreground/62"
                >
                  <Clock3 className="h-3 w-3 text-foreground/35" />
                  <span className="text-foreground/35">{item.label}</span>
                  <span className="max-w-[220px] truncate text-foreground/78">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
