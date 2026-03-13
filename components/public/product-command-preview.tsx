import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Code2,
  FolderKanban,
  PlugZap,
  Presentation,
  Search,
} from "lucide-react";

const PREVIEW_SURFACES = [
  {
    title: "Pesquisa ao vivo",
    description: "Posts, noticias e sinais conectados ao mesmo contexto.",
    icon: Search,
    tone: "border-cyan-400/20 bg-cyan-400/8",
  },
  {
    title: "Calendario",
    description: "Agenda transformada em blocos operacionais acionaveis.",
    icon: CalendarDays,
    tone: "border-green-400/20 bg-green-400/8",
  },
  {
    title: "Code",
    description: "Execucao tecnica saindo direto do comando principal.",
    icon: Code2,
    tone: "border-blue-400/20 bg-blue-400/8",
  },
  {
    title: "Slides",
    description: "Entregas visuais com o mesmo contexto e a mesma direcao.",
    icon: Presentation,
    tone: "border-purple-400/20 bg-purple-400/8",
  },
];

const PREVIEW_STATUS = [
  { label: "Contexto", value: "Workspace ativo · 3 conectores" },
  { label: "Runtime", value: "Provider ativo · modelo pronto" },
  { label: "Ferramentas", value: "12 ferramentas prontas" },
  { label: "Agenda", value: "4 blocos hoje" },
];

export function ProductCommandPreview() {
  return (
    <div className="mt-16 rounded-[34px] border border-white/[0.08] bg-black/42 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.62)] backdrop-blur-3xl sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
        <div className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/34">
                Preview do produto
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">
                Comando principal com contexto visivel.
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/48">
              <FolderKanban className="h-3.5 w-3.5 text-neon-cyan" />
              Workspace ativo
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-white/[0.08] bg-black/35 p-4">
            <p className="text-sm leading-8 text-white/88">
              Pesquise sinais, monte a agenda da semana, organize a execucao e entregue
              materiais sem quebrar o contexto entre uma etapa e outra.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {PREVIEW_STATUS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-white/76">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                  Entrada principal
                </p>
                <p className="mt-1 text-sm text-white/78">
                  Um comando, varias camadas operando juntas.
                </p>
              </div>
              <div className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black">
                Executar
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {PREVIEW_SURFACES.map((surface) => {
            const Icon = surface.icon;

            return (
              <div
                key={surface.title}
                className={`rounded-[26px] border p-5 text-left backdrop-blur-2xl ${surface.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                      Superficie
                    </p>
                    <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
                      {surface.title}
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-2.5 text-white/74">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/48">
                  {surface.description}
                </p>
              </div>
            );
          })}

          <Link
            href="/login"
            className="inline-flex items-center justify-between rounded-[26px] border border-white/[0.10] bg-white/[0.03] px-5 py-4 text-sm font-medium text-white/78 transition-all hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white"
          >
            Entrar e operar agora
            <PlugZap className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
