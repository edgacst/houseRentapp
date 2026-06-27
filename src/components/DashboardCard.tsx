type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
};

function DashboardCard({ title, value, description }: DashboardCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default DashboardCard;