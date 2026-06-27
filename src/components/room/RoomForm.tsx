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
      <h2 className="mb-5 text-lg font-black text-slate-950">
        {editingRoom ? "호실 수정" : "호실 등록"}
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="호실명"
          value={form.name}
          placeholder="예: 101호"
          required
          onChange={(value) => setForm({ ...form, name: value })}
        />
        <NumberField
          label="층수"
          value={form.floor}
          placeholder="예: 1"
          onChange={(value) => setForm({ ...form, floor: value })}
        />

        <label className="block">
          <span className="text-sm font-bold text-slate-700">호실 유형</span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as RoomType })
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            {roomTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">호실 상태</span>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as RoomStatus })
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            {roomStatuses.map((status) => (
              <option key={status} value={status}>
                {statusText[status]}
              </option>
            ))}
          </select>
        </label>

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
        <NumberField
          label="면적"
          value={form.area}
          placeholder="예: 23"
          suffix="㎡"
          onChange={(value) => setForm({ ...form, area: value })}
        />
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-slate-700">메모</span>
        <textarea
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="수리 예정, 특이사항 등을 입력하세요."
          rows={3}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
      </label>

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
    </form>
  );
}

function TextField({
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder}
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
