import type { Room, RoomFinancials } from "../../types/room";
import RoomCard from "./RoomCard";

type RoomListProps = {
  rooms: Room[];
  getPropertyName?: (propertyId: string) => string | undefined;
  getTenantName?: (roomId: string) => string | undefined;
  getFinancials: (room: Room) => RoomFinancials;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
  onDetail: (room: Room) => void;
};

export default function RoomList({
  rooms,
  getPropertyName,
  getTenantName,
  getFinancials,
  onEdit,
  onDelete,
  onDetail,
}: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">등록된 호실이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          propertyName={getPropertyName?.(room.propertyId)}
          tenantName={getTenantName?.(room.id)}
          financials={getFinancials(room)}
          onEdit={onEdit}
          onDelete={onDelete}
          onDetail={onDetail}
        />
      ))}
    </div>
  );
}
