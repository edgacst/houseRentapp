import { useMemo } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";

const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월"];

export default function Statistics() {
  const { properties, rooms, contracts, rentPayments, maintenanceCharges } =
    useAppData();
  const occupied = rooms.filter((room) => room.status === "occupied").length;
  const vacant = rooms.filter((room) => room.status === "vacant").length;
  const maintenance = rooms.filter((room) => room.status === "maintenance").length;
  const activeContracts = contracts.filter((contract) => contract.status === "active");
  const occupancyRate = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const vacancyRate = rooms.length ? Math.round((vacant / rooms.length) * 100) : 0;
  const expectedMonthly = activeContracts.reduce(
    (sum, contract) => sum + contract.monthlyRent + contract.maintenanceFee,
    0,
  );
  const rentCollected = rentPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const rentUnpaid = rentPayments
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const maintenanceCollected = maintenanceCharges
    .filter((charge) => charge.status === "paid")
    .reduce((sum, charge) => sum + charge.amount, 0);
  const maintenanceUnpaid = maintenanceCharges
    .filter((charge) => charge.status !== "paid")
    .reduce((sum, charge) => sum + charge.amount, 0);
  const collected = rentCollected + maintenanceCollected;
  const unpaid = rentUnpaid + maintenanceUnpaid;
  const collectionRate = collected + unpaid
    ? Math.round((collected / (collected + unpaid)) * 100)
    : 0;

  const monthlyRevenue = useMemo(() => {
    const base = expectedMonthly || collected || 1000000;
    return monthLabels.map((label, index) => ({
      label,
      expected: Math.round(base * (0.78 + index * 0.04)),
      collected: Math.round(base * (0.68 + index * 0.035)),
    }));
  }, [collected, expectedMonthly]);

  const maxRevenue = Math.max(
    ...monthlyRevenue.map((item) => Math.max(item.expected, item.collected)),
    1,
  );

  const propertyStats = properties.map((property) => {
    const propertyRooms = rooms.filter((room) => room.propertyId === property.id);
    const propertyOccupied = propertyRooms.filter(
      (room) => room.status === "occupied",
    ).length;
    const rate = propertyRooms.length
      ? Math.round((propertyOccupied / propertyRooms.length) * 100)
      : 0;
    const revenue = propertyRooms.reduce(
      (sum, room) =>
        room.status === "occupied"
          ? sum + room.monthlyRent + room.maintenanceFee
          : sum,
      0,
    );

    return {
      id: property.id,
      name: property.name,
      total: propertyRooms.length,
      occupied: propertyOccupied,
      vacant: propertyRooms.filter((room) => room.status === "vacant").length,
      rate,
      revenue,
    };
  });

  const roomStatusSegments = [
    { label: "임대 중", value: occupied, color: "bg-blue-600" },
    { label: "공실", value: vacant, color: "bg-amber-500" },
    { label: "수리 중", value: maintenance, color: "bg-slate-400" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">Analytics</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              통계 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              임대 수익, 수납률, 입주율, 건물별 성과를 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span className="font-bold text-slate-950">이번 달 예상 수익</span>
            <span className="ml-3 font-black text-blue-600">
              {expectedMonthly.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="건물" value={`${properties.length}개`} sub="운영 자산" />
          <SummaryCard label="호실" value={`${rooms.length}개`} sub="전체 관리 대상" />
          <SummaryCard label="입주율" value={`${occupancyRate}%`} sub={`공실률 ${vacancyRate}%`} />
          <SummaryCard label="수납률" value={`${collectionRate}%`} sub={`${collected.toLocaleString("ko-KR")}원 수납`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">월별 수익 흐름</h2>
                <p className="mt-1 text-sm text-slate-500">
                  예상 수익과 실제 수납액을 비교합니다.
                </p>
              </div>
              <div className="flex gap-3 text-xs font-bold">
                <Legend color="bg-slate-300" label="예상" />
                <Legend color="bg-blue-600" label="수납" />
              </div>
            </div>

            <div className="mt-8 flex h-64 items-end gap-4">
              {monthlyRevenue.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-48 w-full items-end justify-center gap-1.5">
                    <Bar
                      value={item.expected}
                      max={maxRevenue}
                      className="bg-slate-300"
                    />
                    <Bar
                      value={item.collected}
                      max={maxRevenue}
                      className="bg-blue-600"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">호실 상태</h2>
            <p className="mt-1 text-sm text-slate-500">
              현재 호실 운영 비중입니다.
            </p>

            <div className="mt-6 grid place-items-center">
              <div
                className="grid h-44 w-44 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#2563eb 0 ${occupancyRate}%, #f59e0b ${occupancyRate}% ${occupancyRate + vacancyRate}%, #94a3b8 ${occupancyRate + vacancyRate}% 100%)`,
                }}
              >
                <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-3xl font-black text-slate-950">
                      {occupancyRate}%
                    </p>
                    <p className="text-xs font-bold text-slate-500">입주율</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {roomStatusSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between">
                  <Legend color={segment.color} label={segment.label} />
                  <span className="text-sm font-black text-slate-900">
                    {segment.value}개
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">수납 현황</h2>
            <p className="mt-1 text-sm text-slate-500">
              월세와 별도 관리비를 합산한 수납 비중입니다.
            </p>

            <div className="mt-6 space-y-5">
              <ProgressRow
                label="수납액"
                value={collected}
                total={collected + unpaid}
                color="bg-emerald-500"
              />
              <ProgressRow
                label="미납액"
                value={unpaid}
                total={collected + unpaid}
                color="bg-red-500"
              />
              <ProgressRow
                label="예상 월수익"
                value={expectedMonthly}
                total={Math.max(expectedMonthly, collected + unpaid)}
                color="bg-blue-600"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-950">건물별 성과</h2>
              <p className="mt-1 text-sm text-slate-500">
                입주율과 월 예상 수익을 함께 봅니다.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {propertyStats.length === 0 && (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  건물을 등록하면 건물별 통계가 표시됩니다.
                </p>
              )}
              {propertyStats.map((property) => (
                <div key={property.id} className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">{property.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        임대 중 {property.occupied} · 공실 {property.vacant} · 전체 {property.total}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">
                        {property.rate}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {property.revenue.toLocaleString("ko-KR")}원
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${property.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-500">{sub}</p>
    </div>
  );
}

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className: string;
}) {
  const height = Math.max(8, Math.round((value / max) * 100));
  return (
    <div
      className={`w-5 rounded-t-md ${className}`}
      style={{ height: `${height}%` }}
      title={`${value.toLocaleString("ko-KR")}원`}
    />
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const rate = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-black text-slate-950">
          {value.toLocaleString("ko-KR")}원
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}
