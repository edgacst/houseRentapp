import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialContracts, initialRentPayments, initialTenants } from "../data/business";
import { properties as initialProperties } from "../data/properties";
import { initialRooms } from "../data/rooms";
import type { Contract, RentPayment, Tenant } from "../types/business";
import type { Property } from "../types/property";
import type { Room } from "../types/room";

type AppContextValue = {
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  rentPayments: RentPayment[];
  addProperty: (property: Omit<Property, "id">) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (propertyId: string) => void;
  upsertRoom: (room: Room) => void;
  deleteRoom: (roomId: string) => void;
  upsertTenant: (tenant: Tenant) => void;
  deleteTenant: (tenantId: string) => void;
  upsertContract: (contract: Contract) => void;
  deleteContract: (contractId: string) => void;
  upsertRentPayment: (payment: RentPayment) => void;
  deleteRentPayment: (paymentId: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [rentPayments, setRentPayments] =
    useState<RentPayment[]>(initialRentPayments);

  const value = useMemo<AppContextValue>(
    () => ({
      properties,
      rooms,
      tenants,
      contracts,
      rentPayments,
      addProperty: (property) => {
        setProperties((prev) => [{ ...property, id: makeId("property") }, ...prev]);
      },
      updateProperty: (property) => {
        setProperties((prev) =>
          prev.map((item) => (item.id === property.id ? property : item)),
        );
      },
      deleteProperty: (propertyId) => {
        const roomIds = rooms
          .filter((room) => room.propertyId === propertyId)
          .map((room) => room.id);
        const contractIds = contracts
          .filter((contract) => contract.propertyId === propertyId)
          .map((contract) => contract.id);

        setProperties((prev) => prev.filter((item) => item.id !== propertyId));
        setRooms((prev) => prev.filter((room) => room.propertyId !== propertyId));
        setContracts((prev) =>
          prev.filter((contract) => !roomIds.includes(contract.roomId)),
        );
        setRentPayments((prev) =>
          prev.filter((payment) => !contractIds.includes(payment.contractId)),
        );
      },
      upsertRoom: (room) => {
        const nextRoom = { ...room, id: room.id || makeId("room") };
        setRooms((prev) => {
          const exists = prev.some((item) => item.id === nextRoom.id);
          return exists
            ? prev.map((item) => (item.id === nextRoom.id ? nextRoom : item))
            : [nextRoom, ...prev];
        });
      },
      deleteRoom: (roomId) => {
        const contractIds = contracts
          .filter((contract) => contract.roomId === roomId)
          .map((contract) => contract.id);
        setRooms((prev) => prev.filter((room) => room.id !== roomId));
        setContracts((prev) =>
          prev.filter((contract) => contract.roomId !== roomId),
        );
        setRentPayments((prev) =>
          prev.filter((payment) => !contractIds.includes(payment.contractId)),
        );
      },
      upsertTenant: (tenant) => {
        const nextTenant = { ...tenant, id: tenant.id || makeId("tenant") };
        setTenants((prev) => {
          const exists = prev.some((item) => item.id === nextTenant.id);
          return exists
            ? prev.map((item) => (item.id === nextTenant.id ? nextTenant : item))
            : [nextTenant, ...prev];
        });
      },
      deleteTenant: (tenantId) => {
        const contractIds = contracts
          .filter((contract) => contract.tenantId === tenantId)
          .map((contract) => contract.id);
        setTenants((prev) => prev.filter((tenant) => tenant.id !== tenantId));
        setContracts((prev) =>
          prev.filter((contract) => contract.tenantId !== tenantId),
        );
        setRentPayments((prev) =>
          prev.filter((payment) => !contractIds.includes(payment.contractId)),
        );
      },
      upsertContract: (contract) => {
        const nextContract = {
          ...contract,
          id: contract.id || makeId("contract"),
        };
        setContracts((prev) => {
          const exists = prev.some((item) => item.id === nextContract.id);
          return exists
            ? prev.map((item) =>
                item.id === nextContract.id ? nextContract : item,
              )
            : [nextContract, ...prev];
        });
        setRooms((prev) =>
          prev.map((room) =>
            room.id === nextContract.roomId
              ? {
                  ...room,
                  status:
                    nextContract.status === "active" ? "occupied" : room.status,
                  deposit: nextContract.deposit,
                  monthlyRent: nextContract.monthlyRent,
                  maintenanceFee: nextContract.maintenanceFee,
                }
              : room,
          ),
        );
      },
      deleteContract: (contractId) => {
        setContracts((prev) => prev.filter((contract) => contract.id !== contractId));
        setRentPayments((prev) =>
          prev.filter((payment) => payment.contractId !== contractId),
        );
      },
      upsertRentPayment: (payment) => {
        const nextPayment = { ...payment, id: payment.id || makeId("rent") };
        setRentPayments((prev) => {
          const exists = prev.some((item) => item.id === nextPayment.id);
          return exists
            ? prev.map((item) => (item.id === nextPayment.id ? nextPayment : item))
            : [nextPayment, ...prev];
        });
      },
      deleteRentPayment: (paymentId) => {
        setRentPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
      },
    }),
    [contracts, properties, rentPayments, rooms, tenants],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppProvider");
  }

  return context;
}
