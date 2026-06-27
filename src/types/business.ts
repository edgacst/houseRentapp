export type Tenant = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  memo?: string;
};

export type ContractStatus = "active" | "scheduled" | "expired" | "terminated";

export type Contract = {
  id: string;
  propertyId: string;
  roomId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  deposit: number;
  monthlyRent: number;
  maintenanceFee: number;
  paymentDay: number;
  status: ContractStatus;
  memo?: string;
};

export type RentStatus = "paid" | "unpaid" | "late";

export type RentPayment = {
  id: string;
  contractId: string;
  dueDate: string;
  paidDate?: string;
  rentAmount: number;
  maintenanceFee: number;
  status: RentStatus;
  memo?: string;
};
