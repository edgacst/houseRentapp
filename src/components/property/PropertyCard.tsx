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
  const occupancyRate =
    totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">{property.type}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            {property.name}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{property.address}</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
          입주율 {occupancyRate}%
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <InfoBox label="전체 호실" value={`${totalRooms}`} />
        <InfoBox label="임대중" value={`${occupiedRooms}`} />
        <InfoBox label="공실" value={`${vacantRooms}`} />
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
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
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default PropertyCard;
