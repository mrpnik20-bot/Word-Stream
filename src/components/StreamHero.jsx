const facts = ["12 words per line", "100 lines per second", "zero repeated lines"];

export default function StreamHero() {
  return (
    <section className="pt-10 sm:pt-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
        Autonomous word agent
      </p>

      <h1 className="mt-5 max-w-3xl font-heading text-[2.1rem] leading-[1.06] tracking-[-0.02em] text-foreground sm:text-6xl">
        A hundred lines,
        <br className="hidden sm:block" /> twelve words each.
      </h1>

      <p className="mt-5 max-w-xl font-serif text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        প্রতি সেকেন্ডে ১০০টি লাইন, প্রতিটিতে ১২টি র‍্যান্ডম ইংরেজি শব্দ। কোনো লাইন কখনো পুনরাবৃত্তি হয় না —
        শব্দ পুনরাবৃত্তি হতে পারে।
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {facts.map((fact, i) => (
          <span key={fact} className="flex items-center gap-4">
            {i > 0 && <span className="h-1 w-1 rounded-full bg-border" aria-hidden />}
            {fact}
          </span>
        ))}
      </div>
    </section>
  );
}