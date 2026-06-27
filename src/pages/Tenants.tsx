import { useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Tenant } from "../types/business";

const emptyTenant: Tenant = { id: "", name: "", phone: "", email: "", memo: "" };

export default function Tenants() {
  const {
    properties,
    tenants,
    contracts,
    rooms,
    upsertTenant,
    deleteTenant,
    upsertContract,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<Tenant>(emptyTenant);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const availableRooms = rooms.filter(
    (room) => !selectedPropertyId || room.propertyId === selectedPropertyId,
  );

  function getTenantLink(tenantId: string) {
    const contract = contracts.find(
      (item) => item.tenantId === tenantId && item.status === "active",
    );
    const room = rooms.find((item) => item.id === contract?.roomId);
    const property = properties.find((item) => item.id === room?.propertyId);

    if (!room || !property) return null;

    return {
      contract,
      room,
      property,
      roomName: room.name,
      propertyName: property.name,
    };
  }

  const openForm = (tenant?: Tenant) => {
    const link = tenant ? getTenantLink(tenant.id) : null;
    const defaultPropertyId = link?.property.id ?? properties[0]?.id ?? "";
    const defaultRoomId =
      link?.room.id ??
      rooms.find((room) => room.propertyId === defaultPropertyId)?.id ??
      "";

    setEditingTenant(tenant ?? null);
    setForm(tenant ?? emptyTenant);
    setSelectedPropertyId(defaultPropertyId);
    setSelectedRoomId(defaultRoomId);
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingTenant(null);
    setForm(emptyTenant);
    setSelectedPropertyId("");
    setSelectedRoomId("");
    setIsOpen(false);
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedRoomId(rooms.find((room) => room.propertyId === propertyId)?.id ?? "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
      const selectedProperty = properties.find(
        (property) => property.id === selectedRoom?.propertyId,
      );
      const memoParts = [
        form.memo,
        selectedProperty && selectedRoom
          ? `${selectedProperty.name} ${selectedRoom.name} 연결`
          : "",
      ].filter(Boolean);

      const savedTenant = await upsertTenant({
        ...form,
        memo: memoParts.join(" · "),
      });

      if (selectedRoom) {
        const currentContract = contracts.find(
          (contract) =>
            contract.tenantId === savedTenant.id && contract.status === "active",
        );
        await upsertContract({
          id: currentContract?.id ?? "",
          propertyId: selectedRoom.propertyId,
          roomId: selectedRoom.id,
          tenantId: savedTenant.id,
          startDate:
            currentContract?.startDate ?? new Date().toISOString().slice(0, 10),
          endDate: currentContract?.endDate ?? nextYearDate(),
          deposit: selectedRoom.deposit,
          monthlyRent: selectedRoom.monthlyRent,
          maintenanceFee: selectedRoom.maintenanceFee,
          paymentDay: currentContract?.paymentDay ?? 5,
          status: "active",
          memo: currentContract?.memo ?? "임차인 등록에서 생성",
          attachmentName: currentContract?.attachmentName ?? "",
          attachmentData: currentContract?.attachmentData ?? "",
        });
      }

      closeForm();
    } finally {
      setIsSaving(false);
    }
  };

  const lowerKeyword = keyword.toLowerCase();
  const filteredTenants = tenants.filter((tenant) => {
    const link = getTenantLink(tenant.id);
    return (
      tenant.name.toLowerCase().includes(lowerKeyword) ||
      tenant.phone.toLowerCase().includes(lowerKeyword) ||
      tenant.email?.toLowerCase().includes(lowerKeyword) ||
      link?.propertyName.toLowerCase().includes(lowerKeyword) ||
      link?.roomName.toLowerCase().includes(lowerKeyword)
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-blue-600">Tenant</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              임차인 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              임차인 연락처와 거주 건물, 호실 연결 정보를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            disabled={properties.length === 0 || rooms.length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 임차인 등록
          </button>
        </div>

        {(properties.length === 0 || rooms.length === 0) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            임차인 등록 전 건물과 호실을 먼저 등록하세요.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="전체 임차인" value={`${tenants.length}명`} />
          <SummaryCard
            label="계약 중"
            value={`${contracts.filter((item) => item.status === "active").length}명`}
          />
          <SummaryCard
            label="미연결"
            value={`${tenants.filter((tenant) => !getTenantLink(tenant.id)).length}명`}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 전화번호, 이메일, 건물, 호실 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-black text-slate-950">
              {editingTenant ? "임차인 수정" : "임차인 등록"}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="이름"
                value={form.name}
                placeholder="예: 김하늘"
                required
                onChange={(value) => setForm({ ...form, name: value })}
              />
              <Input
                label="전화번호"
                value={form.phone}
                placeholder="예: 010-1234-5678"
                required
                onChange={(value) => setForm({ ...form, phone: value })}
              />
              <Input
                label="이메일"
                value={form.email ?? ""}
                placeholder="예: tenant@example.com"
                onChange={(value) => setForm({ ...form, email: value })}
              />
              <Input
                label="메모"
                value={form.memo ?? ""}
                placeholder="특이사항"
                onChange={(value) => setForm({ ...form, memo: value })}
              />
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">거주 정보</p>
              <p className="mt-1 text-xs text-slate-500">
                임차인을 등록하면서 건물과 호실을 함께 연결합니다.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <select
                  value={selectedPropertyId}
                  required
                  onChange={(event) => handlePropertyChange(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">건물 선택</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRoomId}
                  required
                  onChange={(event) => setSelectedRoomId(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">호실 선택</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} · {room.status === "vacant" ? "공실" : "사용 중"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <FormActions onCancel={closeForm} isSaving={isSaving} />
          </form>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTenants.map((tenant) => {
            const link = getTenantLink(tenant.id);
            return (
              <div
                key={tenant.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {tenant.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{tenant.phone}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {tenant.email || "-"}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {link ? `${link.propertyName} ${link.roomName}` : "미연결"}
                  </span>
                </div>
                {tenant.memo && (
                  <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {tenant.memo}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => openForm(tenant)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (
                        !confirm(
                          "임차인을 삭제하면 연결된 계약과 월세도 삭제됩니다. 계속할까요?",
                        )
                      ) {
                        return;
                      }
                      void deleteTenant(tenant.id);
                    }}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
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

function Input({
  label,
  value,
  placeholder,
  required,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function FormActions({
  onCancel,
  isSaving,
}: {
  onCancel: () => void;
  isSaving: boolean;
}) {
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
        disabled={isSaving}
        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSaving ? "저장 중" : "저장"}
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

function nextYearDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}
