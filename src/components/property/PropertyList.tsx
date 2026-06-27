import type { Property } from "../../types/property";
import type { Room } from "../../types/room";
import PropertyCard from "./PropertyCard";

type PropertyListProps = {
  properties: Property[];
  rooms: Room[];
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => void;
};

function PropertyList({ properties, rooms, onEdit, onDelete }: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          등록된 건물이 없습니다.
        </h2>
        <p className="mt-2 text-slate-500">
          첫 건물을 등록하면 호실과 계약을 연결할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          rooms={rooms.filter((room) => room.propertyId === property.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default PropertyList;
