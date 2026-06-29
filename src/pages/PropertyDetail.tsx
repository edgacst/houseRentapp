import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import RoomDetail from "../components/room/RoomDetail";
import RoomForm from "../components/room/RoomForm";
import RoomList from "../components/room/RoomList";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Room, RoomFinancials } from "../types/room";

function PropertyDetail() {
  const { id } = useParams();
  const { properties, rooms, contracts, tenants, upsertRoom, deleteRoom } =
    useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const activeContractsByRoom = useMemo(
    () =>
      new Map(
        contracts
          .filter((contract) => contract.status === "active")
          .map((contract) => [contract.roomId, contract]),
      ),
    [contracts],
  );

  const property = properties.find((item) => item.id === id);
  if (!property) return <Navigate to="/properties" replace />;

  const propertyRooms = rooms.filter((room) => room.propertyId === property.id);
  const occupied = propertyRooms.filter((room) => room.status === "occupied").length;
  const vacant = propertyRooms.filter((room) => room.status === "vacant").length;
  const maintenance = propertyRooms.filter(
    (room) => room.status === "maintenance",
  ).length;

  const getRoomFinancials = (room: Room): RoomFinancials => {
    const activeContract = activeContractsByRoom.get(room.id);
    if (activeContract) {
      return {
        deposit: activeContract.deposit,
        monthlyRent: activeContract.monthlyRent,
        maintenanceFee: activeContract.maintenanceFee,
        source: "contract",
      };
    }

    return {
      deposit: room.deposit,
      monthlyRent: room.monthlyRent,
      maintenanceFee: room.maintenanceFee,
      source: "room",
    };
  };

  const getTenantName = (roomId: string) => {
    const contract = activeContractsByRoom.get(roomId);
    return tenants.find((tenant) => tenant.id === contract?.tenantId)?.name;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/properties" className="text-sm font-bold text-blue-600">
              ← 부동산 목록
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {property.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {property.address} · {property.type}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRoom(null);
              setIsFormOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            + 호실 등록
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="전체 호실" value={`${propertyRooms.length}개`} />
          <SummaryCard title="임대 중" value={`${occupied}개`} />
          <SummaryCard title="공실" value={`${vacant}개`} />
          <SummaryCard title="수리 중" value={`${maintenance}개`} />
        </div>

        {isFormOpen && (
          <RoomForm
            propertyId={property.id}
            propertyName={property.name}
            editingRoom={editingRoom}
            onSubmit={async (room) => {
              await upsertRoom(room);
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
            financials={getRoomFinancials(selectedRoom)}
            propertyName={property.name}
            tenantName={getTenantName(selectedRoom.id)}
            onClose={() => setSelectedRoom(null)}
          />
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">호실 목록</h2>
            <p className="mt-1 text-sm text-slate-500">
              임대 중 호실은 계약 금액을 우선 표시합니다.
            </p>
          </div>
          <RoomList
            rooms={propertyRooms}
            getPropertyName={() => property.name}
            getTenantName={getTenantName}
            getFinancials={getRoomFinancials}
            onDetail={setSelectedRoom}
            onEdit={(room) => {
              setEditingRoom(room);
              setIsFormOpen(true);
            }}
            onDelete={async (roomId) => {
              if (
                !confirm(
                  "호실을 삭제하면 연결된 계약과 월세도 삭제됩니다. 계속할까요?",
                )
              ) {
                return;
              }
              await deleteRoom(roomId);
              if (selectedRoom?.id === roomId) setSelectedRoom(null);
            }}
          />
        </section>
      </div>
    </MainLayout>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default PropertyDetail;
