import { useAppData } from "../../context/AppContext";

function VacancyStatus() {
  const { properties, rooms } = useAppData();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-amber-700">공실 현황</h2>
      <p className="mt-1 text-sm text-slate-500">건물별 공실 비율입니다.</p>

      <div className="mt-5 space-y-4">
        {properties.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            건물을 등록하면 공실 현황이 표시됩니다.
          </p>
        )}
        {properties.map((property) => {
          const propertyRooms = rooms.filter((room) => room.propertyId === property.id);
          const vacant = propertyRooms.filter((room) => room.status === "vacant").length;
          const rate = propertyRooms.length
            ? Math.round((vacant / propertyRooms.length) * 100)
            : 0;

          return (
            <div key={property.id}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">{property.name}</span>
                <span className="text-slate-500">
                  공실 {vacant} / 전체 {propertyRooms.length}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-amber-500"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default VacancyStatus;
