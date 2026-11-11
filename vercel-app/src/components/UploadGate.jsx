import { useEffect, useRef, useState } from "react";
import { FileText, UploadCloud, CheckCircle2 } from "lucide-react";
import { createLineGenerator } from "@/lib/lineGenerator";

// The file the agent "uploads". Vercel has no Base44 storage, so the upload is
// purely visual — it builds the file in memory to look real, then reveals the stream.
const FILE_NAME = "chronos_stream_0001.txt";
const FILE_LINES = 500;
const UPLOAD_DURATION = 2200;

export default function UploadGate({ onComplete }) {
  const [status, setStatus] = useState("uploading"); // uploading | done
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const start = performance.now();

    // Build the file in memory so the gate feels like a real upload.
    const gen = createLineGenerator();
    const lines = [];
    for (let i = 0; i < FILE_LINES; i += 1) {
      const l = gen.next();
      lines.push(`${String(l.id).padStart(6, "0")}  ${l.words.join(" ")}  #${l.hash}`);
    }
    // eslint-disable-next-line no-unused-vars
    const _blob = new File([lines.join("\n")], FILE_NAME, { type: "text/plain" });

    const tick = (now) => {
      if (cancelled) return;
      const pct = Math.min(90, ((now - start) / UPLOAD_DURATION) * 90 + 4);
      setProgress(pct);
      if (!done.current) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const timer = setTimeout(() => {
      if (cancelled) return;
      done.current = true;
      setProgress(100);
      setStatus("done");
      setTimeout(onComplete, 650);
    }, UPLOAD_DURATION);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = status === "done" ? "সম্পন্ন" : "আপলোড হচ্ছে…";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 font-serif text-xl font-medium text-foreground">ফাইল আপলোড</h2>

          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {status === "done" ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              ) : (
                <FileText className="h-6 w-6" aria-hidden />
              )}
            </div>
            <p className="mt-1 truncate font-mono text-xs text-foreground">{FILE_NAME}</p>
            <p className="font-mono text-[10px] text-muted-foreground/80">
              টেক্সট ফাইল · স্বয়ংক্রিয় আপলোড
            </p>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">
              {status === "done" ? "আপলোড সম্পন্ন — স্ট্রিম শুরু হচ্ছে" : "ফাইল আপলোড হচ্ছে…"}
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 font-mono text-[9px] font-bold tracking-wide text-accent">
                TXT
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm font-medium text-foreground">{FILE_NAME}</p>
                <p className="font-mono text-[10px] text-muted-foreground/80">
                  পাবলিক স্টোরেজে
                </p>
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
                {status === "done" ? "Done" : `${Math.round(progress)}%`}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              {status === "done" ? "PUBLIC URL প্রস্তুত" : "UPLOADING"}
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-serif text-sm font-medium text-accent-foreground"
              aria-live="polite"
            >
              <UploadCloud className="h-4 w-4" aria-hidden />
              {label}
            </span>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50">
          LEXICAL CHRONOS
        </p>
      </div>
    </div>
  );
}