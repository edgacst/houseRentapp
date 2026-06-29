import type { Room, RoomFinancials } from "../../types/room";

type RoomDetailProps = {
  room: Room | null;
  financials?: RoomFinancials;
  propertyName?: string;
  tenantName?: string;
  onClose: () => void;
};

const statusText = {
  vacant: "공실",
  occupied: "임대 중",
  reserved: "예약",
  maintenance: "수리 중",
};

const formatMoney = (value: number) => value.toLocaleString("ko-KR");

export default function RoomDetail({
  room,
  financials,
  propertyName,
  tenantName,
  onClose,
}: RoomDetailProps) {
  if (!room) return null;

  const displayFinancials = financials ?? {
    deposit: room.deposit,
    monthlyRent: room.monthlyRent,
    maintenanceFee: room.maintenanceFee,
    source: "room" as const,
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-600">{propertyName || "-"}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {room.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {room.floor}층 · {room.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          닫기
        </button>
      </div>

      <div className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        현재 금액은{" "}
        <span className="font-black">
          {displayFinancials.source === "contract" ? "계약 기준" : "호실 기준"}
        </span>
        으로 표시됩니다.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Info label="상태" value={statusText[room.status]} />
        <Info label="임차인" value={tenantName || "-"} />
        <Info label="면적" value={`${room.area}㎡`} />
        <Info label="보증금" value={`${formatMoney(displayFinancials.deposit)}원`} />
        <Info label="월세" value={`${formatMoney(displayFinancials.monthlyRent)}원`} />
        <Info
          label="관리비"
          value={`${formatMoney(displayFinancials.maintenanceFee)}원`}
        />
        <Info
          label="월 청구액"
          value={`${formatMoney(displayFinancials.monthlyRent + displayFinancials.maintenanceFee)}원`}
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
