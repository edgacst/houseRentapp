import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";

const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export default function Statistics() {
  const { properties, rooms, contracts, rentPayments, maintenanceCharges, expenses } =
    useAppData();
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const occupied = rooms.filter((room) => room.status === "occupied").length;
  const vacant = rooms.filter((room) => room.status === "vacant").length;
  const occupancyRate = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const vacancyRate = rooms.length ? Math.round((vacant / rooms.length) * 100) : 0;

  const annualRentIncome = rentPayments
    .filter((payment) => payment.status === "paid" && payment.paidDate?.startsWith(year))
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const annualMaintenanceIncome = maintenanceCharges
    .filter((charge) => charge.status === "paid" && charge.paidDate?.startsWith(year))
    .reduce((sum, charge) => sum + charge.amount, 0);
  const annualIncome = annualRentIncome + annualMaintenanceIncome;
  const annualExpense = expenses
    .filter((expense) => expense.expenseDate.startsWith(year))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const annualProfit = annualIncome - annualExpense;
  const totalInvestment = properties.reduce(
    (sum, property) =>
      sum +
      (property.purchasePrice ?? 0) +
      (property.acquisitionTax ?? 0) +
      (property.brokerageFee ?? 0) +
      (property.renovationCost ?? 0) +
      (property.otherPurchaseCost ?? 0),
    0,
  );
  const returnRate = totalInvestment
    ? (annualProfit / totalInvestment) * 100
    : 0;

  const monthlyProfit = useMemo(
    () =>
      monthLabels.map((label, index) => {
        const month = `${year}-${String(index + 1).padStart(2, "0")}`;
        const income =
          rentPayments
            .filter((payment) => payment.status === "paid" && payment.paidDate?.startsWith(month))
            .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0) +
          maintenanceCharges
            .filter((charge) => charge.status === "paid" && charge.paidDate?.startsWith(month))
            .reduce((sum, charge) => sum + charge.amount, 0);
        const expense = expenses
          .filter((item) => item.expenseDate.startsWith(month))
          .reduce((sum, item) => sum + item.amount, 0);
        return { label, income, expense, profit: income - expense };
      }),
    [expenses, maintenanceCharges, rentPayments, year],
  );

  const maxMonthly = Math.max(
    ...monthlyProfit.map((item) => Math.max(item.income, item.expense, Math.abs(item.profit))),
    1,
  );

  const propertyStats = properties.map((property) => {
    const propertyRooms = rooms.filter((room) => room.propertyId === property.id);
    const propertyOccupied = propertyRooms.filter(
      (room) => room.status === "occupied",
    ).length;
    const propertyContracts = contracts.filter(
      (contract) => contract.propertyId === property.id,
    );
    const contractIds = propertyContracts.map((contract) => contract.id);
    const income =
      rentPayments
        .filter(
          (payment) =>
            contractIds.includes(payment.contractId) &&
            payment.status === "paid" &&
            payment.paidDate?.startsWith(year),
        )
        .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0) +
      maintenanceCharges
        .filter(
          (charge) =>
            charge.propertyId === property.id &&
            charge.status === "paid" &&
            charge.paidDate?.startsWith(year),
        )
        .reduce((sum, charge) => sum + charge.amount, 0);
    const expense = expenses
      .filter(
        (item) =>
          item.propertyId === property.id && item.expenseDate.startsWith(year),
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const investment =
      (property.purchasePrice ?? 0) +
      (property.acquisitionTax ?? 0) +
      (property.brokerageFee ?? 0) +
      (property.renovationCost ?? 0) +
      (property.otherPurchaseCost ?? 0);
    const profit = income - expense;

    return {
      id: property.id,
      name: property.name,
      total: propertyRooms.length,
      occupied: propertyOccupied,
      vacant: propertyRooms.filter((room) => room.status === "vacant").length,
      rate: propertyRooms.length
        ? Math.round((propertyOccupied / propertyRooms.length) * 100)
        : 0,
      income,
      expense,
      profit,
      returnRate: investment ? (profit / investment) * 100 : 0,
    };
  });

  const collectionTarget = rentPayments.reduce(
    (sum, payment) => sum + payment.rentAmount + payment.maintenanceFee,
    0,
  );
  const collectionRate = collectionTarget
    ? Math.round((annualRentIncome / collectionTarget) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">Analytics</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              수익 통계
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              월세 수입, 지출, 순이익과 건물별 수익률을 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-bold text-slate-500">기준 연도</span>
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="w-24 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="연간 수입" value={`${annualIncome.toLocaleString("ko-KR")}원`} sub="월세 + 관리비 수납" tone="text-blue-600" />
          <SummaryCard label="연간 지출" value={`${annualExpense.toLocaleString("ko-KR")}원`} sub="수리비, 세금, 이자 등" tone="text-rose-600" />
          <SummaryCard label="연간 순이익" value={`${annualProfit.toLocaleString("ko-KR")}원`} sub="수입 - 지출" tone={annualProfit >= 0 ? "text-emerald-600" : "text-red-600"} />
          <SummaryCard label="연 수익률" value={`${returnRate.toFixed(2)}%`} sub="총 매입비용 대비" tone="text-slate-950" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-blue-700">월별 수익·지출·이익</h2>
                <p className="mt-1 text-sm text-slate-500">
                  월별 현금 흐름을 수입과 지출 기준으로 비교합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-bold">
                <Legend color="bg-blue-600" label="수입" />
                <Legend color="bg-rose-500" label="지출" />
                <Legend color="bg-emerald-500" label="순이익" />
              </div>
            </div>

            <div className="mt-8 flex h-64 items-end gap-3">
              {monthlyProfit.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-48 w-full items-end justify-center gap-1">
                    <Bar value={item.income} max={maxMonthly} className="bg-blue-600" />
                    <Bar value={item.expense} max={maxMonthly} className="bg-rose-500" />
                    <Bar value={Math.max(0, item.profit)} max={maxMonthly} className="bg-emerald-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-amber-700">호실 상태</h2>
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
              <StatusRow label="임대 중" value={occupied} color="bg-blue-600" />
              <StatusRow label="공실" value={vacant} color="bg-amber-500" />
              <StatusRow
                label="수납률"
                value={collectionRate}
                suffix="%"
                color="bg-emerald-500"
              />
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-emerald-700">건물별 손익</h2>
            <p className="mt-1 text-sm text-slate-500">
              건물별 연간 수입, 지출, 순이익과 수익률입니다.
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
                <div className="grid gap-4 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:items-center">
                  <div>
                    <p className="font-black text-slate-950">{property.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      임대 중 {property.occupied} · 공실 {property.vacant} · 전체 {property.total}
                    </p>
                  </div>
                  <Metric label="수입" value={property.income} tone="text-blue-600" />
                  <Metric label="지출" value={property.expense} tone="text-rose-600" />
                  <Metric label="순이익" value={property.profit} tone={property.profit >= 0 ? "text-emerald-600" : "text-red-600"} />
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500">수익률</p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {property.returnRate.toFixed(2)}%
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
    </MainLayout>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-black tracking-tight ${tone}`}>
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
  const height = value ? Math.max(8, Math.round((value / max) * 100)) : 2;
  return (
    <div
      className={`w-4 rounded-t-md ${className}`}
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

function StatusRow({
  label,
  value,
  suffix = "개",
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Legend color={color} label={label} />
      <span className="text-sm font-black text-slate-900">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="text-right">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${tone}`}>
        {value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}
