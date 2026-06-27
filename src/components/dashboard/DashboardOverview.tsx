import { useAppData } from "../../context/AppContext";
import DashboardCard from "../DashboardCard";
import ExpiringContracts from "./ExpiringContracts";
import RecentContracts from "./RecentContracts";
import RecentPayments from "./RecentPayments";
import VacancyStatus from "./VacancyStatus";

function DashboardOverview() {
  const { properties, rooms, contracts, rentPayments, isDataLoading } =
    useAppData();
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
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-8">
          <div>
            <p className="text-sm font-bold text-blue-300">오늘의 운영 요약</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight lg:text-4xl">
              수납, 공실, 계약 만료를 놓치지 않는 임대 관리
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              HOUSERENT는 건물과 호실 데이터를 기반으로 임대 현황을
              정리합니다. 다음 단계에서는 임차인, 계약, 월세 데이터까지
              모두 API로 연결됩니다.
            </p>
          </div>

          <div className="grid content-end gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroMetric label="운영 건물" value={`${properties.length}개`} />
            <HeroMetric label="관리 호실" value={`${rooms.length}개`} />
            <HeroMetric label="입주율" value={`${occupancyRate}%`} />
          </div>
        </div>
      </section>

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
    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-semibold text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

export default DashboardOverview;
