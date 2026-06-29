import { Link } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import { buildAlerts } from "../../lib/alerts";
import DashboardCard from "../DashboardCard";
import ExpiringContracts from "./ExpiringContracts";
import RecentContracts from "./RecentContracts";
import RecentPayments from "./RecentPayments";
import VacancyStatus from "./VacancyStatus";

function DashboardOverview() {
  const data = useAppData();
  const { properties, rooms, contracts, rentPayments, isDataLoading } = data;
  const alerts = buildAlerts(data);
  const urgentAlerts = alerts.filter((alert) => alert.level === "danger");
  const vacantRooms = rooms.filter((room) => room.status === "vacant").length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  const occupancyRate = rooms.length
    ? Math.round((occupiedRooms / rooms.length) * 100)
    : 0;
  const expectedMonthly = contracts
    .filter((contract) => contract.status === "active")
    .reduce((sum, contract) => sum + contract.monthlyRent + contract.maintenanceFee, 0);
  const unpaidTotal = rentPayments
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);

  const cards = [
    {
      title: "총 건물",
      value: `${properties.length}`,
      description: "등록된 임대 자산",
      tone: "blue" as const,
    },
    {
      title: "총 호실",
      value: `${rooms.length}`,
      description: `입주율 ${occupancyRate}%`,
      tone: "emerald" as const,
    },
    {
      title: "공실",
      value: `${vacantRooms}`,
      description: "즉시 임대 가능한 호실",
      tone: "amber" as const,
    },
    {
      title: "월 예상 수입",
      value: `${expectedMonthly.toLocaleString("ko-KR")}원`,
      description: `미납 ${unpaidTotal.toLocaleString("ko-KR")}원`,
      tone: "slate" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-slate-950 shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold text-blue-700">오늘의 운영 요약</p>
            <h1 className="mt-2 max-w-4xl text-2xl font-black tracking-tight lg:text-3xl">
              수납, 공실, 계약 만료를 놓치지 않는 임대 관리
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              HOUSERENT는 건물과 호실 데이터를 기반으로 임대 현황을 정리합니다.
              알림센터에서 오늘 처리해야 할 일을 먼저 확인하세요.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroMetric label="운영 건물" value={`${properties.length}개`} />
            <HeroMetric label="관리 호실" value={`${rooms.length}개`} />
            <HeroMetric label="입주율" value={`${occupancyRate}%`} />
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <Link
          to="/alerts"
          className="block rounded-lg border border-red-100 bg-red-50 px-5 py-4 shadow-sm transition hover:border-red-200"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-red-700">
                처리할 알림 {alerts.length}건
              </p>
              <p className="mt-1 text-sm text-red-600">
                긴급 {urgentAlerts.length}건 · 첫 알림: {alerts[0].title}
              </p>
            </div>
            <span className="text-sm font-black text-red-700">알림센터 보기</span>
          </div>
        </Link>
      )}

      {isDataLoading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          최신 데이터를 불러오는 중입니다.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentContracts />
        <RecentPayments />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <VacancyStatus />
        <ExpiringContracts />
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default DashboardOverview;
