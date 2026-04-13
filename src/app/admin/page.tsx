export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 max-w-full text-slate-600 whitespace-nowrap overflow-x-auto [scrollbar-width:thin]">
        Build and publish lessons to the Learning Hub. Published rows in the database override the default catalog in the app (matched by lesson id).
      </p>
    </div>
  );
}
