import { useLayoutEffect, useRef } from "react";
import StreamLine from "@/components/StreamLine";

export default function WordStream({ lines }) {
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
    <div className="relative rounded-2xl border border-border bg-card shadow-[0_1px_0_rgba(10,17,40,0.04),0_30px_70px_-50px_rgba(10,17,40,0.45)]">
      <div
        ref={scrollRef}
        className="feed-scroll h-[52vh] min-h-[300px] overflow-y-auto px-3 py-2 sm:h-[56vh] sm:px-5 [mask-image:linear-gradient(to_bottom,black_62%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_62%,transparent)]"
      >
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
              Standing by
            </p>
            <p className="max-w-xs font-serif text-sm leading-relaxed text-muted-foreground">
              The agent keeps its rhythm — fresh lines of twelve words land within a second.
            </p>
          </div>
        ) : (
          lines.map((line, i) => (
            <StreamLine key={line.id} line={line} newest={i === 0} />
          ))
        )}
      </div>
    </div>
  );
}