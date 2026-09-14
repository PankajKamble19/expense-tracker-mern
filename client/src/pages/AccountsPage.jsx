import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import api from '../api/api.js';
import Modal from '../components/ui/Modal.jsx';
import { apiError, formatCurrency } from '../utils/format.js';

const emptyForm = { name: '', type: 'Cash', openingBalance: 0 };

export default function AccountsPage() {
  const currency = useSelector((s) => s.auth.user?.preferredCurrency || 'INR');
  const [accounts, setAccounts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null); const [form, setForm] = useState(emptyForm); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const r=await api.get('/accounts'); setAccounts(r.data.data||[]); setError(''); } catch(e){setError(apiError(e));} finally {setLoading(false);} };
  useEffect(()=>{load();},[]);
  const show = (a=null)=>{setEditing(a);setForm(a?{name:a.name,type:a.type,openingBalance:a.openingBalance||0}:emptyForm);setOpen(true);};
  const submit=async(e)=>{e.preventDefault();setSaving(true);try{editing?await api.patch(`/accounts/${editing._id}`,form):await api.post('/accounts',form);toast.success(editing?'Account updated':'Account created');setOpen(false);await load();}catch(err){toast.error(apiError(err));}finally{setSaving(false);}};
  const remove=async(a)=>{if(!confirm(`Delete ${a.name}?`))return;try{await api.delete(`/accounts/${a._id}`);toast.success('Account deleted');await load();}catch(e){toast.error(apiError(e));}};
  const combined=accounts.reduce((s,a)=>s+Number(a.balance||0),0);
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Accounts & Wallets</h1><p className="mt-1 text-sm text-slate-500">Combined balance: <b>{formatCurrency(combined,currency)}</b></p></div><button onClick={()=>show()} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/>Add Account</button></div>{loading?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-36 animate-pulse rounded-3xl bg-slate-200"/>)}</div>:error?<div className="card p-8 text-rose-600">{error}</div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{accounts.map(a=><div key={a._id} className="card p-5"><div className="flex justify-between"><div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><Wallet className="h-5 w-5"/></div><div className="flex"><button onClick={()=>show(a)} className="p-2 text-slate-500"><Pencil className="h-4 w-4"/></button><button onClick={()=>remove(a)} className="p-2 text-rose-500"><Trash2 className="h-4 w-4"/></button></div></div><p className="mt-4 text-sm text-slate-500">{a.type}</p><p className="font-semibold">{a.name}</p><p className="mt-2 text-2xl font-bold">{formatCurrency(a.balance,currency)}</p></div>)}</div>}<Modal open={open} title={editing?'Edit Account':'Add Account'} onClose={()=>setOpen(false)}><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-sm font-medium">Name</span><input className="field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label className="block"><span className="mb-2 block text-sm font-medium">Type</span><select className="field" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Cash','Bank Account','Credit Card','Wallet','Savings','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-medium">Opening Balance</span><input type="number" min="0" step="0.01" className="field" value={form.openingBalance} onChange={e=>setForm({...form,openingBalance:Number(e.target.value)})}/></label><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving?'Saving...':'Save Account'}</button></div></form></Modal></div>;
}
