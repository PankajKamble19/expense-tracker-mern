import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api.js';
import Modal from '../components/ui/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import { apiError, formatCurrency, formatDate } from '../utils/format.js';

const initialFilters = { type: '', category: '', account: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', sort: 'newest' };

export default function TransactionsPage() {
  const currency = useSelector((s) => s.auth.user?.preferredCurrency || 'INR');
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, hasNextPage: false, hasPrevPage: false });
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(() => {
    const p = { page, limit: 10, sort: filters.sort };
    Object.entries(filters).forEach(([k, v]) => { if (v !== '' && k !== 'sort') p[k] = v; });
    if (search) p.search = search;
    return p;
  }, [filters, page, search]);

  const loadReferenceData = useCallback(async () => {
    const [a, c] = await Promise.all([api.get('/accounts'), api.get('/categories')]);
    setAccounts(a.data.data || []);
    setCategories(c.data.data || []);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/transactions', { params });
      setItems(res.data.data.items || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) { setError(apiError(e, 'Could not load transactions.')); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { loadReferenceData().catch((e) => setError(apiError(e))); }, [loadReferenceData]);
  useEffect(() => { if (searchParams.get('add') === '1') { setEditing(null); setModalOpen(true); setSearchParams({}, { replace: true }); } }, [searchParams, setSearchParams]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const saveTransaction = async (payload) => {
    setSaving(true);
    try {
      const { attachmentFile, ...transactionPayload } = payload;
      if (!transactionPayload.attachment) delete transactionPayload.attachment;
      if (attachmentFile) {
        const body = new FormData();
        body.append('file', attachmentFile);
        const uploaded = await api.post('/transactions/attachment', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        transactionPayload.attachment = uploaded.data.data;
      }
      if (editing) await api.patch(`/transactions/${editing._id}`, transactionPayload);
      else await api.post('/transactions', transactionPayload);
      toast.success(editing ? 'Transaction updated' : 'Transaction added');
      setModalOpen(false); setEditing(null);
      await loadTransactions();
    } catch (e) { throw new Error(apiError(e, 'Could not save transaction.')); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.note || item.category?.name || 'this transaction'}? This cannot be undone.`)) return;
    try { await api.delete(`/transactions/${item._id}`); toast.success('Transaction deleted'); await loadTransactions(); }
    catch (e) { toast.error(apiError(e, 'Could not delete transaction.')); }
  };

  const exportCsv = async () => {
    try {
      const exportParams = { ...params };
      delete exportParams.page; delete exportParams.limit;
      const res = await api.get('/transactions/export', { params: exportParams, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'spendwise-transactions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch (e) { toast.error(apiError(e, 'CSV export failed.')); }
  };

  const updateFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Transactions</h1><p className="mt-1 text-sm text-slate-500">Track every income and expense from one place.</p></div>
        <div className="flex gap-2"><button onClick={exportCsv} className="btn-secondary flex items-center gap-2"><Download className="h-4 w-4" /> Export CSV</button><button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> Add Transaction</button></div>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="field pl-10" placeholder="Search note, category or exact amount" /></div>
          <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className="field"><option value="">All types</option><option>Income</option><option>Expense</option></select>
          <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className="field"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select>
          <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="field"><option value="">All categories</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}</select>
          <select value={filters.account} onChange={(e) => updateFilter('account', e.target.value)} className="field"><option value="">All accounts</option>{accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</select>
          <input type="date" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} className="field" aria-label="Start date" />
          <input type="date" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} className="field" aria-label="End date" />
          <input type="number" min="0" value={filters.minAmount} onChange={(e) => updateFilter('minAmount', e.target.value)} className="field" placeholder="Minimum amount" />
          <input type="number" min="0" value={filters.maxAmount} onChange={(e) => updateFilter('maxAmount', e.target.value)} className="field" placeholder="Maximum amount" />
          <button onClick={() => { setFilters(initialFilters); setSearchInput(''); setSearch(''); setPage(1); }} className="btn-secondary flex items-center justify-center gap-2"><Filter className="h-4 w-4" /> Reset filters</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          : error ? <div className="p-10 text-center"><p className="text-rose-600">{error}</p><button onClick={loadTransactions} className="btn-secondary mt-4">Try again</button></div>
          : items.length === 0 ? <div className="p-12 text-center"><h3 className="font-semibold text-slate-900">No transactions found</h3><p className="mt-2 text-sm text-slate-500">Add your first transaction or change the filters.</p></div>
          : <>
            <div className="hidden overflow-x-auto md:block"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['Category','Note','Date','Account','Type','Amount','Actions'].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{items.map((t) => <tr key={t._id} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium">{t.category?.name || '—'}</td><td className="max-w-xs truncate px-5 py-4 text-slate-600">{t.note || '—'}</td><td className="px-5 py-4 text-slate-600">{formatDate(t.date)}</td><td className="px-5 py-4 text-slate-600">{t.account?.name || '—'}</td><td className={`px-5 py-4 font-medium ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type}</td><td className={`px-5 py-4 font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</td><td className="px-5 py-4"><div className="flex gap-1"><button onClick={() => { setEditing(t); setModalOpen(true); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(t)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
            <div className="divide-y divide-slate-100 md:hidden">{items.map((t) => <div key={t._id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{t.category?.name || 'Transaction'}</p><p className="text-sm text-slate-500">{t.note || 'No note'}</p><p className="mt-1 text-xs text-slate-400">{t.account?.name} • {formatDate(t.date)}</p></div><p className={`font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</p></div><div className="mt-3 flex justify-end gap-2"><button onClick={() => { setEditing(t); setModalOpen(true); }} className="btn-secondary py-1.5">Edit</button><button onClick={() => remove(t)} className="rounded-xl bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">Delete</button></div></div>)}</div>
          </>}
        {!loading && !error && pagination.total > 0 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-sm text-slate-500">{pagination.total} transaction{pagination.total === 1 ? '' : 's'} • Page {pagination.page} of {Math.max(pagination.pages, 1)}</p><div className="flex gap-2"><button disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">Previous</button><button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">Next</button></div></div>}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Transaction' : 'Add Transaction'} onClose={() => { setModalOpen(false); setEditing(null); }} wide><TransactionForm accounts={accounts} categories={categories} initialValue={editing} onSubmit={saveTransaction} onCancel={() => { setModalOpen(false); setEditing(null); }} submitting={saving} /></Modal>
    </div>
  );
}
