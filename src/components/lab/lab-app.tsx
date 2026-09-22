import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAPTERS, type ChapterId } from "./chapters";
import { ChIntro } from "./ch-intro";
import { ChDecomp } from "./ch-decomp";
import { ChStl } from "./ch-stl";
import { ChStationarity } from "./ch-stationarity";
import { ChNoise } from "./ch-noise";
import { ChModels } from "./ch-models";
import { ChSmooth } from "./ch-smooth";
import { ChGranger } from "./ch-granger";
import { ChAcf } from "./ch-acf";
import { ChEval } from "./ch-eval";

function ChapterBody({ id }: { id: ChapterId }) {
  switch (id) {
    case 1:
      return <ChIntro />;
    case 2:
      return <ChDecomp />;
    case 3:
      return <ChStl />;
    case 4:
      return <ChStationarity />;
    case 5:
      return <ChNoise />;
    case 6:
      return <ChModels />;
    case 7:
      return <ChSmooth />;
    case 8:
      return <ChGranger />;
    case 9:
      return <ChAcf />;
    case 10:
      return <ChEval />;
    default:
      return <ChIntro />;
  }
}

function readHash(): ChapterId {
  if (typeof window === "undefined") return 1;
  const n = Number(window.location.hash.replace(/\D/g, ""));
  if (n >= 1 && n <= 10) return n as ChapterId;
  return 1;
}

export function LabApp() {
  const [id, setId] = useState<ChapterId>(1);
  const [open, setOpen] = useState(false);
  const current = CHAPTERS.find((c) => c.id === id)!;

  useEffect(() => {
    setId(readHash());
    const onHash = () => setId(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (next: ChapterId) => {
    setId(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${next}`);
    }
    setOpen(false);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">A workshop</p>
            <h1 className="font-display text-2xl leading-none sm:text-3xl">The Time Cut</h1>
          </div>
          <p className="hidden max-w-sm text-right text-xs text-muted-foreground md:block">
            Never shuffle time. Train on the earlier part, test on the later part.
          </p>
          <Button
            variant="outline"
            className="h-11 shrink-0 px-3 lg:hidden"
            aria-label="Open chapters"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
            <span className="font-mono text-[11px] tabular-nums">{String(id).padStart(2, "0")}</span>
            <span>Chapters</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-r border-border p-3 lg:block">
          <nav className="space-y-0.5" aria-label="Chapters">
            {CHAPTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go(c.id)}
                className={cn(
                  "flex min-h-11 w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors duration-150",
                  id === c.id ? "bg-card text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {String(c.id).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium">{c.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {String(current.id).padStart(2, "0")} · {current.blurb}
          </p>
          <ChapterBody id={id} />
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              className="h-11"
              disabled={id === 1}
              onClick={() => go((id - 1) as ChapterId)}
            >
              Previous
            </Button>
            <Button
              className="h-11"
              disabled={id === 10}
              onClick={() => go((id + 1) as ChapterId)}
            >
              Next chapter
            </Button>
          </div>
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/70"
            aria-label="Close chapters"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(18rem,90vw)] overflow-y-auto border-r border-border bg-card p-3">
            <p className="px-3 pb-2 font-display text-xl">Chapters</p>
            {CHAPTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go(c.id)}
                className={cn(
                  "flex min-h-11 w-full flex-col rounded-lg px-3 py-3 text-left",
                  id === c.id ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="font-mono text-[10px]">{String(c.id).padStart(2, "0")}</span>
                <span className="text-sm font-medium">{c.title}</span>
                <span className="text-[11px] text-muted-foreground">{c.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
