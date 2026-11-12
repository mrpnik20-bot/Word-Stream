import { useLayoutEffect, useRef } from "react";
import StreamLine from "@/components/StreamLine";
import { Pause, Play } from "lucide-react";

export default function WordStream({ lines, running, onStop, onStart }) {
  const scrollRef = useRef(null);
  const prevHeight = useRef(0);

  // New lines arrive at the top; keep a reader's position if they scrolled down.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop > 2) el.scrollTop += el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [lines]);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <div className="sticky top-0 z-10 border-b border-border/70 bg-background/85 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 pt-3 sm:px-6">
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full bg-accent ${running ? "live-dot" : "opacity-30"}`} aria-hidden />
              {running ? "READING" : "PAUSED"}
            </span>
            {running ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="স্ট্রিম বন্ধ করুন"
                className="flex items-center justify-center rounded-full border border-border/70 p-1 text-foreground transition-colors hover:bg-secondary"
              >
                <Pause className="h-3 w-3" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                aria-label="স্ট্রিম চালু করুন"
                className="flex items-center justify-center rounded-full border border-border/70 p-1 text-foreground transition-colors hover:bg-secondary"
              >
                <Play className="h-3 w-3" aria-hidden />
              </button>
            )}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="feed-scroll flex-1 overflow-y-auto px-4 py-3 sm:px-6 [mask-image:linear-gradient(to_bottom,black_72%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
      >
        {lines.length === 0
          ? null
          : lines.map((line, i) => (
              <StreamLine key={line.id} line={line} newest={i === 0} />
            ))}
      </div>
    </div>
  );
}