import type { Contract, RentPayment, Tenant } from "../types/business";

export const initialTenants: Tenant[] = [
  {
    id: "tenant-1",
    name: "김철수",
    phone: "010-1234-5678",
    email: "kim@example.com",
    memo: "강남 오피스텔 101호 거주",
  },
  {
    id: "tenant-2",
    name: "이영희",
    phone: "010-9876-5432",
    email: "lee@example.com",
    memo: "송파 빌라 301호 거주",
  },
];

export const initialContracts: Contract[] = [
  {
    id: "contract-1",
    propertyId: "property-1",
    roomId: "room-101",
    tenantId: "tenant-1",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    deposit: 5000000,
    monthlyRent: 450000,
    maintenanceFee: 50000,
    paymentDay: 5,
    status: "active",
  },
  {
    id: "contract-2",
    propertyId: "property-2",
    roomId: "room-301",
    tenantId: "tenant-2",
    startDate: "2025-08-01",
    endDate: "2026-07-31",
    deposit: 20000000,
    monthlyRent: 650000,
    maintenanceFee: 70000,
    paymentDay: 10,
    status: "active",
  },
];

export const initialRentPayments: RentPayment[] = [
  {
    id: "rent-1",
    contractId: "contract-1",
    dueDate: "2026-06-05",
    paidDate: "2026-06-04",
    rentAmount: 450000,
    maintenanceFee: 50000,
    status: "paid",
  },
  {
    id: "rent-2",
    contractId: "contract-2",
    dueDate: "2026-06-10",
    rentAmount: 650000,
    maintenanceFee: 70000,
    status: "unpaid",
  },
];
