import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CalendarHeart,
  ClipboardList,
  Compass,
  FileText,
  MessageSquareHeart,
  Mic,
  Salad,
  Sparkles,
  UploadCloud,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Onboarding", icon: Sparkles },
  { to: "/home", label: "Mission Control", icon: Activity },
  { to: "/checkin", label: "Daily Check-in", icon: Mic },
  { to: "/upload", label: "Upload Records", icon: UploadCloud },
  { to: "/picture", label: "My Picture", icon: ClipboardList },
  { to: "/timeline", label: "Timeline", icon: CalendarHeart },
  { to: "/dossier", label: "My Dossier", icon: FileText },
  { to: "/coach", label: "Appointment Coach", icon: MessageSquareHeart },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/journey", label: "My Journey", icon: Compass },
] as const;

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: typeof Activity }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={[
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground/70 hover:bg-muted hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-medium tracking-tight">{label}</span>
    </Link>
  );
}

export function PrevyaShell({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1400px] gap-8 px-6 py-8">
        <aside className="sticky top-8 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col justify-between rounded-2xl border bg-sidebar/60 p-5 backdrop-blur lg:flex">
          <div>
            <Link to="/" className="mb-8 flex items-center gap-2 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="font-display text-lg font-semibold text-primary-foreground">P</span>
              </div>
              <div>
                <div className="font-display text-base font-semibold tracking-tight text-foreground">
                  Prevya
                </div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  Your advocate
                </div>
              </div>
            </Link>
            <nav className="flex flex-col gap-1">
              {nav.map((n) => (
                <NavItem key={n.to} to={n.to} label={n.label} Icon={n.icon} />
              ))}
            </nav>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                <UserRound className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">You</div>
                <div className="text-xs text-muted-foreground">Week 6 with Prevya</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
