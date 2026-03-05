import { signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white/50 backdrop-blur-md transition-all hover:border-white/20 hover:text-white/70"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sair
      </button>
    </form>
  );
}
