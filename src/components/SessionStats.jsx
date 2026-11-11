function formatRunTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`;
}

export default function SessionStats({ stats }) {
  const items = [
    { label: "Lines", value: stats.lines.toLocaleString("en-US") },
    { label: "Words", value: stats.words.toLocaleString("en-US") },
    { label: "Run time", value: formatRunTime(stats.lines) },
  ];

  return (
    <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-7 lg:pt-1">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1.5 font-mono text-xl tabular-nums text-foreground sm:text-2xl">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}