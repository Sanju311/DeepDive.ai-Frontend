"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../../../components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'

type Problem = {
  problem_number: number
  name: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | string
  description?: string
  functional_requirements?: string[]
  non_functional_requirements?: string[]
}

function DifficultyPill({ level }: { level: string }) {
  const color =
    level === 'easy'
      ? 'bg-emerald-600/80 text-white'
      : level === 'medium'
      ? 'bg-amber-600/80 text-white'
      : level === 'hard'
      ? 'bg-rose-600/80 text-white'
      : 'bg-zinc-700 text-zinc-200'
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-[2px] rounded-full text-[11px] font-semibold ${color}`}
    >
      {level}
    </span>
  )
}

function difficultyGlowClass(level: string): string {
  const l = (level || "").toString().trim().toLowerCase()
  if (l === "easy") return "bg-emerald-500"
  if (l === "medium") return "bg-amber-500"
  if (l === "hard") return "bg-rose-500"
  return "bg-zinc-400"
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Problem | null>(null)
  const router = useRouter()
  const { user } = useUser()

  const [search, setSearch] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'' | 'Easy' | 'Medium' | 'Hard'>('')
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(8)

  const containerRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/problems/get', { cache: 'no-store' })
        if (!res.ok) throw new Error(`failed: ${res.status}`)
        const data = (await res.json()) as Problem[]
        if (!cancelled) setProblems(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (!cancelled) setError('Failed to load problems')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return problems.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.problem_number).includes(q)
      const normalizedProblemDiff = (p.difficulty ?? "").toString().trim().toLowerCase()
      const activeDiff = (difficulty ?? "").toString().trim().toLowerCase()
      const matchesDiff = !difficulty || normalizedProblemDiff === activeDiff
      return matchesSearch && matchesDiff
    })
  }, [problems, search, difficulty])

  // Recalculate how many cards fit on screen (no overflow) and set pageSize accordingly
  useEffect(() => {
    const getColumnsForWidth = (width: number): number => {
      if (width >= 1280) return 4 // xl
      if (width >= 1024) return 3 // lg
      if (width >= 640) return 2  // sm
      return 1
    }
    const recalc = () => {
      const container = containerRef.current
      if (!container) return
      const topEl = topRef.current
      const bottomEl = bottomRef.current
      const gridEl = gridRef.current

      const containerHeight = container.clientHeight
      const topRectH = topEl ? topEl.getBoundingClientRect().height : 0
      const topMB = topEl ? parseFloat(getComputedStyle(topEl).marginBottom || '0') : 0
      const bottomRectH = bottomEl ? bottomEl.getBoundingClientRect().height : 0
      const bottomMT = bottomEl ? parseFloat(getComputedStyle(bottomEl).marginTop || '0') : 0

      const available = Math.max(0, containerHeight - (topRectH + topMB) - (bottomRectH + bottomMT))

      // Sample one card height from currently rendered grid
      const sampleCard = gridEl?.querySelector('[data-problem-card]') as HTMLElement | null
      const measuredCardHeight = sampleCard?.getBoundingClientRect().height
      const cardHeight = measuredCardHeight && Number.isFinite(measuredCardHeight) ? measuredCardHeight : 144

      // Read grid row gap
      let rowGap = 32
      if (gridEl) {
        const cs = getComputedStyle(gridEl)
        const g = parseFloat((cs.rowGap || cs.gap || '32').toString())
        if (Number.isFinite(g)) rowGap = g
      }

      const rows = Math.max(1, Math.floor((available + rowGap) / (cardHeight + rowGap)))
      const viewportWidth = window.innerWidth || container.clientWidth
      const cols = getColumnsForWidth(viewportWidth)
      const nextSize = Math.max(1, rows * cols)
      setPageSize((prev) => (prev !== nextSize ? nextSize : prev))
    }

    const handle = () => {
      // Use rAF to wait for layout after React commits
      requestAnimationFrame(recalc)
    }
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
    // Recompute if search/difficulty layout or loading state could affect top/bottom heights
  }, [search, difficulty, loading, error])

  // Keep current page within bounds when filters or pageSize change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize)))
    if (page >= totalPages) setPage(totalPages - 1)
  }, [filtered.length, pageSize, page])

  const totalPages = Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize)))
  const startIndex = Math.min(page * pageSize, Math.max(0, filtered.length - 1))
  const endIndex = Math.min(filtered.length, startIndex + pageSize)
  const pageItems = filtered.slice(startIndex, endIndex)

  return (
    <div className="p-8 h-screen overflow-hidden bg-background text-foreground">
      <div ref={containerRef} className="max-w-6xl mx-auto h-full flex flex-col">
        <div ref={topRef} className="mb-6 space-y-3">
          <h1 className="text-5xl ">Welcome back{user?.name ? `, ${user.name}` : ""}</h1>
          <p className="text-muted-foreground">Choose a problem below to mock interview. Use search and filters to narrow down.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center mb-6 mt-4">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by name, number, or category..."
              className="h-9 bg-background rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2 sm:ml-4">
            {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
              <Button
                key={lvl}
                variant="outline"
                size="sm"
                onClick={() => setDifficulty((prev) => (prev === lvl ? '' : lvl))}
                className={`border-border rounded-full px-4 ${
                  lvl === 'Easy'
                    ? (difficulty === 'Easy' ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'text-emerald-400')
                    : lvl === 'Medium'
                    ? (difficulty === 'Medium' ? 'bg-amber-600 text-white hover:bg-amber-600' : 'text-amber-400')
                    : (difficulty === 'Hard' ? 'bg-rose-600 text-white hover:bg-rose-600' : 'text-rose-400')
                }`}
              >
                {lvl}
              </Button>
            ))}
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading problems…</div>}
        {error && <div className="text-sm text-rose-400">{error}</div>}

        {!loading && !error && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 flex-1 overflow-visible items-start content-start">
            {pageItems.map((p) => (
              <Card
                key={`${p.problem_number}-${p.name}`}
                data-problem-card
                className="border-border bg-secondary/60 hover:bg-secondary/80 cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-xl"
                onClick={() => setSelected(p)}
              >

                <CardContent className="relative overflow-hidden p-4 h-32 sm:h-36 lg:h-40 xl:h-44">
                  <div className={`pointer-events-none absolute top-1 right-1 w-10 h-10 rounded-full blur-2xl mix-blend-screen ${difficultyGlowClass(p.difficulty)}`} aria-hidden />
                  <div className="flex items-start justify-between gap-3 h-10">
                    <div className="font-semibold">{p.problem_number}. {p.name}</div>
                    <DifficultyPill level={p.difficulty} />
                  </div >
                  {p.description && (
                    <div className=" mt-3 text-sm text-foreground/80 line-clamp-3">{p.description}</div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground">No problems match your filters.</div>
            )}
          </div>
        )}

        <div ref={bottomRef} className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filtered.length > 0 ? (
              <span>
                Showing {startIndex + 1}-{endIndex} of {filtered.length}
              </span>
            ) : (
              <span>No results</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm tabular-nums">
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="space-y-2 text-foreground/90">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between text-base ">
                    <span>{selected.problem_number}. {selected.name}</span>
                    <span className="relative inline-flex">
                      <span
                        className={`pointer-events-none absolute -inset-1 rounded-full ${difficultyGlowClass(String(selected.difficulty))} blur-md opacity-40`}
                        aria-hidden
                      />
                      <DifficultyPill level={selected.difficulty} />
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-1">
                  <div className="text-sm font-semibold">Description</div>
                  <DialogDescription className="whitespace-pre-line">
                      {selected.description}
                    </DialogDescription>
                </div>

                {Array.isArray(selected.functional_requirements) && selected.functional_requirements.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold mb-1">Functional Requirements</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {selected.functional_requirements.map((it, i) => (<li key={i}>{it}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(selected.non_functional_requirements) && selected.non_functional_requirements.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold mb-1">Non-Functional Requirements</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {selected.non_functional_requirements.map((it, i) => (<li key={i}>{it}</li>))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setSelected(null)}>Back</Button>
                  <Button
                    onClick={() => {
                      const num = selected?.problem_number
                      if (num != null) router.push(`/practice?problem_number=${encodeURIComponent(num)}`)
                    }}
                  >
                    Start
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


