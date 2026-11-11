import { FileText } from "lucide-react";

const BYTES_PER_LINE = 84; // ~12 words + spaces + newline

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * A compact top bar that makes the live feed look like it is being read out of
 * an uploaded file: filename, a thin read-progress bar, a live "READING" badge
 * and a line / byte counter.
 */
export default function FileStatusBar({ file }) {
  const pct = Math.min(100, (file.read / file.total) * 100);
  const readBytes = file.read * BYTES_PER_LINE;
  const totalBytes = file.total * BYTES_PER_LINE;

  return (
    <div className="sticky top-0 z-10 border-b border-border/70 bg-background/85 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 pt-3 sm:px-6">
        <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        <span className="truncate font-mono text-[11px] tracking-[0.08em] text-foreground sm:text-xs">
          {file.name}
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          READING
        </span>
      </div>

      <div className="mt-2 h-px w-full bg-border/60" aria-hidden>
        <div
          className="h-full bg-accent transition-[width] duration-100 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-1.5 font-mono text-[10px] tabular-nums text-muted-foreground/80 sm:px-6">
        <span>
          {file.read.toLocaleString()} / {file.total.toLocaleString()} lines
        </span>
        <span>
          {formatBytes(readBytes)} / {formatBytes(totalBytes)}
        </span>
      </div>
    </div>
  );
}