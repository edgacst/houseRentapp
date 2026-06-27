import type { Room } from "../../types/room";

type RoomCardProps = {
  room: Room;
  propertyName?: string;
  tenantName?: string;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
  onDetail: (room: Room) => void;
};

const statusLabel = {
  vacant: "공실",
  occupied: "임대 중",
  reserved: "예약",
  maintenance: "수리 중",
};

const statusClass = {
  vacant: "bg-blue-50 text-blue-700",
  occupied: "bg-green-50 text-green-700",
  reserved: "bg-purple-50 text-purple-700",
  maintenance: "bg-orange-50 text-orange-700",
};

const formatMoney = (value: number) => value.toLocaleString("ko-KR");

export default function RoomCard({
  room,
  propertyName,
  tenantName,
  onEdit,
  onDelete,
  onDetail,
}: RoomCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {propertyName ?? "건물 미지정"}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">
            {room.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {room.floor}층 · {room.type} · {room.area}㎡
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[room.status]}`}
        >
          {statusLabel[room.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <Info label="임차인" value={tenantName || "-"} />
        <Info label="보증금" value={`${formatMoney(room.deposit)}원`} />
        <Info label="월세" value={`${formatMoney(room.monthlyRent)}원`} />
        <Info label="관리비" value={`${formatMoney(room.maintenanceFee)}원`} />
      </div>

      {room.memo && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {room.memo}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => onDetail(room)}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          상세
        </button>
        <button
          onClick={() => onEdit(room)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(room.id)}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
