import type { Property } from "../types/property";
import type { Room } from "../types/room";
import type { Contract, RentPayment, Tenant } from "../types/business";

const TOKEN_KEY = "houserent_token";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getMe() {
  return request<AuthUser>("/api/me");
}

export async function fetchProperties() {
  return request<Property[]>("/api/properties");
}

export async function createProperty(property: Omit<Property, "id">) {
  return request<Property>("/api/properties", {
    method: "POST",
    body: JSON.stringify(property),
  });
}

export async function updatePropertyApi(property: Property) {
  return request<Property>(`/api/properties/${property.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: property.name,
      address: property.address,
      type: property.type,
      imageName: property.imageName,
      imageData: property.imageData,
    }),
  });
}

export async function deletePropertyApi(propertyId: string) {
  await request<void>(`/api/properties/${propertyId}`, {
    method: "DELETE",
  });
}

export async function fetchRooms() {
  return request<Room[]>("/api/rooms");
}

export async function createRoom(room: Room) {
  return request<Room>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(toRoomPayload(room)),
  });
}

export async function updateRoomApi(room: Room) {
  return request<Room>(`/api/rooms/${room.id}`, {
    method: "PUT",
    body: JSON.stringify(toRoomPayload(room)),
  });
}

export async function deleteRoomApi(roomId: string) {
  await request<void>(`/api/rooms/${roomId}`, {
    method: "DELETE",
  });
}

export async function fetchTenants() {
  return request<Tenant[]>("/api/tenants");
}

export async function createTenant(tenant: Tenant) {
  return request<Tenant>("/api/tenants", {
    method: "POST",
    body: JSON.stringify(toTenantPayload(tenant)),
  });
}

export async function updateTenantApi(tenant: Tenant) {
  return request<Tenant>(`/api/tenants/${tenant.id}`, {
    method: "PUT",
    body: JSON.stringify(toTenantPayload(tenant)),
  });
}

export async function deleteTenantApi(tenantId: string) {
  await request<void>(`/api/tenants/${tenantId}`, {
    method: "DELETE",
  });
}

export async function fetchContracts() {
  return request<Contract[]>("/api/contracts");
}

export async function createContract(contract: Contract) {
  return request<Contract>("/api/contracts", {
    method: "POST",
    body: JSON.stringify(toContractPayload(contract)),
  });
}

export async function updateContractApi(contract: Contract) {
  return request<Contract>(`/api/contracts/${contract.id}`, {
    method: "PUT",
    body: JSON.stringify(toContractPayload(contract)),
  });
}

export async function deleteContractApi(contractId: string) {
  await request<void>(`/api/contracts/${contractId}`, {
    method: "DELETE",
  });
}

export async function fetchRentPayments() {
  return request<RentPayment[]>("/api/rent-payments");
}

export async function createRentPayment(payment: RentPayment) {
  return request<RentPayment>("/api/rent-payments", {
    method: "POST",
    body: JSON.stringify(toRentPaymentPayload(payment)),
  });
}

export async function updateRentPaymentApi(payment: RentPayment) {
  return request<RentPayment>(`/api/rent-payments/${payment.id}`, {
    method: "PUT",
    body: JSON.stringify(toRentPaymentPayload(payment)),
  });
}

export async function deleteRentPaymentApi(paymentId: string) {
  await request<void>(`/api/rent-payments/${paymentId}`, {
    method: "DELETE",
  });
}

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "요청을 처리하지 못했습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toRoomPayload(room: Room) {
  return {
    propertyId: room.propertyId,
    name: room.name,
    floor: room.floor,
    type: room.type,
    status: room.status,
    deposit: room.deposit,
    monthlyRent: room.monthlyRent,
    maintenanceFee: room.maintenanceFee,
    area: room.area,
    memo: room.memo,
  };
}

function toTenantPayload(tenant: Tenant) {
  return {
    name: tenant.name,
    phone: tenant.phone,
    email: tenant.email,
    memo: tenant.memo,
  };
}

function toContractPayload(contract: Contract) {
  return {
    propertyId: contract.propertyId,
    roomId: contract.roomId,
    tenantId: contract.tenantId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    deposit: contract.deposit,
    monthlyRent: contract.monthlyRent,
    maintenanceFee: contract.maintenanceFee,
    paymentDay: contract.paymentDay,
    status: contract.status,
    memo: contract.memo,
    attachmentName: contract.attachmentName,
    attachmentData: contract.attachmentData,
  };
}

function toRentPaymentPayload(payment: RentPayment) {
  return {
    contractId: payment.contractId,
    dueDate: payment.dueDate,
    paidDate: payment.paidDate,
    rentAmount: payment.rentAmount,
    maintenanceFee: payment.maintenanceFee,
    status: payment.status,
    memo: payment.memo,
  };
}
