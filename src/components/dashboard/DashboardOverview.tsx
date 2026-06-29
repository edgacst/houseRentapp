import { Link } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import { buildAlerts } from "../../lib/alerts";
import DashboardCard from "../DashboardCard";
import ExpiringContracts from "./ExpiringContracts";
import RecentContracts from "./RecentContracts";
import RecentPayments from "./RecentPayments";
import VacancyStatus from "./VacancyStatus";

const dayMs = 1000 * 60 * 60 * 24;

function DashboardOverview() {
  const data = useAppData();
  const {
    properties,
    rooms,
    contracts,
    rentPayments,
    expenses,
    maintenanceCharges,
    isDataLoading,
  } = data;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const currentMonth = todayKey.slice(0, 7);
  const alerts = buildAlerts(data);
  const urgentAlerts = alerts.filter((alert) => alert.level === "danger");
  const vacantRooms = rooms.filter((room) => room.status === "vacant").length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  const occupancyRate = rooms.length
    ? Math.round((occupiedRooms / rooms.length) * 100)
    : 0;
  const activeContracts = contracts.filter((contract) => contract.status === "active");
  const expectedMonthly = activeContracts.reduce(
    (sum, contract) => sum + contract.monthlyRent + contract.maintenanceFee,
    0,
  );
  const monthRentBillings = rentPayments.filter((payment) =>
    payment.dueDate.startsWith(currentMonth),
  );
  const monthExpected = monthRentBillings.reduce(
    (sum, payment) => sum + payment.rentAmount + payment.maintenanceFee,
    0,
  );
  const monthCollected = monthRentBillings
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const monthUnpaid = monthRentBillings
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const monthExpenses = expenses
    .filter((expense) => expense.expenseDate.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const monthMaintenanceIncome = maintenanceCharges
    .filter((charge) => charge.status === "paid" && charge.paidDate?.startsWith(currentMonth))
    .reduce((sum, charge) => sum + charge.amount, 0);
  const monthProfit = monthCollected + monthMaintenanceIncome - monthExpenses;

  const expiringBuckets = activeContracts.reduce(
    (result, contract) => {
      const daysLeft = Math.ceil(
        (new Date(contract.endDate).getTime() - today.getTime()) / dayMs,
      );
      if (daysLeft >= 0 && daysLeft <= 30) result.d30 += 1;
      if (daysLeft >= 0 && daysLeft <= 60) result.d60 += 1;
      if (daysLeft >= 0 && daysLeft <= 90) result.d90 += 1;
      return result;
    },
    { d30: 0, d60: 0, d90: 0 },
  );

  const todayTasks = [
    ...rentPayments
      .filter((payment) => payment.status !== "paid" && payment.dueDate <= todayKey)
      .slice(0, 3)
      .map((payment) => ({
        title: payment.dueDate < todayKey ? "연체 월세 확인" : "오늘 월세 수납",
        description: `${payment.dueDate} · ${(payment.rentAmount + payment.maintenanceFee).toLocaleString("ko-KR")}원`,
        href: "/rents",
      })),
    ...activeContracts
      .filter((contract) => {
        const daysLeft = Math.ceil(
          (new Date(contract.endDate).getTime() - today.getTime()) / dayMs,
        );
        return daysLeft >= 0 && daysLeft <= 30;
      })
      .slice(0, 2)
      .map((contract) => ({
        title: "계약 만료 임박",
        description: `${contract.endDate} 종료`,
        href: "/contracts",
      })),
    ...rooms
      .filter((room) => room.status === "vacant")
      .slice(0, 2)
      .map((room) => ({
        title: "공실 확인",
        description: `${room.name} · ${room.monthlyRent.toLocaleString("ko-KR")}원`,
        href: "/rooms",
      })),
  ].slice(0, 5);

  const cards = [
    {
      title: "이번 달 수납",
      value: `${monthCollected.toLocaleString("ko-KR")}원`,
      description: `예정 ${Math.max(monthExpected, expectedMonthly).toLocaleString("ko-KR")}원`,
      tone: "blue" as const,
    },
    {
      title: "이번 달 미납",
      value: `${monthUnpaid.toLocaleString("ko-KR")}원`,
      description: `${monthRentBillings.filter((payment) => payment.status !== "paid").length}건 확인 필요`,
      tone: "amber" as const,
    },
    {
      title: "이번 달 순이익",
      value: `${monthProfit.toLocaleString("ko-KR")}원`,
      description: `지출 ${monthExpenses.toLocaleString("ko-KR")}원`,
      tone: monthProfit >= 0 ? ("emerald" as const) : ("slate" as const),
    },
    {
      title: "공실",
      value: `${vacantRooms}`,
      description: `입주율 ${occupancyRate}%`,
      tone: "slate" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-slate-950 shadow-sm">
        <div className="grid gap-5 p-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <p className="text-xs font-bold text-blue-700">오늘의 운영 요약</p>
            <h1 className="mt-2 max-w-4xl text-2xl font-black tracking-tight lg:text-3xl">
              수납, 미납, 계약 만료, 순이익을 한 화면에서 확인하세요.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              오늘 처리할 일과 이번 달 현금 흐름을 먼저 보여주도록 대시보드를 정리했습니다.
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

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">오늘 처리할 일</h2>
              <p className="mt-1 text-sm text-slate-500">
                미납, 계약 만료, 공실을 우선순위로 보여줍니다.
              </p>
            </div>
            <Link to="/alerts" className="text-sm font-black text-blue-600">
              전체 보기
            </Link>
          </div>
          <div className="mt-5 space-y-2">
            {todayTasks.length === 0 && (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                오늘 바로 처리할 일이 없습니다.
              </p>
            )}
            {todayTasks.map((task, index) => (
              <Link
                key={`${task.title}-${index}`}
                to={task.href}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {task.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {task.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-black text-slate-400">이동</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-rose-700">계약 만료 구간</h2>
          <p className="mt-1 text-sm text-slate-500">
            30/60/90일 안에 끝나는 계약을 빠르게 확인합니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Bucket label="30일 이내" value={expiringBuckets.d30} tone="text-red-600" />
            <Bucket label="60일 이내" value={expiringBuckets.d60} tone="text-amber-600" />
            <Bucket label="90일 이내" value={expiringBuckets.d90} tone="text-blue-600" />
          </div>
        </section>
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

function Bucket({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}건</p>
    </div>
  );
}

export default DashboardOverview;
