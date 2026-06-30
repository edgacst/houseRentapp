import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Contract, ContractStatus } from "../types/business";

const statusText: Record<ContractStatus, string> = {
  active: "진행 중",
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
  attachmentName: "",
  attachmentData: "",
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
  const [form, setForm] = useState<Contract>(createEmptyContract());

  function createEmptyContract(): Contract {
    const firstPropertyId = properties[0]?.id ?? "";
    const firstRoom = rooms.find((room) => room.propertyId === firstPropertyId);
    return {
      ...emptyContract,
      propertyId: firstPropertyId,
      roomId: firstRoom?.id ?? "",
      tenantId: tenants[0]?.id ?? "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: nextYearDate(),
      deposit: firstRoom?.deposit ?? 0,
      monthlyRent: firstRoom?.monthlyRent ?? 0,
      maintenanceFee: firstRoom?.maintenanceFee ?? 0,
    };
  }

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
    setEditingContract(contract ?? null);
    setForm(contract ?? createEmptyContract());
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

  const handleAttachmentChange = async (file?: File) => {
    if (!file) return;
    const attachmentData = await readFileAsDataUrl(file);
    setForm({ ...form, attachmentName: file.name, attachmentData });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-blue-600">Contract</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              계약 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              건물, 호실, 임차인을 연결하고 계약 기간, 보증금, 월세, 계약서 첨부를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            disabled={properties.length === 0 || rooms.length === 0 || tenants.length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 계약 등록
          </button>
        </div>

        {(properties.length === 0 || rooms.length === 0 || tenants.length === 0) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            계약 등록 전 건물, 호실, 임차인이 필요합니다.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 계약" value={`${contracts.length}건`} />
          <SummaryCard
            label="진행 중"
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
            placeholder="건물, 호실, 임차인으로 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await upsertContract(form);
              closeForm();
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-black text-slate-950">
              {editingContract ? "계약 수정" : "계약 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="건물"
                value={form.propertyId}
                onChange={(value) => {
                  const firstRoom = rooms.find((room) => room.propertyId === value);
                  setForm({
                    ...form,
                    propertyId: value,
                    roomId: firstRoom?.id ?? "",
                    deposit: firstRoom?.deposit ?? 0,
                    monthlyRent: firstRoom?.monthlyRent ?? 0,
                    maintenanceFee: firstRoom?.maintenanceFee ?? 0,
                  });
                }}
                options={properties.map((property) => ({
                  label: property.name,
                  value: property.id,
                }))}
              />
              <SelectField
                label="호실"
                value={form.roomId}
                onChange={handleRoomChange}
                options={availableRooms.map((room) => ({
                  label: `${room.name} (${room.status === "vacant" ? "공실" : "사용 중"})`,
                  value: room.id,
                }))}
              />
              <SelectField
                label="임차인"
                value={form.tenantId}
                onChange={(value) => setForm({ ...form, tenantId: value })}
                options={tenants.map((tenant) => ({
                  label: tenant.name,
                  value: tenant.id,
                }))}
              />
              <DateField
                label="계약 시작일"
                value={form.startDate}
                onChange={(value) => setForm({ ...form, startDate: value })}
              />
              <DateField
                label="계약 종료일"
                value={form.endDate}
                onChange={(value) => setForm({ ...form, endDate: value })}
              />
              <NumberField
                label="월세 납부일"
                value={form.paymentDay}
                placeholder="예: 5"
                suffix="일"
                onChange={(value) => setForm({ ...form, paymentDay: value })}
              />
              <NumberField
                label="보증금"
                value={form.deposit}
                placeholder="예: 5000000"
                suffix="원"
                onChange={(value) => setForm({ ...form, deposit: value })}
              />
              <NumberField
                label="월세"
                value={form.monthlyRent}
                placeholder="예: 450000"
                suffix="원"
                onChange={(value) => setForm({ ...form, monthlyRent: value })}
              />
              <NumberField
                label="관리비"
                value={form.maintenanceFee}
                placeholder="예: 50000"
                suffix="원"
                onChange={(value) => setForm({ ...form, maintenanceFee: value })}
              />
              <SelectField
                label="계약 상태"
                value={form.status}
                onChange={(value) =>
                  setForm({ ...form, status: value as ContractStatus })
                }
                options={Object.entries(statusText).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-4">
              <label className="text-sm font-bold text-slate-700">
                계약서 첨부
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(event) =>
                  void handleAttachmentChange(event.target.files?.[0])
                }
                className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
              />
              {form.attachmentName && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-sm font-bold text-slate-800">
                    {form.attachmentName}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        attachmentName: "",
                        attachmentData: "",
                      })
                    }
                    className="text-sm font-bold text-red-600"
                  >
                    첨부 제거
                  </button>
                </div>
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">메모</span>
              <textarea
                value={form.memo}
                onChange={(event) => setForm({ ...form, memo: event.target.value })}
                placeholder="특약, 갱신 조건, 참고사항을 입력하세요."
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <FormActions onCancel={closeForm} />
          </form>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredContracts.map((contract) => {
            const property = properties.find((item) => item.id === contract.propertyId);
            const room = rooms.find((item) => item.id === contract.roomId);
            const tenant = tenants.find((item) => item.id === contract.tenantId);
            return (
              <div
                key={contract.id}
                className="group flex aspect-square min-h-[270px] flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-blue-600">
                        Contract
                      </p>
                      <h2 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-slate-950">
                        {property?.name ?? "-"}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                      {statusText[contract.status]}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-900">
                        {room?.name ?? "호실 미지정"}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-500">
                        {tenant?.name ?? "-"}
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {contract.startDate} ~ {contract.endDate}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MoneyBox
                      label="보증금"
                      value={`${contract.deposit.toLocaleString("ko-KR")}원`}
                    />
                    <MoneyBox
                      label="월 납부"
                      value={`${(contract.monthlyRent + contract.maintenanceFee).toLocaleString("ko-KR")}원`}
                    />
                  </div>

                    {contract.attachmentName && contract.attachmentData && (
                      <a
                        href={contract.attachmentData}
                        download={contract.attachmentName}
                        className="mt-3 inline-flex max-w-full truncate text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        계약서 내려받기: {contract.attachmentName}
                      </a>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openForm(contract)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm("계약을 삭제하면 연결된 월세도 삭제됩니다. 계속할까요?")) return;
                        void deleteContract(contract.id);
                      }}
                      className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                    >
                      삭제
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      >
        <option value="">선택</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type="date"
        value={value}
        required
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

function MoneyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
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

function nextYearDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
