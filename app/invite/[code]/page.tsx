"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { useTourStore } from "@/stores/tour-store";

const PHRASES = [
  "Cada grande ideia comeca com alguem que acredita.",
  "Voce foi escolhido para fazer parte disso.",
  "Vamos construir juntos.",
];

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const setInviteContext = useTourStore((s) => s.setInviteContext);
  const resetTour = useTourStore((s) => s.resetTour);

  const [phase, setPhase] = useState<"enter" | "message" | "ready">("enter");
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Register invite context
  useEffect(() => {
    if (code) {
      setInviteContext(code);
      resetTour(); // Ensure tour plays for invited users
    }
  }, [code, setInviteContext, resetTour]);

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("message"), 2000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "message") return;
    const t2 = setTimeout(() => setPhase("ready"), 6500);
    return () => clearTimeout(t2);
  }, [phase]);

  // Phrase cycling
  useEffect(() => {
    if (phase !== "message") return;
    if (phraseIndex >= PHRASES.length - 1) return;
    const t = setTimeout(() => setPhraseIndex((i) => i + 1), 2000);
    return () => clearTimeout(t);
  }, [phase, phraseIndex]);

  const handleContinue = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.08_0_0)]">
      {/* Particle field */}
      <Particles
        color="#40E0D0"
        quantity={80}
        ease={40}
        size={0.4}
        className="absolute inset-0 opacity-60"
      />

      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.08_195_/_0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Phase 1 — Logo entrance */}
        <AnimatePresence mode="wait">
          {phase === "enter" && (
            <motion.div
              key="logo-enter"
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="relative"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/logo.png"
                  alt="ORIGEM"
                  width={100}
                  height={100}
                  className="pointer-events-none"
                />
                {/* Rings */}
                <motion.div
                  className="absolute -inset-6 rounded-full border border-white/[0.06]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 1 }}
                />
                <motion.div
                  className="absolute -inset-12 rounded-full border border-white/[0.03]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 1.2 }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Phase 2 — Message sequence */}
          {phase === "message" && (
            <motion.div
              key="messages"
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/logo.png"
                  alt="ORIGEM"
                  width={56}
                  height={56}
                  className="pointer-events-none opacity-60"
                />
              </motion.div>

              <div className="h-16 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phraseIndex}
                    className="max-w-sm text-lg font-light leading-relaxed text-white/60"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {PHRASES[phraseIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex gap-2">
                {PHRASES.map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full bg-white"
                    animate={{
                      width: i === phraseIndex ? 16 : 4,
                      height: 4,
                      opacity: i === phraseIndex ? 0.5 : 0.1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 3 — Welcome + CTA */}
          {phase === "ready" && (
            <motion.div
              key="ready"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Image
                  src="/logo.png"
                  alt="ORIGEM"
                  width={64}
                  height={64}
                  className="pointer-events-none"
                />
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h1 className="text-2xl font-semibold text-white/90">
                  Bem-vindo ao ORIGEM
                </h1>
                <p className="max-w-xs text-sm leading-relaxed text-white/35">
                  Obrigado por aceitar o convite. Estamos felizes em ter voce
                  nessa jornada de criacao e descoberta.
                </p>
              </motion.div>

              <motion.div
                className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <p className="text-xs text-white/25">
                  Seu convite esta ativo. Ao entrar, vamos te mostrar
                  como tudo funciona em poucos passos.
                </p>
              </motion.div>

              <motion.button
                type="button"
                onClick={handleContinue}
                className="mt-4 flex items-center gap-2 rounded-xl border border-neon-cyan/25 bg-neon-cyan/8 px-6 py-3 text-sm font-medium text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/15"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Entrar na plataforma
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <motion.p
                className="mt-2 text-[10px] text-white/15"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                ORIGEM — Psychosemantic AI Engine
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
