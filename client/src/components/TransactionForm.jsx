import { useEffect, useMemo, useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ accounts = [], categories = [], initialValue = null, onSubmit, onCancel, submitting = false }) {
  const [form, setForm] = useState(() => initialValue ? {
    amount: initialValue.amount ?? '',
    type: initialValue.type || 'Expense',
    category: initialValue.category?._id || initialValue.category || '',
    account: initialValue.account?._id || initialValue.account || '',
    note: initialValue.note || '',
    date: initialValue.date ? new Date(initialValue.date).toISOString().slice(0, 10) : today(),
    recurring: Boolean(initialValue.recurring),
    recurrenceFrequency: initialValue.recurrenceFrequency || 'Monthly',
    attachmentFile: null,
    attachment: initialValue.attachment || null,
  } : {
    amount: '', type: 'Expense', category: '', account: '', note: '', date: today(), recurring: false, recurrenceFrequency: 'Monthly', attachmentFile: null, attachment: null,
  });
  const [error, setError] = useState('');

  const filteredCategories = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  useEffect(() => {
    if (filteredCategories.length && !filteredCategories.some((c) => c._id === form.category)) {
      setForm((prev) => ({ ...prev, category: filteredCategories[0]._id }));
    }
  }, [filteredCategories, form.category]);

  useEffect(() => {
    if (accounts.length && !accounts.some((a) => a._id === form.account)) {
      setForm((prev) => ({ ...prev, account: accounts[0]._id }));
    }
  }, [accounts, form.account]);

  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter an amount greater than zero.');
    if (!form.category) return setError('Select a category.');
    if (!form.account) return setError('Select an account.');
    try { await onSubmit?.({ ...form, amount: Number(form.amount) }); }
    catch (err) { setError(err?.message || 'Could not save transaction.'); }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Amount</span><input aria-label="Amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => change('amount', e.target.value)} className="field" placeholder="0.00" /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Type</span><select aria-label="Type" value={form.type} onChange={(e) => change('type', e.target.value)} className="field"><option>Expense</option><option>Income</option></select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Category</span><select aria-label="Category" value={form.category} onChange={(e) => change('category', e.target.value)} className="field"><option value="">Select category</option>{filteredCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Account / Wallet</span><select aria-label="Account" value={form.account} onChange={(e) => change('account', e.target.value)} className="field"><option value="">Select account</option>{accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Date</span><input type="date" value={form.date} onChange={(e) => change('date', e.target.value)} className="field" /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Note</span><input value={form.note} onChange={(e) => change('note', e.target.value)} className="field" placeholder="What was this for?" maxLength={200} /></label>
      </div>
      <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Attachment <span className="font-normal text-slate-400">(optional, max 5 MB)</span></span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => change('attachmentFile', e.target.files?.[0] || null)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:font-medium file:text-violet-700" />{form.attachment?.url && <a href={form.attachment.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-violet-700">View current attachment</a>}</label>
      <div className="rounded-2xl bg-slate-50 p-4">
        <label className="flex items-center gap-3"><input type="checkbox" checked={form.recurring} onChange={(e) => change('recurring', e.target.checked)} className="h-4 w-4 accent-violet-600" /><span className="text-sm font-medium text-slate-700">Recurring transaction</span></label>
        {form.recurring && <select value={form.recurrenceFrequency} onChange={(e) => change('recurrenceFrequency', e.target.value)} className="field mt-3"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option></select>}
      </div>
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : initialValue ? 'Update Transaction' : 'Add Transaction'}</button></div>
    </form>
  );
}
