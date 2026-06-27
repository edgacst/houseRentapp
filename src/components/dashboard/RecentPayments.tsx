import { Link } from "react-router-dom";
import { useAppData } from "../../context/AppContext";

const statusText = {
  paid: "납부완료",
  unpaid: "미납",
  late: "연체",
};

function RecentPayments() {
  const { properties, rooms, tenants, contracts, rentPayments } = useAppData();
  const recentPayments = rentPayments.slice(0, 4);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">최근 월세</h2>
          <p className="mt-1 text-sm text-slate-500">
            청구와 수납 상태를 빠르게 확인합니다.
          </p>
        </div>
        <Link to="/rents" className="text-sm font-bold text-blue-600">
          전체보기
        </Link>
      </div>

      <div className="space-y-2">
        {recentPayments.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            월세 데이터가 없습니다.
          </p>
        )}
        {recentPayments.map((payment) => {
          const contract = contracts.find((item) => item.id === payment.contractId);
          const property = properties.find((item) => item.id === contract?.propertyId);
          const room = rooms.find((item) => item.id === contract?.roomId);
          const tenant = tenants.find((item) => item.id === contract?.tenantId);
          return (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {property?.name ?? "미등록 건물"} {room?.name ?? ""}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {tenant?.name ?? "임차인 미연결"} ·{" "}
                  {(payment.rentAmount + payment.maintenanceFee).toLocaleString("ko-KR")}원
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  payment.status === "paid"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {statusText[payment.status]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RecentPayments;
