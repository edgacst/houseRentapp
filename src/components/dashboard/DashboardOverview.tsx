import { useAppData } from "../../context/AppContext";
import DashboardCard from "../DashboardCard";
import ExpiringContracts from "./ExpiringContracts";
import RecentContracts from "./RecentContracts";
import RecentPayments from "./RecentPayments";
import VacancyStatus from "./VacancyStatus";

function DashboardOverview() {
  const { properties, rooms, contracts, rentPayments } = useAppData();
  const vacantRooms = rooms.filter((room) => room.status === "vacant").length;
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
      description: "등록된 전체 건물",
    },
    {
      title: "총 호실",
      value: `${rooms.length}`,
      description: "관리 중인 전체 호실",
    },
    {
      title: "공실",
      value: `${vacantRooms}`,
      description: "현재 비어있는 호실",
    },
    {
      title: "월 예상 수입",
      value: `${expectedMonthly.toLocaleString("ko-KR")}원`,
      description: `미납 ${unpaidTotal.toLocaleString("ko-KR")}원`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentContracts />
        <RecentPayments />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <VacancyStatus />
        <ExpiringContracts />
      </div>
    </div>
  );
}

export default DashboardOverview;
