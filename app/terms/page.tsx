import Link from "next/link";
import { ChevronLeft, BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Termos de Uso — ORIGEM",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-6 py-4">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-foreground/40 transition-colors hover:text-foreground/70"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neon-cyan/20 bg-neon-cyan/10">
            <BrainCircuit className="h-3.5 w-3.5 text-neon-cyan" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground/70">ORIGEM</span>
        </Link>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-foreground/40">
          Ultima atualizacao: Março 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/60">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              1. Aceitacao dos Termos
            </h2>
            <p>
              Ao acessar e utilizar a plataforma ORIGEM, voce concorda com estes
              Termos de Uso. Se nao concordar com qualquer parte destes termos,
              nao utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              2. Descricao do Servico
            </h2>
            <p>
              A ORIGEM e uma plataforma de orquestracao de inteligencia artificial
              que permite criar, gerenciar e conectar agentes de IA atraves de
              workspaces, projetos e conectores MCP. O servico inclui acesso a
              multiplos provedores de modelos de linguagem.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              3. Conta e Acesso
            </h2>
            <p>
              Voce e responsavel por manter a seguranca de sua conta e por todas
              as atividades realizadas sob suas credenciais. Notifique-nos
              imediatamente sobre qualquer uso nao autorizado.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              4. Uso Aceitavel
            </h2>
            <p>
              Voce concorda em nao utilizar a plataforma para atividades ilegais,
              abusivas ou que violem direitos de terceiros. O uso de agentes de IA
              deve respeitar as politicas de uso de cada provedor de modelo
              conectado.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              5. Propriedade Intelectual
            </h2>
            <p>
              O conteudo gerado atraves da plataforma pertence ao usuario, sujeito
              aos termos dos provedores de IA utilizados. A marca ORIGEM, interface
              e tecnologia da plataforma sao propriedade exclusiva da ORIGEM.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              6. Chaves de API
            </h2>
            <p>
              Suas chaves de API sao armazenadas com criptografia AES-256-GCM.
              Voce e responsavel pelo uso e custos associados as suas chaves. A
              ORIGEM nao se responsabiliza por cobranças geradas pelo uso de APIs
              de terceiros.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              7. Limitacao de Responsabilidade
            </h2>
            <p>
              A plataforma e fornecida &ldquo;como esta&rdquo;. Nao garantimos
              disponibilidade ininterrupta ou que os resultados gerados por IA
              serao precisos. O uso e por sua conta e risco.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              8. Alteracoes nos Termos
            </h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento.
              Alteracoes significativas serao notificadas por email ou na
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              9. Contato
            </h2>
            <p>
              Para duvidas sobre estes termos, entre em contato atraves da
              plataforma ou pelo email disponibilizado nas configuracoes.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
