import { ArrowRight, CheckCircle2, LineChart, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">S</div>
          <div>
            <p className="text-lg font-bold text-slate-900">SpendWise</p>
            <p className="text-xs text-slate-500">Take control of every rupee.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Login</Link>
          <Link to="/register" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm">Get started</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="grid items-center gap-8 rounded-[2rem] bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-8 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Smart finance</span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">The smarter way to track your money.</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">SpendWise helps you understand spending, manage budgets, and reach savings goals with confidence.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-violet-500">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700">Sign in</Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total balance</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">₹84,250</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Income</p>
                <p className="mt-3 text-2xl font-bold text-emerald-700">₹1,25,000</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Expenses</p>
                <p className="mt-3 text-2xl font-bold text-rose-700">₹40,750</p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-4">
                <p className="text-sm text-violet-700">Savings rate</p>
                <p className="mt-3 text-2xl font-bold text-violet-700">32%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <FeatureCard icon={<WalletCards className="h-5 w-5" />} title="Smart tracking" text="Record income and expenses with categories, dates, and accounts in seconds." />
          <FeatureCard icon={<LineChart className="h-5 w-5" />} title="Live analytics" text="Get insights on spending trends, category performance, and monthly net savings." />
          <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Secure by default" text="Your data stays private with per-user authorization and protected routes." />
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">{icon}</div>
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {title}</div>
      <p className="mt-3 text-slate-600">{text}</p>
    </div>
  );
}
