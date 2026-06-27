import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Tenant } from "../types/business";

const emptyTenant: Tenant = { id: "", name: "", phone: "", email: "", memo: "" };

export default function Tenants() {
  const { tenants, contracts, rooms, upsertTenant, deleteTenant } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<Tenant>(emptyTenant);

  const filteredTenants = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(lowerKeyword) ||
        tenant.phone.toLowerCase().includes(lowerKeyword) ||
        tenant.email?.toLowerCase().includes(lowerKeyword),
    );
  }, [keyword, tenants]);

  const getRoomName = (tenantId: string) => {
    const contract = contracts.find(
      (item) => item.tenantId === tenantId && item.status === "active",
    );
    return rooms.find((room) => room.id === contract?.roomId)?.name;
  };

  const openForm = (tenant?: Tenant) => {
    setEditingTenant(tenant ?? null);
    setForm(tenant ?? emptyTenant);
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingTenant(null);
    setForm(emptyTenant);
    setIsOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">임차인 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              임차인 연락처와 계약 연결 정보를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            + 임차인 등록
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="전체 임차인" value={`${tenants.length}명`} />
          <SummaryCard
            label="계약중"
            value={`${contracts.filter((item) => item.status === "active").length}명`}
          />
          <SummaryCard
            label="미연결"
            value={`${tenants.filter((tenant) => !getRoomName(tenant.id)).length}명`}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 전화번호, 이메일 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              upsertTenant(form);
              closeForm();
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {editingTenant ? "임차인 수정" : "임차인 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={form.name}
                placeholder="이름"
                required
                onChange={(value) => setForm({ ...form, name: value })}
              />
              <Input
                value={form.phone}
                placeholder="전화번호"
                required
                onChange={(value) => setForm({ ...form, phone: value })}
              />
              <Input
                value={form.email ?? ""}
                placeholder="이메일"
                onChange={(value) => setForm({ ...form, email: value })}
              />
              <Input
                value={form.memo ?? ""}
                placeholder="메모"
                onChange={(value) => setForm({ ...form, memo: value })}
              />
            </div>
            <FormActions onCancel={closeForm} />
          </form>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {tenant.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{tenant.phone}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {tenant.email || "-"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {getRoomName(tenant.id) || "미연결"}
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    if (!confirm("임차인을 삭제하면 연결된 계약과 월세도 삭제됩니다. 계속할까요?")) return;
                    deleteTenant(tenant.id);
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function Input({
  value,
  placeholder,
  required,
  onChange,
}: {
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
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
