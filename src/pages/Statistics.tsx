import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";

export default function Statistics() {
  const { properties, rooms, contracts, rentPayments } = useAppData();
  const occupied = rooms.filter((room) => room.status === "occupied").length;
  const vacancy = rooms.filter((room) => room.status === "vacant").length;
  const activeContracts = contracts.filter((contract) => contract.status === "active");
  const expectedMonthly = activeContracts.reduce(
    (sum, contract) => sum + contract.monthlyRent + contract.maintenanceFee,
    0,
  );
  const collected = rentPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const unpaid = rentPayments
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">통계</h1>
          <p className="mt-1 text-sm text-slate-500">
            임대 현황과 월세 수납 흐름을 한눈에 확인합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="건물" value={`${properties.length}개`} />
          <SummaryCard label="호실" value={`${rooms.length}개`} />
          <SummaryCard label="입주율" value={`${rooms.length ? Math.round((occupied / rooms.length) * 100) : 0}%`} />
          <SummaryCard label="공실" value={`${vacancy}개`} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="예상 월수입"
            value={`${expectedMonthly.toLocaleString("ko-KR")}원`}
          />
          <SummaryCard label="수납액" value={`${collected.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="미납액" value={`${unpaid.toLocaleString("ko-KR")}원`} />
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">건물별 호실 현황</h2>
          <div className="mt-4 space-y-3">
            {properties.map((property) => {
              const propertyRooms = rooms.filter(
                (room) => room.propertyId === property.id,
              );
              const propertyOccupied = propertyRooms.filter(
                (room) => room.status === "occupied",
              ).length;
              const rate = propertyRooms.length
                ? Math.round((propertyOccupied / propertyRooms.length) * 100)
                : 0;
              return (
                <div key={property.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{property.name}</span>
                    <span className="text-slate-500">{rate}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
