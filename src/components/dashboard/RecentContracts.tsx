import { Link } from "react-router-dom";
import { useAppData } from "../../context/AppContext";

const statusText = {
  active: "계약중",
  scheduled: "예정",
  expired: "만료",
  terminated: "해지",
};

function RecentContracts() {
  const { properties, rooms, tenants, contracts } = useAppData();
  const recentContracts = contracts.slice(0, 4);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">최근 계약</h2>
          <p className="mt-1 text-sm text-slate-500">
            최근 등록된 임대차 계약입니다.
          </p>
        </div>
        <Link to="/contracts" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          전체보기
        </Link>
      </div>

      <div className="space-y-3">
        {recentContracts.map((contract) => {
          const property = properties.find((item) => item.id === contract.propertyId);
          const room = rooms.find((item) => item.id === contract.roomId);
          const tenant = tenants.find((item) => item.id === contract.tenantId);
          return (
            <div
              key={contract.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {property?.name} {room?.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {tenant?.name} · 종료일 {contract.endDate}
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {statusText[contract.status]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RecentContracts;
