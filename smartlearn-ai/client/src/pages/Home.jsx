import { Link } from "react-router-dom";

export default function Home() {
  const card =
    "rounded-2xl border border-[rgba(var(--border),var(--border-alpha))] bg-[rgba(var(--card),var(--card-alpha))] shadow-[0_18px_60px_rgba(0,0,0,0.18)]";

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12">
        <div className="w-full max-w-2xl">
          <div className={`${card} p-8 md:p-10 text-center`}>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
              Smart Learning Planner <span className="inline-block">🚀</span>
            </h1>

            <p className="mt-3 leading-relaxed text-[rgb(var(--muted))]">
              Organize your study. Track your growth. Become unstoppable.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex justify-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black hover:bg-emerald-400 transition"
              >
                Login
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex justify-center rounded-xl px-6 py-3 font-semibold border border-[rgba(var(--border),var(--border-alpha))] bg-[rgba(var(--btn),0.08)] text-[rgb(var(--text))] hover:bg-[rgba(var(--btn),0.12)] transition"
              >
                Dashboard
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-[rgb(var(--muted))]">
              <div className="rounded-xl border border-[rgba(var(--border),var(--border-alpha))] bg-[rgba(var(--btn),0.06)] p-3">
                📅 Smart schedules
              </div>
              <div className="rounded-xl border border-[rgba(var(--border),var(--border-alpha))] bg-[rgba(var(--btn),0.06)] p-3">
                ✅ Task tracking
              </div>
              <div className="rounded-xl border border-[rgba(var(--border),var(--border-alpha))] bg-[rgba(var(--btn),0.06)] p-3">
                📈 Progress stats
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}