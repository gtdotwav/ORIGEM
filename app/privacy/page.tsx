import Link from "next/link";
import { ChevronLeft, BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Politica de Privacidade — ORIGEM",
};

export default function PrivacyPage() {
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
          Politica de Privacidade
        </h1>
        <p className="mt-2 text-sm text-foreground/40">
          Ultima atualizacao: Março 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/60">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              1. Dados Coletados
            </h2>
            <p>
              Ao utilizar a ORIGEM, coletamos as seguintes informacoes:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/50">
              <li>Informacoes de perfil do provedor OAuth (nome, email, foto)</li>
              <li>Dados de uso da plataforma (workspaces, projetos, sessoes)</li>
              <li>Chaves de API criptografadas dos provedores de IA</li>
              <li>Logs de interacoes com agentes de IA</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              2. Como Usamos seus Dados
            </h2>
            <p>
              Seus dados sao utilizados exclusivamente para:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/50">
              <li>Fornecer e manter o servico da plataforma</li>
              <li>Autenticar e gerenciar sua conta</li>
              <li>Rotear requisicoes para os provedores de IA configurados</li>
              <li>Melhorar a experiencia do usuario</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              3. Seguranca dos Dados
            </h2>
            <p>
              Implementamos medidas rigorosas de seguranca:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/50">
              <li>Chaves de API protegidas com criptografia AES-256-GCM</li>
              <li>Autenticacao via OAuth 2.0 (GitHub, Google)</li>
              <li>Sessoes JWT com renovacao automatica</li>
              <li>Comunicacao HTTPS em todas as rotas</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              4. Armazenamento
            </h2>
            <p>
              Dados de configuracao da plataforma sao armazenados de forma segura
              utilizando Vercel Blob Storage com criptografia em repouso. Dados de
              sessao do navegador utilizam armazenamento local (localStorage) e sao
              mantidos apenas no seu dispositivo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              5. Provedores de IA
            </h2>
            <p>
              Quando voce interage com agentes de IA, suas mensagens sao enviadas
              diretamente ao provedor configurado (Anthropic, OpenAI, Google, etc.)
              usando suas proprias chaves de API. A ORIGEM atua como intermediario
              e nao armazena o conteudo das conversas nos nossos servidores.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              6. Compartilhamento
            </h2>
            <p>
              Nao vendemos, alugamos ou compartilhamos seus dados pessoais com
              terceiros, exceto quando necessario para operar o servico (provedores
              de infraestrutura) ou quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              7. Seus Direitos
            </h2>
            <p>Voce tem o direito de:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/50">
              <li>Acessar seus dados pessoais a qualquer momento</li>
              <li>Solicitar a correcao de informacoes incorretas</li>
              <li>Solicitar a exclusao completa da sua conta e dados</li>
              <li>Exportar seus dados em formato legivel</li>
              <li>Revogar o acesso OAuth a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              8. Cookies
            </h2>
            <p>
              Utilizamos cookies estritamente necessarios para autenticacao e
              preferencias de sessao. Nao utilizamos cookies de rastreamento ou
              publicidade.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              9. Alteracoes
            </h2>
            <p>
              Esta politica pode ser atualizada periodicamente. Notificaremos
              sobre alteracoes significativas atraves da plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground/80">
              10. Contato
            </h2>
            <p>
              Para questoes relacionadas a privacidade dos seus dados, entre em
              contato atraves da plataforma ou pelo email disponibilizado nas
              configuracoes da sua conta.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
