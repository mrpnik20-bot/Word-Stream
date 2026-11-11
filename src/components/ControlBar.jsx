const buttonClass =
  "rounded-full border border-border bg-card px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-150 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground";

export default function ControlBar({ running, hasLines, copied, onToggle, onClear, onCopy }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            running ? "bg-accent live-dot" : "bg-muted-foreground"
          }`}
        />
        <span className="text-muted-foreground">
          {running ? "Agent streaming" : "Agent frozen"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onToggle} className={buttonClass}>
          {running ? "Freeze" : "Resume"}
        </button>
        <button type="button" onClick={onCopy} disabled={!hasLines} className={buttonClass}>
          {copied ? "Copied" : "Copy last 10"}
        </button>
        <button type="button" onClick={onClear} disabled={!hasLines} className={buttonClass}>
          Clear
        </button>
      </div>
    </div>
  );
}