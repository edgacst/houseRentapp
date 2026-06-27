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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">최근 월세 입금</h2>
          <p className="mt-1 text-sm text-slate-500">
            최근 월세 청구와 수납 상태입니다.
          </p>
        </div>
        <Link to="/rents" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          전체보기
        </Link>
      </div>

      <div className="space-y-3">
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
                <p className="font-semibold text-slate-900">
                  {property?.name} {room?.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {tenant?.name} ·{" "}
                  {(payment.rentAmount + payment.maintenanceFee).toLocaleString("ko-KR")}원
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  payment.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
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
