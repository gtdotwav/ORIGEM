"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Github,
  LockKeyhole,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LoginMode = "sign-in" | "sign-up";

const PREVIEW_EMAIL = "preview@origem.local";
const PREVIEW_PASSWORD = "preview-access";

interface LoginShellProps {
  authReady: boolean;
  previewAccessAvailable: boolean;
  callbackUrl: string;
  bootstrap: boolean;
  registrationOpen: boolean;
  initialMode: LoginMode;
  initialError?: string | null;
  providers: {
    credentials: boolean;
    github: boolean;
    google: boolean;
  };
}

function mapAuthError(error?: string | null) {
  switch (error) {
    case "CredentialsSignin":
      return "Email ou senha invalidos.";
    case "OAuthSignin":
    case "OAuthCallbackError":
      return "Nao foi possivel concluir o login com o provedor externo.";
    case "OAuthEmailMissing":
      return "O provedor nao retornou um email valido.";
    case "RegistrationClosed":
      return "Novos acessos estao fechados. Entre com uma conta existente.";
    case "OAuthProvisioningFailed":
      return "Falha ao provisionar sua conta externa.";
    case "SessionRequired":
      return "Sua sessao expirou. Entre novamente.";
    default:
      return error ? "Nao foi possivel concluir a autenticacao." : null;
  }
}

function ProviderGlyph({ provider }: { provider: "google" | "github" }) {
  if (provider === "github") {
    return <Github className="h-4 w-4" />;
  }

  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[10px] font-semibold">
      G
    </span>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[12px] text-white/64">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 rounded-[14px] border-white/10 bg-black/18 pr-11 text-sm text-white placeholder:text-white/24 focus-visible:border-white/18 focus-visible:ring-white/8"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/34 transition-colors hover:text-white/60"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function LoginShell({
  authReady,
  previewAccessAvailable,
  callbackUrl,
  bootstrap,
  registrationOpen,
  initialMode,
  initialError,
  providers,
}: LoginShellProps) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [error, setError] = useState<string | null>(mapAuthError(initialError));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const oauthProviders = useMemo(
    () =>
      [
        providers.google ? ("google" as const) : null,
        providers.github ? ("github" as const) : null,
      ].filter((value): value is "google" | "github" => value !== null),
    [providers.github, providers.google]
  );

  const title = !authReady
    ? "Ativar acesso seguro"
    : bootstrap
    ? "Criar a conta inicial"
    : mode === "sign-up"
    ? "Criar conta"
    : "Entrar";

  const subtitle = !authReady
    ? "Falta apenas o segredo de autenticacao para liberar o login do ambiente."
    : bootstrap
    ? "O primeiro usuario entra como owner e inicializa o ambiente."
    : mode === "sign-up"
    ? "Abra seu acesso com nome, email e senha."
    : "Use email e senha para continuar no ORIGEM.";

  async function completeCredentialsSignIn(email: string, password: string) {
    const result = await signIn("credentials", {
      redirect: false,
      redirectTo: callbackUrl,
      email,
      password,
    });

    if (result?.error) {
      setError(mapAuthError(result.error));
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  function handleSignInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPendingAction("sign-in");

    startTransition(() => {
      void (async () => {
        try {
          await completeCredentialsSignIn(signInForm.email, signInForm.password);
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setPendingAction("sign-up");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: signUpForm.name,
              email: signUpForm.email,
              password: signUpForm.password,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

          if (!response.ok) {
            if (payload?.error === "email_already_in_use") {
              setError("Ja existe uma conta com este email.");
              return;
            }
            if (payload?.error === "registration_closed") {
              setError("Novos cadastros estao fechados neste ambiente.");
              return;
            }
            if (payload?.error === "invalid_body") {
              setError("Revise nome, email e senha. A senha exige 10+ caracteres, maiuscula, minuscula e numero.");
              return;
            }

            setError("Nao foi possivel criar sua conta agora.");
            return;
          }

          await completeCredentialsSignIn(signUpForm.email, signUpForm.password);
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function handleOAuth(provider: "google" | "github") {
    setError(null);
    setPendingAction(provider);
    void signIn(provider, { redirectTo: callbackUrl });
  }

  function handlePreviewAccess() {
    setError(null);
    setPendingAction("preview-access");

    startTransition(() => {
      void (async () => {
        try {
          const result = await signIn("credentials", {
            redirect: false,
            redirectTo: callbackUrl,
            email: PREVIEW_EMAIL,
            password: PREVIEW_PASSWORD,
            previewAccess: "1",
          });

          if (result?.error) {
            setError("Nao foi possivel abrir o modo preview agora.");
            return;
          }

          router.push(result?.url ?? callbackUrl);
          router.refresh();
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  if (!authReady) {
    return (
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/40">
            <ShieldCheck className="h-3.5 w-3.5" />
            Setup obrigatorio
          </div>

          <div className="space-y-2.5">
            <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white">{title}</h1>
            <p className="text-sm leading-6 text-white/50">{subtitle}</p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-black/28 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/34">
              Variavel necessaria
            </p>
            <code className="mt-3 block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/72">
              AUTH_SECRET=openssl rand -base64 32
            </code>
          </div>

          <p className="text-xs leading-6 text-white/38">
            Depois disso, o acesso por email e senha fica disponivel imediatamente.
            Google e GitHub continuam opcionais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:p-7">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div aria-hidden className="absolute inset-x-10 top-0 h-20 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_72%)] blur-3xl" />
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/40">
            {bootstrap ? <UserRoundPlus className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
            {bootstrap ? "Conta inicial" : "Acesso"}
          </div>

          <div className="space-y-2.5">
            <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white">{title}</h1>
            <p className="text-sm leading-6 text-white/50">{subtitle}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/72">
            {error}
          </div>
        ) : null}

        {previewAccessAvailable ? (
          <div className="rounded-[22px] border border-[rgba(208,186,143,0.18)] bg-[linear-gradient(180deg,rgba(208,186,143,0.09),rgba(208,186,143,0.03))] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e0cfad]/72">
                  Preview deployment
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
                  Entre direto no ambiente de preview para revisar o produto sem usar credenciais reais.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handlePreviewAccess}
                className="h-11 rounded-[14px] border-[rgba(208,186,143,0.18)] bg-black/20 px-4 text-white hover:border-[rgba(208,186,143,0.3)] hover:bg-[rgba(208,186,143,0.08)]"
              >
                {pendingAction === "preview-access" ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Entrar no preview
              </Button>
            </div>
          </div>
        ) : null}

        {registrationOpen ? (
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as LoginMode);
              setError(null);
            }}
            className="space-y-5"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-[18px] border border-white/10 bg-black/20 p-1">
              <TabsTrigger
                value="sign-in"
                className="rounded-xl border-0 text-sm text-white/48 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="sign-up"
                className="rounded-xl border-0 text-sm text-white/48 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
              >
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in">
              <form className="space-y-4" onSubmit={handleSignInSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="sign-in-email" className="text-[12px] text-white/64">
                    Email
                  </Label>
                  <Input
                    id="sign-in-email"
                    type="email"
                    value={signInForm.email}
                    onChange={(event) =>
                      setSignInForm((current) => ({ ...current, email: event.target.value }))
                    }
                    autoComplete="email"
                  placeholder="voce@empresa.com"
                    className="h-11 rounded-[14px] border-white/10 bg-black/18 text-sm text-white placeholder:text-white/24 focus-visible:border-white/18 focus-visible:ring-white/8"
                  />
                </div>

                <PasswordField
                  id="sign-in-password"
                  label="Senha"
                  value={signInForm.password}
                  onChange={(password) =>
                    setSignInForm((current) => ({ ...current, password }))
                  }
                  placeholder="Sua senha"
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 w-full rounded-[14px] border border-white/12 bg-white text-black hover:bg-white/92"
                >
                  {pendingAction === "sign-in" ? <Spinner className="h-4 w-4 text-black" /> : null}
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sign-up">
              <form className="space-y-4" onSubmit={handleSignUpSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="sign-up-name" className="text-[12px] text-white/64">
                    Nome
                  </Label>
                  <Input
                    id="sign-up-name"
                    value={signUpForm.name}
                    onChange={(event) =>
                      setSignUpForm((current) => ({ ...current, name: event.target.value }))
                    }
                    autoComplete="name"
                    placeholder="Seu nome"
                    className="h-11 rounded-[14px] border-white/10 bg-black/18 text-sm text-white placeholder:text-white/24 focus-visible:border-white/18 focus-visible:ring-white/8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sign-up-email" className="text-[12px] text-white/64">
                    Email
                  </Label>
                  <Input
                    id="sign-up-email"
                    type="email"
                    value={signUpForm.email}
                    onChange={(event) =>
                      setSignUpForm((current) => ({ ...current, email: event.target.value }))
                    }
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    className="h-11 rounded-[14px] border-white/10 bg-black/18 text-sm text-white placeholder:text-white/24 focus-visible:border-white/18 focus-visible:ring-white/8"
                  />
                </div>

                <PasswordField
                  id="sign-up-password"
                  label="Senha"
                  value={signUpForm.password}
                  onChange={(password) =>
                    setSignUpForm((current) => ({ ...current, password }))
                  }
                  placeholder="Minimo de 10 caracteres"
                  autoComplete="new-password"
                />

                <PasswordField
                  id="sign-up-confirm-password"
                  label="Confirmar senha"
                  value={signUpForm.confirmPassword}
                  onChange={(confirmPassword) =>
                    setSignUpForm((current) => ({ ...current, confirmPassword }))
                  }
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />

                <p className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3 text-[12px] leading-6 text-white/42">
                  A senha precisa ter 10+ caracteres, letra maiuscula, minuscula e numero.
                </p>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 w-full rounded-[14px] border border-white/12 bg-white text-black hover:bg-white/92"
                >
                  {pendingAction === "sign-up" ? <Spinner className="h-4 w-4 text-black" /> : null}
                  Criar conta
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <form className="space-y-4" onSubmit={handleSignInSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-in-email-closed" className="text-[12px] text-white/64">
                Email
              </Label>
              <Input
                id="sign-in-email-closed"
                type="email"
                value={signInForm.email}
                onChange={(event) =>
                  setSignInForm((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="email"
                placeholder="voce@empresa.com"
                className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/24 focus-visible:border-white/18 focus-visible:ring-white/8"
              />
            </div>

            <PasswordField
              id="sign-in-password-closed"
              label="Senha"
              value={signInForm.password}
              onChange={(password) =>
                setSignInForm((current) => ({ ...current, password }))
              }
              placeholder="Sua senha"
              autoComplete="current-password"
            />

            <p className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3 text-[12px] leading-6 text-white/42">
              Cadastro fechado neste ambiente. Apenas contas existentes podem entrar.
            </p>

            <Button
              type="submit"
              disabled={isPending}
              className="h-11 w-full rounded-[14px] border border-white/12 bg-white text-black hover:bg-white/92"
            >
              {pendingAction === "sign-in" ? <Spinner className="h-4 w-4 text-black" /> : null}
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        {oauthProviders.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-white/30">
                provedores opcionais
              </span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <div className={cn("grid gap-3", oauthProviders.length > 1 && "sm:grid-cols-2")}>
              {oauthProviders.map((provider) => (
                <Button
                  key={provider}
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleOAuth(provider)}
                  className="h-11 rounded-[14px] border-white/10 bg-white/[0.02] text-white/82 hover:bg-white/[0.05] hover:text-white"
                >
                  {pendingAction === provider ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <ProviderGlyph provider={provider} />
                  )}
                  {provider === "google" ? "Google" : "GitHub"}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
