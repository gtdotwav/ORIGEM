export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/10 border-t-neon-cyan/70" />
        <p className="text-xs text-foreground/30">Carregando...</p>
      </div>
    </div>
  );
}
