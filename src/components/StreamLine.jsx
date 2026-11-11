import { memo } from "react";

function StreamLine({ line, newest }) {
  return (
    <div className="line-in relative border-b border-border/70 py-3 last:border-b-0">
      {newest && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-accent" />}

      <div className="flex items-start gap-3 pl-2 sm:gap-5 sm:pl-3">
        <span className="mt-[5px] w-8 shrink-0 font-mono text-[10px] tabular-nums tracking-[0.1em] text-muted-foreground/80">
          {String(line.id).padStart(4, "0")}
        </span>

        <p className="min-w-0 flex-1 font-serif text-[15px] leading-[1.7] text-foreground sm:text-[17px] sm:leading-[1.75]">
          {line.words.map((word, i) => (
            <span
              key={`${line.id}-${i}`}
              className="cursor-default transition-colors duration-150 hover:text-primary"
            >
              {word}
              {i < line.words.length - 1 ? " " : ""}
            </span>
          ))}
        </p>

        <span className="mt-[5px] hidden shrink-0 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60 sm:block">
          {line.hash}
        </span>
      </div>

      {newest && (
        <span aria-hidden className="scan-line absolute bottom-0 left-0 h-px w-full bg-accent" />
      )}
    </div>
  );
}

// Stable line objects + a boolean `newest` flag let unchanged lines skip re-render
// even while 100 lines/sec flow through the feed.
export default memo(StreamLine);