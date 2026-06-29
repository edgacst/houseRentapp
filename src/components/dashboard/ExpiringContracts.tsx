import { useAppData } from "../../context/AppContext";

function ExpiringContracts() {
  const { properties, rooms, tenants, contracts } = useAppData();
  const today = new Date();
  const upcoming = contracts
    .map((contract) => {
      const diffTime = new Date(contract.endDate).getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...contract, daysLeft };
    })
    .filter((contract) => contract.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-rose-700">계약 만료 예정</h2>
      <p className="mt-1 text-sm text-slate-500">
        가까운 만료일 순서로 표시합니다.
      </p>

      <div className="mt-5 space-y-2">
        {upcoming.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            만료 예정 계약이 없습니다.
          </p>
        )}
        {upcoming.map((contract) => {
          const property = properties.find((item) => item.id === contract.propertyId);
          const room = rooms.find((item) => item.id === contract.roomId);
          const tenant = tenants.find((item) => item.id === contract.tenantId);
          return (
            <div
              key={contract.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3"
            >
              <p className="min-w-0 truncate text-sm font-bold text-slate-900">
                {property?.name ?? "미등록 건물"} {room?.name ?? ""}
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-medium text-slate-500">
                  {tenant?.name ?? "임차인 미연결"}
                </span>
              </p>
              <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                D-{contract.daysLeft}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ExpiringContracts;
