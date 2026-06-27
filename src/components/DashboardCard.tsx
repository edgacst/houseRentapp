type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
  tone?: "blue" | "emerald" | "amber" | "slate";
};

const toneClass = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

function DashboardCard({
  title,
  value,
  description,
  tone = "slate",
}: DashboardCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>
        </div>
        <span className={`h-3 w-3 rounded-full ring-4 ${toneClass[tone]}`} />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{description}</p>
    </div>
  );
}

export default DashboardCard;
