import { useEffect, useState } from "react";
import type { Room, RoomStatus, RoomType } from "../../types/room";

type RoomFormProps = {
  propertyId: string;
  editingRoom: Room | null;
  onSubmit: (room: Room) => void;
  onCancel: () => void;
};

const roomTypes: RoomType[] = ["원룸", "투룸", "쓰리룸", "오피스텔", "상가", "사무실"];
const roomStatuses: RoomStatus[] = ["vacant", "occupied", "reserved", "maintenance"];

const statusText: Record<RoomStatus, string> = {
  vacant: "공실",
  occupied: "임대중",
  reserved: "예약",
  maintenance: "수리중",
};

const emptyRoom = (propertyId: string): Room => ({
  id: "",
  propertyId,
  name: "",
  floor: 1,
  type: "원룸",
  status: "vacant",
  deposit: 0,
  monthlyRent: 0,
  maintenanceFee: 0,
  area: 0,
  memo: "",
});

export default function RoomForm({
  propertyId,
  editingRoom,
  onSubmit,
  onCancel,
}: RoomFormProps) {
  const [form, setForm] = useState<Room>(emptyRoom(propertyId));

  useEffect(() => {
    setForm(editingRoom ?? emptyRoom(propertyId));
  }, [editingRoom, propertyId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ ...form, propertyId });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-5 text-lg font-semibold text-slate-900">
        {editingRoom ? "호실 수정" : "호실 등록"}
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="호실명 예: 101호"
          required
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
        <input
          type="number"
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
          placeholder="층수"
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
        <select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as RoomType })
          }
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        >
          {roomTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as RoomStatus })
          }
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        >
          {roomStatuses.map((status) => (
            <option key={status} value={status}>
              {statusText[status]}
            </option>
          ))}
        </select>
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
        <NumberInput
          value={form.area}
          placeholder="면적(㎡)"
          onChange={(value) => setForm({ ...form, area: value })}
        />
      </div>

      <textarea
        value={form.memo}
        onChange={(e) => setForm({ ...form, memo: e.target.value })}
        placeholder="메모"
        rows={3}
        className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      />

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
    </form>
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
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />
  );
}
