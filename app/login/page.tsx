"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, GithubIcon, BrainCircuit } from "lucide-react";
import { Particles } from "@/components/ui/particles";

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
  </svg>
);

export default function LoginPage() {
  return (
    <div className="relative md:h-screen md:overflow-hidden w-full bg-background">
      <Particles
        color="#40E0D0"
        quantity={150}
        ease={20}
        size={0.5}
        className="absolute inset-0"
      />
      <div
        aria-hidden
        className="absolute inset-0 isolate -z-10 contain-strict"
      >
        <div className="absolute top-0 left-0 h-[1280px] w-[560px] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,oklch(0.78_0.15_195_/_0.08)_0%,oklch(0.65_0.25_290_/_0.03)_50%,oklch(0.78_0.15_195_/_0.01)_80%)]" />
        <div className="absolute top-0 left-0 h-[1280px] w-[240px] translate-x-[5%] -translate-y-[50%] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.65_0.25_290_/_0.06)_0%,oklch(0.65_0.25_290_/_0.01)_80%,transparent_100%)]" />
        <div className="absolute top-0 left-0 h-[1280px] w-[240px] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.78_0.15_195_/_0.05)_0%,oklch(0.78_0.15_195_/_0.01)_80%,transparent_100%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4">
        <Button variant="ghost" className="absolute top-4 left-4 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">
            <ChevronLeftIcon className="me-1 size-4" />
            Home
          </Link>
        </Button>

        <div className="mx-auto space-y-6 sm:w-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/10">
              <BrainCircuit className="size-5 text-neon-cyan" />
            </div>
            <p className="text-xl font-semibold tracking-tight">ORIGEM</p>
          </div>
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-bold tracking-wide">
              Entre ou Crie sua Conta
            </h1>
            <p className="text-muted-foreground text-base">
              Acesse a plataforma ORIGEM para gerenciar seus agentes de IA.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              className="w-full h-12 bg-white/[0.06] border border-white/[0.10] text-foreground hover:bg-white/[0.10] hover:border-white/[0.15] backdrop-blur-sm"
            >
              <GoogleIcon className="me-2 size-4" />
              Continuar com Google
            </Button>
            <Button
              type="button"
              size="lg"
              className="w-full h-12 bg-white/[0.06] border border-white/[0.10] text-foreground hover:bg-white/[0.10] hover:border-white/[0.15] backdrop-blur-sm"
            >
              <GithubIcon strokeWidth={2.5} className="me-2 size-4" />
              Continuar com GitHub
            </Button>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full h-12"
            asChild
          >
            <Link href="/dashboard">
              Acessar Dashboard
            </Link>
          </Button>
          <p className="text-muted-foreground mt-8 text-sm leading-relaxed">
            Ao continuar, voce concorda com nossos{" "}
            <a
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Termos de Servico
            </a>{" "}
            e{" "}
            <a
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Politica de Privacidade
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
