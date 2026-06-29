import { Link } from "react-router-dom";
import type { Property } from "../../types/property";
import type { Room } from "../../types/room";

type PropertyCardProps = {
  property: Property;
  rooms: Room[];
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => void;
};

function PropertyCard({ property, rooms, onEdit, onDelete }: PropertyCardProps) {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  const vacantRooms = rooms.filter((room) => room.status === "vacant").length;
  const imageData =
    property.imageDataList && property.imageDataList.length > 0
      ? property.imageDataList[0]
      : property.imageData;
  const imageCount =
    property.imageDataList && property.imageDataList.length > 0
      ? property.imageDataList.length
      : property.imageData
        ? 1
        : 0;
  const occupancyRate =
    totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);
  const totalAcquisitionCost = getTotalAcquisitionCost(property);
  const equityAmount = Math.max(0, totalAcquisitionCost - (property.loanAmount ?? 0));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {imageData ? (
        <div className="relative">
          <img
            src={imageData}
            alt={`${property.name} 건물 이미지`}
            className="h-36 w-full object-cover"
          />
          <span className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-white">
            사진 {imageCount}장
          </span>
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center bg-slate-100 text-sm font-bold text-slate-400">
          건물 이미지 없음
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-600">{property.type}</p>
            <h2 className="mt-2 truncate text-xl font-bold text-slate-900">
              {property.name}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
              {property.address}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            입주율 {occupancyRate}%
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <InfoBox label="전체 호실" value={`${totalRooms}`} />
          <InfoBox label="임대 중" value={`${occupiedRooms}`} />
          <InfoBox label="공실" value={`${vacantRooms}`} />
        </div>

        {totalAcquisitionCost > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3">
            <MiniStat label="총투입" value={formatShortMoney(totalAcquisitionCost)} />
            <MiniStat label="대출" value={formatShortMoney(property.loanAmount ?? 0)} />
            <MiniStat label="자기자본" value={formatShortMoney(equityAmount)} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Link
            to={`/properties/${property.id}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            상세
          </Link>
          <button
            onClick={() => onEdit(property)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            수정
          </button>
          <button
            onClick={() => onDelete(property.id)}
            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function getTotalAcquisitionCost(property: Property) {
  return (
    (property.purchasePrice ?? 0) +
    (property.acquisitionTax ?? 0) +
    (property.brokerageFee ?? 0) +
    (property.renovationCost ?? 0) +
    (property.otherPurchaseCost ?? 0)
  );
}

function formatShortMoney(value: number) {
  if (value >= 100000000) {
    const eok = value / 100000000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억`;
  }
  if (value >= 10000) return `${Math.round(value / 10000).toLocaleString("ko-KR")}만`;
  return value.toLocaleString("ko-KR");
}

export default PropertyCard;
