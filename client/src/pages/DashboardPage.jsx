import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, PiggyBank, WalletCards } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/api.js';
import { apiError, formatCurrency, formatDate } from '../utils/format.js';

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const currency = user?.preferredCurrency || 'INR';
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [budget, setBudget] = useState(null);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'), api.get('/transactions', { params: { page: 1, limit: 6, sort: 'newest' } }),
      api.get('/budgets/current'), api.get('/analytics/trends', { params: { range: 'Month' } }),
    ]).then(([s, t, b, tr]) => {
      setData(s.data.data); setRecent(t.data.data.items || []); setBudget(b.data.data); setTrend(tr.data.data || []);
    }).catch((e) => setError(apiError(e, 'Could not load dashboard.')));
  }, []);

  if (error) return <div className="card p-8 text-center text-rose-600">{error}</div>;
  if (!data) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-200" />)}</div>;

  const budgetLimit = budget?.budget?.overallLimit || 0;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg"><p className="text-sm text-violet-100">Welcome back, {user?.name?.split(' ')[0] || 'there'}</p><h1 className="mt-2 text-3xl font-bold">Here’s your financial overview</h1><p className="mt-2 text-sm text-violet-100">Real numbers calculated from your stored transactions.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Summary label="Total Balance" value={formatCurrency(data.totalBalance, currency)} icon={WalletCards} tone="violet" />
        <Summary label="Monthly Income" value={formatCurrency(data.totalIncome, currency)} icon={ArrowUpRight} tone="emerald" />
        <Summary label="Monthly Expenses" value={formatCurrency(data.totalExpenses, currency)} icon={ArrowDownRight} tone="rose" />
        <Summary label="Monthly Budget" value={formatCurrency(budgetLimit, currency)} icon={PiggyBank} tone="amber" />
        <Summary label="Budget Remaining" value={formatCurrency(budget?.remaining || 0, currency)} icon={PiggyBank} tone={(budget?.remaining || 0) < 0 ? 'rose' : 'emerald'} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="card p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Income vs Expense</h2><span className="text-xs text-slate-500">Last month</span></div><div className="mt-6 h-72">{trend.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="_id" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => formatCurrency(v, currency)} /><Legend /><Bar dataKey="income" fill="#10b981" radius={[5,5,0,0]} /><Bar dataKey="expenses" fill="#f43f5e" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer> : <Empty text="Add transactions to see a chart." />}</div></div>
        <div className="card p-6"><h2 className="text-lg font-bold">Recent transactions</h2><div className="mt-4 space-y-3">{recent.length ? recent.map((t) => <div key={t._id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{t.category?.name || 'Transaction'}</p><p className="text-xs text-slate-400">{formatDate(t.date)}</p></div><span className={`text-sm font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</span></div>) : <Empty text="No transactions yet." />}</div></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3"><Insight label="Savings rate" value={`${Number(data.savingsRate || 0).toFixed(1)}%`} /><Insight label="Top spending category" value={data.highestSpendingCategory || 'N/A'} /><Insight label="Budget used" value={`${Number(budget?.percentage || 0).toFixed(1)}%`} /></div>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone }) { const tones={violet:'bg-violet-50 text-violet-700',emerald:'bg-emerald-50 text-emerald-700',rose:'bg-rose-50 text-rose-700',amber:'bg-amber-50 text-amber-700'}; return <div className="card p-5"><div className={`inline-flex rounded-xl p-2 ${tones[tone]}`}><Icon className="h-4 w-4" /></div><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>; }
function Insight({label,value}) { return <div className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>; }
function Empty({text}) { return <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>; }
