import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="text-5xl font-bold text-violet-600">404</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">The page you requested does not exist.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-medium text-white">Go home</Link>
      </div>
    </div>
  );
}
