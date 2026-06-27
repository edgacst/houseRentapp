import { useMemo, useState } from "react";
import PropertyList from "../components/property/PropertyList";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Property, PropertyType } from "../types/property";
import type { Room } from "../types/room";

const propertyTypes: PropertyType[] = ["오피스텔", "빌라", "상가", "아파트", "원룸"];

function Properties() {
  const {
    properties,
    rooms,
    addProperty,
    updateProperty,
    deleteProperty,
    upsertRoom,
  } = useAppData();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<Omit<Property, "id">>({
    name: "",
    address: "",
    type: "오피스텔",
  });
  const [initialRooms, setInitialRooms] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
    setInitialRooms("");
    setIsOpen(true);
  };

  const openEditForm = (property: Property) => {
    setEditingProperty(property);
    setForm({
      name: property.name,
      address: property.address,
      type: property.type,
    });
    setInitialRooms("");
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingProperty(null);
    setForm({ name: "", address: "", type: "오피스텔" });
    setInitialRooms("");
    setIsOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      if (editingProperty) {
        await updateProperty({ ...editingProperty, ...form });
        const roomNames = parseRoomNames(initialRooms);

        await Promise.all(
          roomNames.map((roomName) =>
            upsertRoom(createInitialRoom(editingProperty.id, roomName, form.type)),
          ),
        );
      } else {
        const createdProperty = await addProperty(form);
        const roomNames = parseRoomNames(initialRooms);

        await Promise.all(
          roomNames.map((roomName) =>
            upsertRoom(createInitialRoom(createdProperty.id, roomName, form.type)),
          ),
        );
      }

      closeForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (propertyId: string) => {
    if (
      !window.confirm(
        "건물을 삭제하면 연결된 호실, 계약, 월세도 삭제됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    deleteProperty(propertyId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">Property</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              부동산 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              건물을 등록하고, 초기 호실을 함께 만들어 임대 관리의 기본 구조를 잡습니다.
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            + 건물 등록
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="총 건물" value={`${properties.length}개`} />
          <SummaryCard title="총 호실" value={`${totalRooms}개`} />
          <SummaryCard title="공실" value={`${vacantRooms}개`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="건물명, 주소, 유형으로 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {isOpen && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
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
                <label className="text-sm font-bold text-slate-700">유형</label>
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

              <div className="rounded-lg bg-slate-50 p-4">
                <label className="text-sm font-black text-slate-950">
                  {editingProperty ? "추가 호실" : "초기 호실"}
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  {editingProperty
                    ? "이 건물에 새로 추가할 호실을 입력하세요. 기존 호실은 호실관리에서 수정합니다."
                    : "건물 저장과 동시에 만들 호실을 입력하세요. 쉼표나 줄바꿈으로 구분합니다."}
                </p>
                <textarea
                  value={initialRooms}
                  onChange={(event) => setInitialRooms(event.target.value)}
                  rows={4}
                  placeholder={"101호, 102호, 201호\n또는\nB101, 1층 상가"}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-bold">호실관리는 무엇인가요?</p>
                <p className="mt-1">
                  건물 등록에서 호실 이름을 빠르게 만들고, 호실관리에서 보증금,
                  월세, 관리비, 면적, 공실 상태를 세부 수정합니다.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? "저장 중" : "저장"}
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
      </div>
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
      <label className="text-sm font-bold text-slate-700">{label}</label>
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
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function parseRoomNames(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function createInitialRoom(
  propertyId: string,
  name: string,
  propertyType: PropertyType,
): Room {
  return {
    id: "",
    propertyId,
    name,
    floor: inferFloor(name),
    type: propertyType === "상가" ? "상가" : propertyType === "오피스텔" ? "오피스텔" : "원룸",
    status: "vacant",
    deposit: 0,
    monthlyRent: 0,
    maintenanceFee: 0,
    area: 0,
    memo: "건물 등록에서 생성",
  };
}

function inferFloor(roomName: string) {
  const match = roomName.match(/\d+/);
  if (!match) return 1;

  const numeric = match[0];
  if (numeric.length >= 3) return Number(numeric.slice(0, -2)) || 1;
  return Number(numeric[0]) || 1;
}

export default Properties;
