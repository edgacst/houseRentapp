import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredToken,
  createContract,
  createProperty,
  createRentPayment,
  createRoom,
  createTenant,
  deleteContractApi,
  deletePropertyApi,
  deleteRentPaymentApi,
  deleteRoomApi,
  deleteTenantApi,
  fetchContracts,
  fetchProperties,
  fetchRentPayments,
  fetchRooms,
  fetchTenants,
  getMe,
  getStoredToken,
  login,
  register,
  storeToken,
  updateContractApi,
  updatePropertyApi,
  updateRentPaymentApi,
  updateRoomApi,
  updateTenantApi,
  type AuthUser,
} from "../lib/api";
import type { Contract, RentPayment, Tenant } from "../types/business";
import type { Property } from "../types/property";
import type { Room } from "../types/room";

type AppContextValue = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  isDataLoading: boolean;
  authError: string;
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  rentPayments: RentPayment[];
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  reloadWorkspace: () => Promise<void>;
  addProperty: (property: Omit<Property, "id">) => Promise<Property>;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  upsertRoom: (room: Room) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  upsertTenant: (tenant: Tenant) => Promise<Tenant>;
  deleteTenant: (tenantId: string) => Promise<void>;
  upsertContract: (contract: Contract) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  upsertRentPayment: (payment: RentPayment) => Promise<void>;
  deleteRentPayment: (paymentId: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);

  const reloadWorkspace = async () => {
    setIsDataLoading(true);
    try {
      const [
        nextProperties,
        nextRooms,
        nextTenants,
        nextContracts,
        nextRentPayments,
      ] = await Promise.all([
        fetchProperties(),
        fetchRooms(),
        fetchTenants(),
        fetchContracts(),
        fetchRentPayments(),
      ]);
      setProperties(nextProperties);
      setRooms(nextRooms);
      setTenants(nextTenants);
      setContracts(nextContracts);
      setRentPayments(nextRentPayments);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const nextUser = await getMe();
        setUser(nextUser);
        await reloadWorkspace();
      } catch {
        clearStoredToken();
        setAuthError("로그인이 만료되었습니다. 다시 로그인하세요.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isBootstrapping,
      isDataLoading,
      authError,
      properties,
      rooms,
      tenants,
      contracts,
      rentPayments,
      loginWithPassword: async (email, password) => {
        const response = await login(email, password);
        storeToken(response.token);
        setUser(response.user);
        await reloadWorkspace();
      },
      registerWithPassword: async (name, email, password) => {
        const response = await register(name, email, password);
        storeToken(response.token);
        setUser(response.user);
        setProperties([]);
        setRooms([]);
        setTenants([]);
        setContracts([]);
        setRentPayments([]);
      },
      logout: () => {
        clearStoredToken();
        setUser(null);
        setProperties([]);
        setRooms([]);
        setTenants([]);
        setContracts([]);
        setRentPayments([]);
      },
      reloadWorkspace,
      addProperty: async (property) => {
        const created = await createProperty(property);
        setProperties((prev) => [created, ...prev]);
        return created;
      },
      updateProperty: async (property) => {
        const updated = await updatePropertyApi(property);
        setProperties((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      },
      deleteProperty: async (propertyId) => {
        const roomIds = rooms
          .filter((room) => room.propertyId === propertyId)
          .map((room) => room.id);
        const contractIds = contracts
          .filter((contract) => contract.propertyId === propertyId)
          .map((contract) => contract.id);

        await deletePropertyApi(propertyId);
        setProperties((prev) => prev.filter((item) => item.id !== propertyId));
        setRooms((prev) => prev.filter((room) => room.propertyId !== propertyId));
        setContracts((prev) =>
          prev.filter((contract) => !roomIds.includes(contract.roomId)),
        );
        setRentPayments((prev) =>
          prev.filter((payment) => !contractIds.includes(payment.contractId)),
        );
      },
      upsertRoom: async (room) => {
        const nextRoom = room.id
          ? await updateRoomApi(room)
          : await createRoom(room);
        setRooms((prev) => {
          const exists = prev.some((item) => item.id === nextRoom.id);
          return exists
            ? prev.map((item) => (item.id === nextRoom.id ? nextRoom : item))
            : [nextRoom, ...prev];
        });
      },
      deleteRoom: async (roomId) => {
        const contractIds = contracts
          .filter((contract) => contract.roomId === roomId)
          .map((contract) => contract.id);
        await deleteRoomApi(roomId);
        setRooms((prev) => prev.filter((room) => room.id !== roomId));
        setContracts((prev) =>
          prev.filter((contract) => contract.roomId !== roomId),
        );
        setRentPayments((prev) =>
          prev.filter((payment) => !contractIds.includes(payment.contractId)),
        );
      },
      upsertTenant: async (tenant) => {
        const nextTenant = tenant.id
          ? await updateTenantApi(tenant)
          : await createTenant(tenant);
        setTenants((prev) => {
          const exists = prev.some((item) => item.id === nextTenant.id);
          return exists
            ? prev.map((item) => (item.id === nextTenant.id ? nextTenant : item))
            : [nextTenant, ...prev];
        });
        return nextTenant;
      },
      deleteTenant: async (tenantId) => {
        const contractIds = contracts
          .filter((contract) => contract.tenantId === tenantId)
          .map((contract) => contract.id);
        await deleteTenantApi(tenantId);
        setTenants((prev) => prev.filter((tenant) => tenant.id !== tenantId));
        setContracts((prev) =>
          prev.filter((contract) => contract.tenantId !== tenantId),
        );
        setRentPayments((prev) =>
          prev.filter((payment) => !contractIds.includes(payment.contractId)),
        );
      },
      upsertContract: async (contract) => {
        const nextContract = contract.id
          ? await updateContractApi(contract)
          : await createContract(contract);
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
      deleteContract: async (contractId) => {
        await deleteContractApi(contractId);
        setContracts((prev) => prev.filter((contract) => contract.id !== contractId));
        setRentPayments((prev) =>
          prev.filter((payment) => payment.contractId !== contractId),
        );
      },
      upsertRentPayment: async (payment) => {
        const nextPayment = payment.id
          ? await updateRentPaymentApi(payment)
          : await createRentPayment(payment);
        setRentPayments((prev) => {
          const exists = prev.some((item) => item.id === nextPayment.id);
          return exists
            ? prev.map((item) => (item.id === nextPayment.id ? nextPayment : item))
            : [nextPayment, ...prev];
        });
      },
      deleteRentPayment: async (paymentId) => {
        await deleteRentPaymentApi(paymentId);
        setRentPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
      },
    }),
    [
      authError,
      contracts,
      isBootstrapping,
      isDataLoading,
      properties,
      rentPayments,
      rooms,
      tenants,
      user,
    ],
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
