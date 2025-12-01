"use client";
import Link from "next/link";
import { Blocks } from "lucide-react";
import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const iconRef = useRef<SVGSVGElement | null>(null);
  const triggerSpin = useCallback(() => {
    const el = iconRef.current;
    if (!el) return;
    const anyEl: any = el as any;
    const running = typeof anyEl.getAnimations === "function" ? anyEl.getAnimations() : [];
    try { running.forEach((a: any) => a.cancel()); } catch {}
    if (typeof anyEl.animate === "function") {
      anyEl.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
        { duration: 700, easing: "ease-out", fill: "forwards" }
      );
    } else {
      el.style.animation = "none";
      void (el as unknown as HTMLElement).offsetWidth;
      el.style.animation = "spin360 700ms ease-out forwards";
    }
  }, []);
  return (
    <main className="relative min-h-screen bg-gray-950 text-gray-100">
      {/* Background orbs (same as landing) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="orb orb4" />
        <div className="orb orb5" />
      </div>
      {/* Top Bar (same as landing) */}
      {/* Top Bar */}
        <header className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <Blocks
                aria-hidden
                ref={iconRef}
                onMouseEnter={triggerSpin}
                className="h-6 w-6"
              />
              <span className="flex h-6 items-center text-sm font-semibold leading-none tracking-wide text-gray-200 mt-0.5">
                Intervue.AI
              </span>
            </div>
            <div >
              <Link
                href="/login"
                aria-hidden
                className="invisible inline-flex items-center rounded-md text-white border-white border px-4 py-2 text-sm font-medium shadow-lg transition"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>
      <LoginForm />
    </main>
  )
}


