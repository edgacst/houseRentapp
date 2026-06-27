import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Contract, ContractStatus } from "../types/business";

const statusText: Record<ContractStatus, string> = {
  active: "진행중",
  scheduled: "예정",
  expired: "만료",
  terminated: "해지",
};

const emptyContract: Contract = {
  id: "",
  propertyId: "",
  roomId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  deposit: 0,
  monthlyRent: 0,
  maintenanceFee: 0,
  paymentDay: 5,
  status: "active",
  memo: "",
};

export default function Contracts() {
  const {
    properties,
    rooms,
    tenants,
    contracts,
    upsertContract,
    deleteContract,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [form, setForm] = useState<Contract>({
    ...emptyContract,
    propertyId: properties[0]?.id ?? "",
    roomId: rooms[0]?.id ?? "",
    tenantId: tenants[0]?.id ?? "",
  });

  const availableRooms = rooms.filter((room) => room.propertyId === form.propertyId);
  const filteredContracts = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return contracts.filter((contract) => {
      const property = properties.find((item) => item.id === contract.propertyId);
      const room = rooms.find((item) => item.id === contract.roomId);
      const tenant = tenants.find((item) => item.id === contract.tenantId);
      return [property?.name, room?.name, tenant?.name, tenant?.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerKeyword));
    });
  }, [contracts, keyword, properties, rooms, tenants]);

  const openForm = (contract?: Contract) => {
    const next = contract ?? {
      ...emptyContract,
      propertyId: properties[0]?.id ?? "",
      roomId: rooms[0]?.id ?? "",
      tenantId: tenants[0]?.id ?? "",
    };
    setEditingContract(contract ?? null);
    setForm(next);
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingContract(null);
    setIsOpen(false);
  };

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((item) => item.id === roomId);
    setForm({
      ...form,
      roomId,
      deposit: room?.deposit ?? form.deposit,
      monthlyRent: room?.monthlyRent ?? form.monthlyRent,
      maintenanceFee: room?.maintenanceFee ?? form.maintenanceFee,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">계약 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              건물, 호실, 임차인을 연결해 임대 계약을 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            + 계약 등록
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 계약" value={`${contracts.length}건`} />
          <SummaryCard
            label="진행중"
            value={`${contracts.filter((item) => item.status === "active").length}건`}
          />
          <SummaryCard
            label="만료 예정"
            value={`${contracts.filter((item) => item.status === "scheduled").length}건`}
          />
          <SummaryCard
            label="월 청구액"
            value={`${contracts
              .filter((item) => item.status === "active")
              .reduce((sum, item) => sum + item.monthlyRent + item.maintenanceFee, 0)
              .toLocaleString("ko-KR")}원`}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="건물, 호실, 임차인 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              upsertContract(form);
              closeForm();
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {editingContract ? "계약 수정" : "계약 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                value={form.propertyId}
                onChange={(value) => {
                  const firstRoom = rooms.find((room) => room.propertyId === value);
                  setForm({
                    ...form,
                    propertyId: value,
                    roomId: firstRoom?.id ?? "",
                  });
                }}
                options={properties.map((property) => ({
                  label: property.name,
                  value: property.id,
                }))}
              />
              <Select
                value={form.roomId}
                onChange={handleRoomChange}
                options={availableRooms.map((room) => ({
                  label: room.name,
                  value: room.id,
                }))}
              />
              <Select
                value={form.tenantId}
                onChange={(value) => setForm({ ...form, tenantId: value })}
                options={tenants.map((tenant) => ({
                  label: tenant.name,
                  value: tenant.id,
                }))}
              />
              <DateInput
                value={form.startDate}
                onChange={(value) => setForm({ ...form, startDate: value })}
              />
              <DateInput
                value={form.endDate}
                onChange={(value) => setForm({ ...form, endDate: value })}
              />
              <NumberInput
                value={form.paymentDay}
                placeholder="납부일"
                onChange={(value) => setForm({ ...form, paymentDay: value })}
              />
              <NumberInput
                value={form.deposit}
                placeholder="보증금"
                onChange={(value) => setForm({ ...form, deposit: value })}
              />
              <NumberInput
                value={form.monthlyRent}
                placeholder="월세"
                onChange={(value) => setForm({ ...form, monthlyRent: value })}
              />
              <NumberInput
                value={form.maintenanceFee}
                placeholder="관리비"
                onChange={(value) => setForm({ ...form, maintenanceFee: value })}
              />
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ContractStatus })
                }
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                {Object.entries(statusText).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={form.memo}
              onChange={(event) => setForm({ ...form, memo: event.target.value })}
              placeholder="메모"
              rows={3}
              className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                저장
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {filteredContracts.map((contract) => {
            const property = properties.find((item) => item.id === contract.propertyId);
            const room = rooms.find((item) => item.id === contract.roomId);
            const tenant = tenants.find((item) => item.id === contract.tenantId);
            return (
              <div
                key={contract.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {property?.name} {room?.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {tenant?.name} · {contract.startDate} ~ {contract.endDate}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      보증금 {contract.deposit.toLocaleString("ko-KR")}원 · 월{" "}
                      {(contract.monthlyRent + contract.maintenanceFee).toLocaleString("ko-KR")}원
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {statusText[contract.status]}
                    </span>
                    <button
                      onClick={() => openForm(contract)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm("계약을 삭제하면 연결된 월세도 삭제됩니다. 계속할까요?")) return;
                        deleteContract(contract.id);
                      }}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      required
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      required
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />
  );
}

function NumberInput({
  value,
  placeholder,
  onChange,
}: {
  value: number;
  placeholder: string;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(Number(event.target.value))}
      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
