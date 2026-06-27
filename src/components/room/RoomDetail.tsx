import type { Room } from "../../types/room";

type RoomDetailProps = {
  room: Room | null;
  propertyName?: string;
  tenantName?: string;
  onClose: () => void;
};

const statusText = {
  vacant: "공실",
  occupied: "임대중",
  reserved: "예약",
  maintenance: "수리중",
};

const formatMoney = (value: number) => value.toLocaleString("ko-KR");

export default function RoomDetail({
  room,
  propertyName,
  tenantName,
  onClose,
}: RoomDetailProps) {
  if (!room) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{room.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {propertyName || "-"} · {room.floor}층 · {room.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          닫기
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Info label="상태" value={statusText[room.status]} />
        <Info label="임차인" value={tenantName || "-"} />
        <Info label="면적" value={`${room.area}㎡`} />
        <Info label="보증금" value={`${formatMoney(room.deposit)}원`} />
        <Info label="월세" value={`${formatMoney(room.monthlyRent)}원`} />
        <Info label="관리비" value={`${formatMoney(room.maintenanceFee)}원`} />
        <Info
          label="월 청구액"
          value={`${formatMoney(room.monthlyRent + room.maintenanceFee)}원`}
        />
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500">메모</p>
        <p className="mt-2 text-sm text-slate-700">
          {room.memo || "등록된 메모가 없습니다."}
        </p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
