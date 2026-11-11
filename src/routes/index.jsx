import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useWordStream } from "@/hooks/useWordStream";
import StreamHero from "@/components/StreamHero";
import SessionStats from "@/components/SessionStats";
import SystemMeta from "@/components/SystemMeta";
import ControlBar from "@/components/ControlBar";
import WordStream from "@/components/WordStream";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lexical Chronos — 12 random words every second" },
      {
        name: "description",
        content:
          "A live word agent that writes twelve random English words every second. Lines are never repeated; words may be.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { lines, running, stats, toggle, clear } = useWordStream();
  const [copied, setCopied] = useState(false);
  const hasLines = lines.length > 0;

  const copyLastTen = async () => {
    const text = lines
      .slice(0, 10)
      .reverse()
      .map((line) => line.words.join(" "))
      .join("\n");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      toast.success("Last 10 lines copied");
    } catch {
      toast.error("Your browser blocked the clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-6 font-mono text-[10px] uppercase tracking-[0.24em] sm:px-8 sm:pt-8">
        <span className="text-foreground">Lexical Chronos</span>
        <span className={running ? "flex items-center gap-2 text-accent" : "text-muted-foreground"}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              running ? "bg-accent live-dot" : "bg-muted-foreground"
            }`}
          />
          {running ? "live" : "paused"}
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
        <StreamHero />

        <div className="mt-9 grid gap-5 sm:mt-12 lg:grid-cols-[148px_minmax(0,1fr)_168px] lg:gap-8">
          <SessionStats stats={stats} />

          <div className="min-w-0">
            <ControlBar
              running={running}
              hasLines={hasLines}
              copied={copied}
              onToggle={toggle}
              onClear={clear}
              onCopy={copyLastTen}
            />
            <WordStream lines={lines} />
          </div>

          <SystemMeta />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted-foreground/70 sm:px-8">
        No account, no sign-up · the agent runs in your browser · newest line on top
      </footer>
    </div>
  );
}