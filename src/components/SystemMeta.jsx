import { WORDS } from "@/lib/wordBank";

const rows = [
  ["Engine", "local agent"],
  ["Interval", "1000 ms"],
  ["Per line", "12 words"],
  ["Bank", `${WORDS.length.toLocaleString("en-US")} words`],
];

export default function SystemMeta() {
  return (
    <aside className="hidden lg:block lg:pt-1">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        System
      </p>

      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {label}
            </dt>
            <dd className="font-mono text-[11px] tracking-[0.04em] text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-t border-border pt-4 font-mono text-[10px] leading-relaxed tracking-[0.04em] text-muted-foreground/70">
        Every line is fingerprinted and checked against the session before it is written.
      </p>
    </aside>
  );
}