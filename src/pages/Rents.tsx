import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { RentPayment, RentStatus } from "../types/business";

const statusText: Record<RentStatus, string> = {
  paid: "납부완료",
  unpaid: "미납",
  late: "연체",
};

const statusClass: Record<RentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-amber-50 text-amber-700",
  late: "bg-red-50 text-red-700",
};

export default function Rents() {
  const {
    properties,
    rooms,
    tenants,
    contracts,
    rentPayments,
    upsertRentPayment,
    deleteRentPayment,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RentPayment | null>(null);
  const [form, setForm] = useState<RentPayment>(createEmptyPayment());

  function createEmptyPayment(): RentPayment {
    const firstContract = contracts[0];
    return {
      id: "",
      contractId: firstContract?.id ?? "",
      dueDate: new Date().toISOString().slice(0, 10),
      paidDate: "",
      rentAmount: firstContract?.monthlyRent ?? 0,
      maintenanceFee: firstContract?.maintenanceFee ?? 0,
      status: "unpaid",
      memo: "",
    };
  }

  const filteredPayments = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return rentPayments.filter((payment) => {
      const contract = contracts.find((item) => item.id === payment.contractId);
      const property = properties.find((item) => item.id === contract?.propertyId);
      const room = rooms.find((item) => item.id === contract?.roomId);
      const tenant = tenants.find((item) => item.id === contract?.tenantId);
      return [property?.name, room?.name, tenant?.name, payment.dueDate]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerKeyword));
    });
  }, [contracts, keyword, properties, rentPayments, rooms, tenants]);

  const paidTotal = rentPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const unpaidTotal = rentPayments
    .filter((payment) => payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);

  const openForm = (payment?: RentPayment) => {
    setEditingPayment(payment ?? null);
    setForm(payment ?? createEmptyPayment());
    setIsOpen(true);
  };

  const getContractLabel = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId);
    const property = properties.find((item) => item.id === contract?.propertyId);
    const room = rooms.find((item) => item.id === contract?.roomId);
    const tenant = tenants.find((item) => item.id === contract?.tenantId);
    return `${property?.name ?? "-"} ${room?.name ?? "-"} · ${tenant?.name ?? "-"}`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-blue-600">Rent</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              월세 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              월세와 관리비 청구, 납부, 미납, 연체 상태를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            disabled={contracts.length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 월세 등록
          </button>
        </div>

        {contracts.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            월세 등록 전 진행중인 계약이 필요합니다.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 청구" value={`${rentPayments.length}건`} />
          <SummaryCard
            label="납부완료"
            value={`${rentPayments.filter((item) => item.status === "paid").length}건`}
          />
          <SummaryCard label="수납액" value={`${paidTotal.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="미납액" value={`${unpaidTotal.toLocaleString("ko-KR")}원`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="건물, 호실, 임차인, 납부예정일 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await upsertRentPayment({
                ...form,
                paidDate:
                  form.status === "paid"
                    ? form.paidDate || new Date().toISOString().slice(0, 10)
                    : "",
              });
              setIsOpen(false);
              setEditingPayment(null);
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-black text-slate-950">
              {editingPayment ? "월세 수정" : "월세 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">계약</span>
                <select
                  value={form.contractId}
                  required
                  onChange={(event) => {
                    const contract = contracts.find(
                      (item) => item.id === event.target.value,
                    );
                    setForm({
                      ...form,
                      contractId: event.target.value,
                      rentAmount: contract?.monthlyRent ?? form.rentAmount,
                      maintenanceFee:
                        contract?.maintenanceFee ?? form.maintenanceFee,
                    });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">선택</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {getContractLabel(contract.id)}
                    </option>
                  ))}
                </select>
              </label>
              <DateField
                label="납부 예정일"
                value={form.dueDate}
                onChange={(value) => setForm({ ...form, dueDate: value })}
              />
              <DateField
                label="실제 납부일"
                value={form.paidDate ?? ""}
                required={false}
                onChange={(value) => setForm({ ...form, paidDate: value })}
              />
              <NumberField
                label="월세"
                value={form.rentAmount}
                placeholder="예: 450000"
                suffix="원"
                onChange={(value) => setForm({ ...form, rentAmount: value })}
              />
              <NumberField
                label="관리비"
                value={form.maintenanceFee}
                placeholder="예: 50000"
                suffix="원"
                onChange={(value) => setForm({ ...form, maintenanceFee: value })}
              />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">납부 상태</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as RentStatus })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  {Object.entries(statusText).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">메모</span>
              <textarea
                value={form.memo}
                onChange={(event) => setForm({ ...form, memo: event.target.value })}
                placeholder="입금자명, 부분납, 특이사항을 입력하세요."
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <FormActions
              onCancel={() => {
                setIsOpen(false);
                setEditingPayment(null);
              }}
            />
          </form>
        )}

        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    {getContractLabel(payment.contractId)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    납부예정일 {payment.dueDate} · 납부일 {payment.paidDate || "-"}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {(payment.rentAmount + payment.maintenanceFee).toLocaleString("ko-KR")}원
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[payment.status]}`}
                  >
                    {statusText[payment.status]}
                  </span>
                  {payment.status !== "paid" && (
                    <button
                      onClick={() =>
                        void upsertRentPayment({
                          ...payment,
                          status: "paid",
                          paidDate: new Date().toISOString().slice(0, 10),
                        })
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                    >
                      수납
                    </button>
                  )}
                  <button
                    onClick={() => openForm(payment)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => void deleteRentPayment(payment.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function DateField({
  label,
  value,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type="date"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  placeholder: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="relative mt-2">
        <input
          type="number"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 ${
            suffix ? "pr-12" : ""
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
      >
        취소
      </button>
      <button
        type="submit"
        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
      >
        저장
      </button>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}
