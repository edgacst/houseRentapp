import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import RoomForm from "../components/room/RoomForm";
import RoomList from "../components/room/RoomList";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Room } from "../types/room";

function PropertyDetail() {
  const { id } = useParams();
  const { properties, rooms, contracts, tenants, upsertRoom, deleteRoom } =
    useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const property = properties.find((item) => item.id === id);
  if (!property) return <Navigate to="/properties" replace />;

  const propertyRooms = rooms.filter((room) => room.propertyId === property.id);
  const occupied = propertyRooms.filter((room) => room.status === "occupied").length;
  const vacant = propertyRooms.filter((room) => room.status === "vacant").length;
  const maintenance = propertyRooms.filter(
    (room) => room.status === "maintenance",
  ).length;

  const getTenantName = (roomId: string) => {
    const contract = contracts.find(
      (item) => item.roomId === roomId && item.status === "active",
    );
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
            <p className="mt-2 text-sm text-slate-500">{property.address}</p>
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
          <SummaryCard title="임대중" value={`${occupied}개`} />
          <SummaryCard title="공실" value={`${vacant}개`} />
          <SummaryCard title="수리중" value={`${maintenance}개`} />
        </div>

        {isFormOpen && (
          <RoomForm
            propertyId={property.id}
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

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">호실 목록</h2>
          </div>
          <RoomList
            rooms={propertyRooms}
            getTenantName={getTenantName}
            onDetail={(room) => {
              setEditingRoom(room);
              setIsFormOpen(true);
            }}
            onEdit={(room) => {
              setEditingRoom(room);
              setIsFormOpen(true);
            }}
            onDelete={async (roomId) => {
              if (!confirm("호실을 삭제하면 연결된 계약과 월세도 삭제됩니다. 계속할까요?")) {
                return;
              }
              await deleteRoom(roomId);
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
