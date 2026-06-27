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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">계약 만료 예정</h2>
      <p className="mt-1 text-sm text-slate-500">곧 만료되는 계약입니다.</p>

      <div className="mt-5 space-y-3">
        {upcoming.map((contract) => {
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
                <p className="mt-1 text-sm text-slate-500">{tenant?.name}</p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
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
