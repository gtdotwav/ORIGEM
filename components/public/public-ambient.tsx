import { cn } from "@/lib/utils";

export function PublicAmbient({
  variant = "page",
  className,
}: {
  variant?: "page" | "hero";
  className?: string;
}) {
  const hero = variant === "hero";

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,#090909_0%,#040404_56%,#010101_100%)]" />
      <div
        className={cn(
          "absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_38%,transparent_72%)]",
          hero ? "h-[760px] w-[760px] blur-[120px]" : "h-[560px] w-[560px] blur-[92px]"
        )}
      />
      <div
        className={cn(
          "absolute left-[12%] top-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_72%)]",
          hero ? "h-80 w-80 blur-[110px]" : "h-56 w-56 blur-[84px]"
        )}
      />
      <div
        className={cn(
          "absolute right-[10%] top-[16%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04)_0%,transparent_74%)]",
          hero ? "h-72 w-72 blur-[100px]" : "h-52 w-52 blur-[76px]"
        )}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.018)_0,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_100%),linear-gradient(180deg,rgba(255,255,255,0.012)_0,rgba(255,255,255,0.012)_1px,transparent_1px,transparent_100%)] bg-[size:120px_120px] opacity-[0.18]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.12)_70%,rgba(0,0,0,0.34)_100%)]" />
    </div>
  );
}
