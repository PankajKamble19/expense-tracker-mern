import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/api.js';
import { apiError } from '../utils/format.js';

export default function SettingsPage(){
  const[categories,setCategories]=useState([]);const[form,setForm]=useState({name:'',type:'Expense'});
  const load=async()=>{try{const r=await api.get('/categories');setCategories(r.data.data||[])}catch(e){toast.error(apiError(e))}};
  useEffect(()=>{load()},[]);
  const add=async e=>{e.preventDefault();try{await api.post('/categories',{...form,custom:true});toast.success('Category added');setForm({...form,name:''});await load()}catch(err){toast.error(apiError(err))}};
  const remove=async c=>{if(!confirm(`Delete ${c.name}?`))return;try{await api.delete(`/categories/${c._id}`);toast.success('Category deleted');await load()}catch(e){toast.error(apiError(e))}};
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Settings</h1><p className="mt-1 text-sm text-slate-500">Manage your custom income and expense categories.</p></div><div className="card p-6"><h2 className="text-lg font-bold">Add category</h2><form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]"><input className="field" placeholder="e.g. Fuel" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><select className="field" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Expense</option><option>Income</option></select><button className="btn-primary flex items-center justify-center gap-2"><Plus className="h-4 w-4"/>Add</button></form></div><div className="grid gap-6 md:grid-cols-2">{['Expense','Income'].map(type=><div key={type} className="card p-6"><h2 className="font-bold">{type} categories</h2><div className="mt-4 space-y-2">{categories.filter(c=>c.type===type).map(c=><div key={c._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><div><p className="font-medium">{c.name}</p><p className="text-xs text-slate-400">{c.custom?'Custom':'Default'}</p></div><button onClick={()=>remove(c)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4"/></button></div>)}</div></div>)}</div></div>
}
