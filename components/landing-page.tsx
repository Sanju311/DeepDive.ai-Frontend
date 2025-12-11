'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useCallback } from "react";
import {Blocks} from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

export default function LandingPage() {
  const iconRef = useRef<SVGSVGElement | null>(null);
  const router = useRouter();
  const autoplay = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  )
  const [emblaRef] = useEmblaCarousel({ loop: true }, [autoplay.current])
  const triggerSpin = useCallback(() => {
    const el = iconRef.current;
    if (!el) return;
    const anyEl: any = el as any;
    const running = typeof anyEl.getAnimations === "function" ? anyEl.getAnimations() : [];
    try {
      running.forEach((a: any) => a.cancel());
    } catch {}
    if (typeof anyEl.animate === "function") {
      anyEl.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
        { duration: 700, easing: "ease-out", fill: "forwards" }
      );
    } else {
      // fallback to CSS keyframes if WAAPI unavailable
      el.style.animation = "none";
      void (el as unknown as HTMLElement).offsetWidth;
      el.style.animation = "spin360 700ms ease-out forwards";
    }
  }, []);
  const scrollToDemo = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("demo");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);
  return (
    <main className="relative min-h-screen overflow-x-clip bg-gray-950 text-gray-100">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="orb orb4" />
        <div className="orb orb5" />
      </div>

      <div className="relative z-10">
        {/* Top Bar */}
        <header className="absolute inset-x-0 top-0 z-10">
          <div className="flex w-full items-center justify-between py-4 px-4 md:px-6">
            <div className="flex items-start gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <Blocks
                aria-hidden
                ref={iconRef}
                onMouseEnter={triggerSpin}
                className="h-6 w-6"
              />
              <span className="flex h-6 items-center text-sm font-semibold leading-none tracking-wide text-gray-200">
                DeepDive.ai
              </span>
            </div>
            <div>
              <Link
                href="/auth/login?returnTo=/home"
                className="inline-flex items-center rounded-md mt-2 text-white border-white border px-4 py-2 text-sm font-medium shadow-lg transition hover:scale-105"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 text-center">
          <h1 className="max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-6xl md:text-7xl">
            System Design Made Easy
          </h1>
          <p className="mt-5 max-w-xl text-base text-gray-300 sm:text-lg">
            Interview with context-aware voice agents, design interactive solutions, receive actionable feedback.
          </p>
          <div className="mt-8">
            <a
              href="https://www.loom.com/share/57322cc3263f456da590222e339e8b86"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md text-white border-white border px-6 py-3 text-sm font-medium shadow-lg transition hover:scale-105"
            >
              View Demo
            </a>
          </div>
        </section>

      {/* Demo Section */}
        <section id="demo" className="relative w-full min-h-screen border-gray-900 bg-transparent">
          <div className="mx-auto  xs:max-w-sm md:max-w-2xl lg:max-w-5xl flex flex-col justify-center gap-6 md:gap-8 lg:gap-10 px-6 py-8 md:py-12 lg:py-16">
            <div className="mx-auto w-full">
              {/* Embla Carousel */}
              <div
                className="overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border-2 border-white/10 shadow-2xl shadow-black/40"
                ref={emblaRef}
              >
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex-[0_0_100%]">
                      <img
                        src={`/carousel_pics/${n}.png`}
                        alt={`Demo preview ${n}`}
                        className="block w-full h-auto max-h-[40vh] sm:max-h-[50vh] md:max-h-[55vh] lg:max-h-[60vh] xl:max-h-[65vh] 2xl:max-h-[70vh] object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-xl p-6 bg-white/4 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/30 transition-transform duration-100 hover:scale-[1.02] hover:bg-white/6">
                <h3 className="text-base font-semibold text-white">
                  1. Clarification
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                The agent presents the problem along with the opportunity to clarify your understanding, the constraints and solution scope.
                </p>
              </div>
              <div className="rounded-xl p-6 bg-white/4 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/30 transition-transform duration-100 hover:scale-[1.02] hover:bg-white/6">
                <h3 className="text-base font-semibold text-white">
                  2. Diagram Design
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                Design your custom architecture in an intuitive drag & drop canvas that understands components & validates connections. 
                </p>
              </div>
              <div className="rounded-xl p-6 bg-white/4 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/30 transition-transform duration-100 hover:scale-[1.02] hover:bg-white/6">
                <h3 className="text-base font-semibold text-white">
                  3. Deep Dive
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                Experience a fully simulated technical interview as the agent drills into your design & challenges your reasoning.
                </p>
              </div>
              <div className="rounded-xl p-6 bg-white/4 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/30 transition-transform duration-100 hover:scale-[1.02] hover:bg-white/6">
                <h3 className="text-base font-semibold text-white">
                  4. Feedback
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                Receive a detailed performance evaluation across key rubric categories along with actionable feedback.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Footer - bottom right */}
      <footer className="fixed bottom-4 right-4 z-20">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <a
            href="https://portfolio-git-main-sanju311s-projects.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Built by <span className="">Sanju S.</span>
          </a>
          <a
            href="https://github.com/Sanju311"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-white transition-colors"
          >
            <img src="/github-icon.png" alt="GitHub" className="h-5 w-5 opacity-80 hover:opacity-100" />
          </a>
          <a
            href="https://www.linkedin.com/in/sanjusathya/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-white transition-colors"
          >
            <img src="/linkedin-icon.png" alt="LinkedIn" className="h-4 w-4 opacity-80 hover:opacity-100" />
          </a>
        </div>
      </footer>
    </main>
  )
}


