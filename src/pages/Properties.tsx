import { useMemo, useState } from "react";
import PropertyList from "../components/property/PropertyList";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Property, PropertyType } from "../types/property";

const propertyTypes: PropertyType[] = ["오피스텔", "빌라", "상가", "아파트", "원룸"];

function Properties() {
  const { properties, rooms, addProperty, updateProperty, deleteProperty } =
    useAppData();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<Omit<Property, "id">>({
    name: "",
    address: "",
    type: "오피스텔",
  });

  const filteredProperties = useMemo(() => {
    const keyword = search.toLowerCase();
    return properties.filter(
      (property) =>
        property.name.toLowerCase().includes(keyword) ||
        property.address.toLowerCase().includes(keyword) ||
        property.type.toLowerCase().includes(keyword),
    );
  }, [properties, search]);

  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter((room) => room.status === "vacant").length;

  const openCreateForm = () => {
    setEditingProperty(null);
    setForm({ name: "", address: "", type: "오피스텔" });
    setIsOpen(true);
  };

  const openEditForm = (property: Property) => {
    setEditingProperty(property);
    setForm({
      name: property.name,
      address: property.address,
      type: property.type,
    });
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingProperty(null);
    setForm({ name: "", address: "", type: "오피스텔" });
    setIsOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingProperty) {
      updateProperty({ ...editingProperty, ...form });
    } else {
      addProperty(form);
    }
    closeForm();
  };

  const handleDelete = (propertyId: string) => {
    if (!window.confirm("건물을 삭제하면 연결된 호실, 계약, 월세도 삭제됩니다. 계속할까요?")) {
      return;
    }
    deleteProperty(propertyId);
  };

  return (
    <MainLayout>
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">부동산 관리</h1>
          <p className="mt-2 text-slate-500">
            건물, 호실, 공실 상태를 한 곳에서 관리합니다.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 건물 등록
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard title="총 건물" value={`${properties.length}개`} />
        <SummaryCard title="총 호실" value={`${totalRooms}개`} />
        <SummaryCard title="공실" value={`${vacantRooms}개`} />
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="건물명, 주소, 유형으로 검색"
          className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {isOpen && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            {editingProperty ? "건물 수정" : "건물 등록"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <FormInput
              label="건물명"
              value={form.name}
              placeholder="예: 강남 오피스텔"
              onChange={(value) => setForm({ ...form, name: value })}
            />
            <FormInput
              label="주소"
              value={form.address}
              placeholder="예: 서울 강남구 테헤란로 100"
              onChange={(value) => setForm({ ...form, address: value })}
            />
            <div>
              <label className="text-sm font-semibold text-slate-700">유형</label>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as PropertyType })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              >
                {propertyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      <PropertyList
        properties={filteredProperties}
        rooms={rooms}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />
    </MainLayout>
  );
}

function FormInput({
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
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default Properties;
