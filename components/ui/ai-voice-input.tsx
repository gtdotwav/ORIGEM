"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 32,
  demoMode = false,
  demoInterval = 3000,
  className,
}: AIVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isDemo, setIsDemo] = useState(demoMode);
  const startedRef = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRecording) {
      if (!startedRef.current) {
        startedRef.current = true;
        onStart?.();
      }
      intervalId = setInterval(() => {
        setDuration((t) => t + 1);
      }, 1000);
    } else if (startedRef.current) {
      startedRef.current = false;
      onStop?.(duration);
      queueMicrotask(() => {
        setDuration(0);
      });
    }

    return () => clearInterval(intervalId);
  }, [isRecording, duration, onStart, onStop]);

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setIsRecording(true);
      timeoutId = setTimeout(() => {
        setIsRecording(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setIsRecording(false);
    } else {
      setIsRecording((prev) => !prev);
    }
  };

  if (isRecording) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={handleClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/15 transition-colors hover:bg-neon-cyan/25"
        >
          <div
            className="h-3 w-3 rounded-sm bg-neon-cyan animate-spin"
            style={{ animationDuration: "3s" }}
          />
        </button>

        <div className="flex h-5 items-center gap-px">
          {Array.from({ length: visualizerBars }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 rounded-full bg-neon-cyan/50 animate-pulse"
              style={{
                height: `${28 + ((i * 19) % 52)}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        <span className="font-mono text-[11px] text-neon-cyan/70">
          {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Clique para falar"
      className={cn(
        "rounded-lg p-2 text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground/50",
        className
      )}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}
