import { Link } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import { buildAlerts, type AlertLevel } from "../lib/alerts";

const levelText: Record<AlertLevel, string> = {
  danger: "긴급",
  warning: "주의",
  info: "확인",
};

const levelClass: Record<AlertLevel, string> = {
  danger: "bg-red-50 text-red-700 border-red-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  info: "bg-blue-50 text-blue-700 border-blue-100",
};

export default function Alerts() {
  const data = useAppData();
  const alerts = buildAlerts(data);
  const urgentCount = alerts.filter((alert) => alert.level === "danger").length;
  const warningCount = alerts.filter((alert) => alert.level === "warning").length;
  const infoCount = alerts.filter((alert) => alert.level === "info").length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold text-red-600">Notifications</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            알림센터
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            월세 미납, 계약 만료, 공실, 지출 증가처럼 놓치면 안 되는 일을 모아봅니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 알림" value={`${alerts.length}건`} />
          <SummaryCard label="긴급" value={`${urgentCount}건`} tone="text-red-600" />
          <SummaryCard label="주의" value={`${warningCount}건`} tone="text-amber-600" />
          <SummaryCard label="확인" value={`${infoCount}건`} tone="text-blue-600" />
        </div>

        <section className="space-y-3">
          {alerts.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              현재 확인할 알림이 없습니다.
            </div>
          )}
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              to={alert.href}
              className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${levelClass[alert.level]}`}
                    >
                      {levelText[alert.level]}
                    </span>
                    {alert.date && (
                      <span className="text-xs font-bold text-slate-400">
                        {alert.date}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-black text-slate-950">
                    {alert.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{alert.description}</p>
                </div>
                {alert.amount !== undefined && (
                  <p className="text-right text-lg font-black text-slate-950">
                    {alert.amount.toLocaleString("ko-KR")}원
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </MainLayout>
  );
}

function SummaryCard({
  label,
  value,
  tone = "text-slate-950",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${tone}`}>
        {value}
      </p>
    </div>
  );
}
