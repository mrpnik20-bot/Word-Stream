import { useEffect, useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";

// Matches the actor's first file: 100,000 lines, ~84 bytes/line ≈ 8.4 MB.
const FILE_NAME = "chronos_stream_0001.txt";
const FILE_SIZE_LABEL = "8.4 MB";
const FILE_LINES = "100,000 lines";

/**
 * The upload entry: a single ready file the user "uploads" by clicking. The
 * progress bar fills, then the stream is revealed — so it looks manual even
 * though the actor builds and streams the file automatically on connect.
 */
export default function UploadGate({ onComplete }) {
  const [status, setStatus] = useState("ready"); // ready | uploading | done
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function startUpload() {
    if (status !== "ready") return;
    setStatus("uploading");
    const start = performance.now();
    const DURATION = 1600;
    const tick = (now) => {
      const pct = Math.min(100, ((now - start) / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        setStatus("done");
        setTimeout(onComplete, 450);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 font-serif text-xl font-medium text-foreground">ফাইল আপলোড</h2>

          {/* Dropzone / preview area */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-1 truncate font-mono text-xs text-foreground">{FILE_NAME}</p>
            <p className="font-mono text-[10px] text-muted-foreground/80">
              {FILE_SIZE_LABEL} · {FILE_LINES}
            </p>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">
              স্ট্রিম শুরু করতে ফাইলটি আপলোড করুন
            </p>
          </div>

          {/* File row with progress (mirrors the mockup's queued-file row) */}
          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 font-mono text-[9px] font-bold tracking-wide text-accent">
                TXT
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm font-medium text-foreground">{FILE_NAME}</p>
                <p className="font-mono text-[10px] text-muted-foreground/80">{FILE_SIZE_LABEL}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full bg-accent transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-14 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                {status === "ready" ? "Ready" : status === "done" ? "Done" : `${Math.round(progress)}%`}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={startUpload}
              disabled={status !== "ready"}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-serif text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" aria-hidden />
              {status === "ready" ? "আপলোড করুন" : status === "done" ? "সম্পন্ন" : "আপলোড হচ্ছে…"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50">
          LEXICAL CHRONOS
        </p>
      </div>
    </div>
  );
}