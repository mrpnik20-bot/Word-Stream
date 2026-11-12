import { useEffect, useRef, useState } from "react";
import { FileText, CheckCircle2, Send, AlertCircle } from "lucide-react";

const TOTAL_LINES = 100000;
const PART_LINES = 10000;
const TOTAL_PARTS = Math.ceil(TOTAL_LINES / PART_LINES);

/**
 * Sends the file to Telegram in small parts (10 × 10,000 lines). Each part is
 * its own server request + Telegram document, so every request finishes fast
 * and stays clear of Vercel Hobby's 10s timeout. The stream is not started.
 */
export default function UploadGate() {
  const [phase, setPhase] = useState("working"); // working | done | error
  const [current, setCurrent] = useState(0); // parts completed
  const [error, setError] = useState("");
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    (async () => {
      for (let part = 0; part < TOTAL_PARTS; part += 1) {
        if (cancelled.current) return;
        try {
          const res = await fetch(`/api/upload?part=${part}`, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (cancelled.current) return;
          if (!res.ok || !data.ok) {
            setPhase("error");
            setError(data.error || `পার্ট ${part + 1} আপলোড ব্যর্থ (${res.status})`);
            return;
          }
          setCurrent(part + 1);
        } catch (e) {
          if (cancelled.current) return;
          setPhase("error");
          setError(e?.message || `পার্ট ${part + 1} আপলোড ব্যর্থ`);
          return;
        }
      }
      if (cancelled.current) return;
      setPhase("done");
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const progress = Math.round((current / TOTAL_PARTS) * 100);
  const heading =
    phase === "done"
      ? "টেলিগ্রামে সব পার্ট পাঠানো সম্পন্ন"
      : phase === "error"
        ? "আপলোড ব্যর্থ"
        : `পার্ট ${Math.min(current + 1, TOTAL_PARTS)}/${TOTAL_PARTS} টেলিগ্রামে পাঠানো হচ্ছে…`;

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
            <p className="mt-1 font-mono text-xs text-foreground">chronos_part_01.txt … chronos_part_10.txt</p>
            <p className="font-mono text-[10px] text-muted-foreground/80">
              {TOTAL_PARTS} ফাইল · {TOTAL_LINES.toLocaleString("en-US")} লাইন
            </p>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">{heading}</p>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 font-mono text-[9px] font-bold tracking-wide text-accent">
                TXT
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm font-medium text-foreground">
                  পার্ট {Math.min(current + (phase === "done" ? 0 : 1), TOTAL_PARTS)} / {TOTAL_PARTS}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/80">
                  {phase === "done"
                    ? `${TOTAL_PARTS}টি ফাইল টেলিগ্রামে পাঠানো হয়েছে`
                    : phase === "error"
                      ? "আপলোড ব্যর্থ"
                      : `পাঠানো হয়েছে ${current}/${TOTAL_PARTS}`}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full bg-accent transition-[width] duration-200 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-14 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                {phase === "done" ? "Done" : phase === "error" ? "Err" : `${progress}%`}
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
                  পুনঃচেষ্টা
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