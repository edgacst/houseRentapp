import { useMemo, useState } from "react";
import RoomDetail from "../components/room/RoomDetail";
import RoomForm from "../components/room/RoomForm";
import RoomList from "../components/room/RoomList";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Room, RoomStatus } from "../types/room";

const statusOptions: Array<{ label: string; value: RoomStatus | "all" }> = [
  { label: "전체", value: "all" },
  { label: "공실", value: "vacant" },
  { label: "임대중", value: "occupied" },
  { label: "예약", value: "reserved" },
  { label: "수리중", value: "maintenance" },
];

export default function Rooms() {
  const { properties, rooms, contracts, tenants, upsertRoom, deleteRoom } =
    useAppData();
  const [keyword, setKeyword] = useState("");
  const [propertyId, setPropertyId] = useState<string>("all");
  const [status, setStatus] = useState<RoomStatus | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const activePropertyId =
    propertyId === "all" ? properties[0]?.id ?? "" : propertyId;

  const filteredRooms = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return rooms.filter((room) => {
      const property = properties.find((item) => item.id === room.propertyId);
      const matchesKeyword =
        room.name.toLowerCase().includes(lowerKeyword) ||
        room.type.toLowerCase().includes(lowerKeyword) ||
        property?.name.toLowerCase().includes(lowerKeyword) ||
        room.memo?.toLowerCase().includes(lowerKeyword);
      const matchesStatus = status === "all" || room.status === status;
      const matchesProperty = propertyId === "all" || room.propertyId === propertyId;
      return matchesKeyword && matchesStatus && matchesProperty;
    });
  }, [keyword, properties, propertyId, rooms, status]);

  const summary = {
    total: filteredRooms.length,
    vacant: filteredRooms.filter((room) => room.status === "vacant").length,
    occupied: filteredRooms.filter((room) => room.status === "occupied").length,
    monthlyRevenue: filteredRooms
      .filter((room) => room.status === "occupied")
      .reduce((sum, room) => sum + room.monthlyRent + room.maintenanceFee, 0),
  };

  const getTenantName = (roomId: string) => {
    const contract = contracts.find(
      (item) => item.roomId === roomId && item.status === "active",
    );
    return tenants.find((tenant) => tenant.id === contract?.tenantId)?.name;
  };

  const getPropertyName = (targetPropertyId: string) =>
    properties.find((property) => property.id === targetPropertyId)?.name;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">호실 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              호실, 공실, 보증금, 월세, 관리비를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRoom(null);
              setIsFormOpen(true);
            }}
            disabled={!activePropertyId}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 호실 등록
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 호실" value={`${summary.total}개`} />
          <SummaryCard label="공실" value={`${summary.vacant}개`} />
          <SummaryCard label="임대중" value={`${summary.occupied}개`} />
          <SummaryCard
            label="예상 월수입"
            value={`${summary.monthlyRevenue.toLocaleString("ko-KR")}원`}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="호실명, 건물명, 유형, 메모 검색"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            <option value="all">전체 건물</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RoomStatus | "all")}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isFormOpen && (
          <RoomForm
            propertyId={editingRoom?.propertyId ?? activePropertyId}
            editingRoom={editingRoom}
            onSubmit={(room) => {
              upsertRoom(room);
              setIsFormOpen(false);
              setEditingRoom(null);
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRoom(null);
            }}
          />
        )}

        {selectedRoom && (
          <RoomDetail
            room={selectedRoom}
            propertyName={getPropertyName(selectedRoom.propertyId)}
            tenantName={getTenantName(selectedRoom.id)}
            onClose={() => setSelectedRoom(null)}
          />
        )}

        <RoomList
          rooms={filteredRooms}
          getTenantName={getTenantName}
          onEdit={(room) => {
            setEditingRoom(room);
            setIsFormOpen(true);
          }}
          onDelete={(roomId) => {
            if (!confirm("호실을 삭제하면 연결된 계약과 월세도 삭제됩니다. 계속할까요?")) {
              return;
            }
            deleteRoom(roomId);
            if (selectedRoom?.id === roomId) setSelectedRoom(null);
          }}
          onDetail={setSelectedRoom}
        />
      </div>
    </MainLayout>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
