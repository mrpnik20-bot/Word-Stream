import { useEffect, useRef, useState } from "react";
import { FileText, CheckCircle2, Send, AlertCircle } from "lucide-react";

const FILE_NAME = "chronos_stream_100000.txt";
const TOTAL_LINES = 100000;

/**
 * Builds the 100,000-line file on the server and sends it to a Telegram bot.
 * The card looks like a real upload and shows each phase: generating →
 * sending to Telegram → done (or error). The stream is not started.
 */
export default function UploadGate() {
  const [phase, setPhase] = useState("working"); // working | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const raf = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const start = performance.now();

    // Ease toward 90% while the server works, then snap to 100% on success.
    const tick = (now) => {
      if (cancelled) return;
      const pct = Math.min(90, ((now - start) / 14000) * 90 + 3);
      setProgress(pct);
      if (!done.current) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    (async () => {
      try {
        const res = await fetch("/api/upload", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          done.current = true;
          setPhase("error");
          setError(data.error || `আপলোড ব্যর্থ (${res.status})`);
          return;
        }
        done.current = true;
        setProgress(100);
        setPhase("done");
      } catch (e) {
        if (cancelled) return;
        done.current = true;
        setPhase("error");
        setError(e?.message || "আপলোড ব্যর্থ হয়েছে");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const heading =
    phase === "done"
      ? "টেলিগ্রামে পাঠানো সম্পন্ন"
      : phase === "error"
        ? "আপলোড ব্যর্থ"
        : "ফাইল তৈরি ও টেলিগ্রামে পাঠানো হচ্ছে";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 font-serif text-xl font-medium text-foreground">ফাইল আপলোড</h2>

          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 px-5 py-10 text-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                phase === "error" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
              }`}
            >
              {phase === "done" ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              ) : phase === "error" ? (
                <AlertCircle className="h-6 w-6" aria-hidden />
              ) : (
                <FileText className="h-6 w-6" aria-hidden />
              )}
            </div>
            <p className="mt-1 truncate font-mono text-xs text-foreground">{FILE_NAME}</p>
            <p className="font-mono text-[10px] text-muted-foreground/80">
              টেক্সট ফাইল · {TOTAL_LINES.toLocaleString("en-US")} লাইন
            </p>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">{heading}</p>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 font-mono text-[9px] font-bold tracking-wide text-accent">
                TXT
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm font-medium text-foreground">{FILE_NAME}</p>
                <p className="font-mono text-[10px] text-muted-foreground/80">
                  {phase === "done"
                    ? "টেলিগ্রাম বটে পাঠানো হয়েছে"
                    : phase === "error"
                      ? "আপলোড ব্যর্থ"
                      : "সার্ভারে তৈরি হচ্ছে · টেলিগ্রামে যাচ্ছে"}
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
                {phase === "done" ? "Done" : phase === "error" ? "Err" : `${Math.round(progress)}%`}
              </span>
            </div>
            {error && <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              {phase === "done" ? "টেলিগ্রামে সংরক্ষিত" : phase === "error" ? "ব্যর্থ" : "UPLOADING"}
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-serif text-sm font-medium text-accent-foreground"
              aria-live="polite"
            >
              {phase === "done" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  সম্পন্ন
                </>
              ) : phase === "error" ? (
                <>
                  <AlertCircle className="h-4 w-4" aria-hidden />
                  পুনঃচেষ্টা করুন
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden />
                  পাঠানো হচ্ছে…
                </>
              )}
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