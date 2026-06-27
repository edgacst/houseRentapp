import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type {
  MaintenanceCharge,
  MaintenanceChargeStatus,
} from "../types/business";

const statusText: Record<MaintenanceChargeStatus, string> = {
  paid: "납부 완료",
  unpaid: "미납",
  late: "연체",
};

const statusClass: Record<MaintenanceChargeStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-amber-50 text-amber-700",
  late: "bg-red-50 text-red-700",
};

export default function Maintenance() {
  const {
    properties,
    rooms,
    maintenanceCharges,
    upsertMaintenanceCharge,
    deleteMaintenanceCharge,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<MaintenanceCharge | null>(null);
  const [form, setForm] = useState<MaintenanceCharge>(createEmptyCharge());

  function createEmptyCharge(): MaintenanceCharge {
    const firstProperty = properties[0];
    const firstRoom = rooms.find((room) => room.propertyId === firstProperty?.id);
    const now = new Date();
    const billingMonth = now.toISOString().slice(0, 7);
    return {
      id: "",
      propertyId: firstProperty?.id ?? "",
      roomId: firstRoom?.id ?? "",
      title: "관리비",
      billingMonth,
      dueDate: `${billingMonth}-25`,
      amount: firstRoom?.maintenanceFee ?? 0,
      status: "unpaid",
      paidDate: "",
      memo: "",
    };
  }

  const availableRooms = rooms.filter((room) => room.propertyId === form.propertyId);

  const filteredCharges = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return maintenanceCharges.filter((charge) => {
      const property = properties.find((item) => item.id === charge.propertyId);
      const room = rooms.find((item) => item.id === charge.roomId);
      return [property?.name, room?.name, charge.title, charge.billingMonth]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerKeyword));
    });
  }, [keyword, maintenanceCharges, properties, rooms]);

  const paidTotal = maintenanceCharges
    .filter((charge) => charge.status === "paid")
    .reduce((sum, charge) => sum + charge.amount, 0);
  const unpaidTotal = maintenanceCharges
    .filter((charge) => charge.status !== "paid")
    .reduce((sum, charge) => sum + charge.amount, 0);

  const openForm = (charge?: MaintenanceCharge) => {
    setEditingCharge(charge ?? null);
    setForm(charge ?? createEmptyCharge());
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingCharge(null);
    setIsOpen(false);
  };

  const getPropertyName = (propertyId: string) =>
    properties.find((property) => property.id === propertyId)?.name ?? "-";

  const getRoomName = (roomId?: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "건물 공통";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-blue-600">Maintenance</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              관리비 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              건물 공통 관리비와 호실별 관리비 청구, 납부, 미납 상태를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            disabled={properties.length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 관리비 등록
          </button>
        </div>

        {properties.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            관리비 등록 전 건물을 먼저 등록하세요.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 청구" value={`${maintenanceCharges.length}건`} />
          <SummaryCard
            label="납부 완료"
            value={`${maintenanceCharges.filter((item) => item.status === "paid").length}건`}
          />
          <SummaryCard label="납부액" value={`${paidTotal.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="미납액" value={`${unpaidTotal.toLocaleString("ko-KR")}원`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="건물, 호실, 청구명, 청구월 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await upsertMaintenanceCharge({
                ...form,
                paidDate:
                  form.status === "paid"
                    ? form.paidDate || new Date().toISOString().slice(0, 10)
                    : "",
              });
              closeForm();
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-black text-slate-950">
              {editingCharge ? "관리비 수정" : "관리비 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">건물</span>
                <select
                  value={form.propertyId}
                  required
                  onChange={(event) => {
                    const firstRoom = rooms.find(
                      (room) => room.propertyId === event.target.value,
                    );
                    setForm({
                      ...form,
                      propertyId: event.target.value,
                      roomId: firstRoom?.id ?? "",
                      amount: firstRoom?.maintenanceFee ?? form.amount,
                    });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">건물 선택</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">호실</span>
                <select
                  value={form.roomId ?? ""}
                  onChange={(event) => {
                    const room = rooms.find((item) => item.id === event.target.value);
                    setForm({
                      ...form,
                      roomId: event.target.value,
                      amount: room?.maintenanceFee ?? form.amount,
                    });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">건물 공통</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </label>

              <TextField
                label="청구명"
                value={form.title}
                placeholder="예: 6월 관리비"
                onChange={(value) => setForm({ ...form, title: value })}
              />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">청구월</span>
                <input
                  type="month"
                  value={form.billingMonth}
                  required
                  onChange={(event) =>
                    setForm({ ...form, billingMonth: event.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
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
                label="청구 금액"
                value={form.amount}
                placeholder="예: 50000"
                suffix="원"
                onChange={(value) => setForm({ ...form, amount: value })}
              />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">납부 상태</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as MaintenanceChargeStatus,
                    })
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
                placeholder="부과 기준, 정산 메모, 참고사항을 입력하세요."
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <FormActions onCancel={closeForm} />
          </form>
        )}

        <div className="space-y-3">
          {filteredCharges.map((charge) => (
            <div
              key={charge.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    {charge.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {getPropertyName(charge.propertyId)} · {getRoomName(charge.roomId)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {charge.billingMonth} · 납부 예정 {charge.dueDate} · 납부일{" "}
                    {charge.paidDate || "-"}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {charge.amount.toLocaleString("ko-KR")}원
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[charge.status]}`}
                  >
                    {statusText[charge.status]}
                  </span>
                  {charge.status !== "paid" && (
                    <button
                      onClick={() =>
                        void upsertMaintenanceCharge({
                          ...charge,
                          status: "paid",
                          paidDate: new Date().toISOString().slice(0, 10),
                        })
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                    >
                      납부
                    </button>
                  )}
                  <button
                    onClick={() => openForm(charge)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => void deleteMaintenanceCharge(charge.id)}
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

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      />
    </label>
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
