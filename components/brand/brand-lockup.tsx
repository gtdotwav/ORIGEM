import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLockupSize = "nav" | "page" | "hero";
type BrandLockupAlign = "left" | "center";

const sizeMap: Record<
  BrandLockupSize,
  {
    shell: string;
    halo: string;
    image: string;
    imageSize: number;
    title: string;
    subtitle: string;
    description: string;
  }
> = {
  nav: {
    shell:
      "h-12 w-12 rounded-[1.4rem] border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
    halo: "blur-2xl opacity-80",
    image: "h-7 w-7",
    imageSize: 56,
    title: "text-[0.72rem] font-semibold uppercase tracking-[0.42em] text-white/58",
    subtitle: "text-xs text-white/46",
    description: "hidden",
  },
  page: {
    shell:
      "h-24 w-24 rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28",
    halo: "blur-3xl opacity-90",
    image: "h-14 w-14 sm:h-16 sm:w-16",
    imageSize: 128,
    title: "text-[0.78rem] font-semibold uppercase tracking-[0.48em] text-white/60 sm:text-[0.82rem]",
    subtitle: "text-sm text-white/50 sm:text-[15px]",
    description: "max-w-xl text-sm leading-7 text-white/46 sm:text-[15px]",
  },
  hero: {
    shell:
      "h-32 w-32 rounded-[2.4rem] border border-white/10 bg-white/[0.04] shadow-[0_40px_120px_rgba(0,0,0,0.55)] sm:h-36 sm:w-36 md:h-40 md:w-40",
    halo: "blur-[88px] opacity-100",
    image: "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28",
    imageSize: 192,
    title: "text-[0.82rem] font-semibold uppercase tracking-[0.56em] text-white/62 sm:text-[0.9rem]",
    subtitle: "text-sm text-white/50 sm:text-base",
    description: "max-w-2xl text-sm leading-7 text-white/48 sm:text-base sm:leading-8",
  },
};

export function BrandLockup({
  size = "page",
  align = "left",
  eyebrow,
  title = "ORIGEM",
  subtitle,
  description,
  className,
  priority = false,
}: {
  size?: BrandLockupSize;
  align?: BrandLockupAlign;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  priority?: boolean;
}) {
  const styles = sizeMap[size];
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        centered ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-white/42">
          {eyebrow}
        </span>
      ) : null}

      <div className="relative flex flex-col items-center gap-4">
        <div
          aria-hidden
          className={cn(
            "absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_45%,transparent_74%)]",
            styles.halo
          )}
        />
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden backdrop-blur-2xl",
            styles.shell
          )}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_40%,rgba(255,255,255,0.01)_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-[1px] rounded-[inherit] border border-white/6"
          />
          <Image
            src="/logo.png"
            alt="ORIGEM"
            width={styles.imageSize}
            height={styles.imageSize}
            priority={priority}
            className={cn("relative z-10 object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.16)]", styles.image)}
          />
        </div>
      </div>

      <div className={cn("flex flex-col gap-2", centered && "items-center")}>
        <div className={styles.title}>{title}</div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </div>
  );
}
