import type {
  Contract,
  Expense,
  MaintenanceCharge,
  Property,
  RentPayment,
  Room,
  Tenant,
} from "@prisma/client";

const propertyTypeToDb = {
  오피스텔: "OFFICETEL",
  빌라: "VILLA",
  상가: "STORE",
  아파트: "APARTMENT",
  원룸: "STUDIO",
} as const;

const propertyTypeFromDb = {
  OFFICETEL: "오피스텔",
  VILLA: "빌라",
  STORE: "상가",
  APARTMENT: "아파트",
  STUDIO: "원룸",
} as const;

const roomTypeToDb = {
  원룸: "STUDIO",
  투룸: "TWO_ROOM",
  쓰리룸: "THREE_ROOM",
  오피스텔: "OFFICETEL",
  상가: "STORE",
  사무실: "OFFICE",
} as const;

const roomTypeFromDb = {
  STUDIO: "원룸",
  TWO_ROOM: "투룸",
  THREE_ROOM: "쓰리룸",
  OFFICETEL: "오피스텔",
  STORE: "상가",
  OFFICE: "사무실",
} as const;

const roomStatusToDb = {
  vacant: "VACANT",
  occupied: "OCCUPIED",
  reserved: "RESERVED",
  maintenance: "MAINTENANCE",
} as const;

const roomStatusFromDb = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  MAINTENANCE: "maintenance",
} as const;

const contractStatusToDb = {
  active: "ACTIVE",
  scheduled: "SCHEDULED",
  expired: "EXPIRED",
  terminated: "TERMINATED",
} as const;

const contractStatusFromDb = {
  ACTIVE: "active",
  SCHEDULED: "scheduled",
  EXPIRED: "expired",
  TERMINATED: "terminated",
} as const;

const paymentStatusToDb = {
  paid: "PAID",
  unpaid: "UNPAID",
  late: "LATE",
} as const;

const paymentStatusFromDb = {
  PAID: "paid",
  UNPAID: "unpaid",
  LATE: "late",
} as const;

export function toDbPropertyType(type: string) {
  return propertyTypeToDb[type as keyof typeof propertyTypeToDb];
}

export function toApiProperty(property: Property) {
  const imageNames =
    property.imageNames.length > 0
      ? property.imageNames
      : property.imageName
        ? [property.imageName]
        : [];
  const imageDataList =
    property.imageDataList.length > 0
      ? property.imageDataList
      : property.imageData
        ? [property.imageData]
        : [];

  return {
    id: property.id,
    name: property.name,
    address: property.address,
    type: propertyTypeFromDb[property.type],
    imageName: imageNames[0] ?? "",
    imageData: imageDataList[0] ?? "",
    imageNames,
    imageDataList,
    builtYear: property.builtYear ?? undefined,
    totalFloors: property.totalFloors ?? undefined,
    hasElevator: property.hasElevator,
    parkingAvailable: property.parkingAvailable,
    managementType: property.managementType ?? "",
    managerName: property.managerName ?? "",
    managerPhone: property.managerPhone ?? "",
    memo: property.memo ?? "",
    purchasePrice: property.purchasePrice,
    acquisitionTax: property.acquisitionTax,
    brokerageFee: property.brokerageFee,
    renovationCost: property.renovationCost,
    otherPurchaseCost: property.otherPurchaseCost,
    loanAmount: property.loanAmount,
    documentNames: property.documentNames,
    documentDataList: property.documentDataList,
  };
}

export function toDbRoomType(type: string) {
  return roomTypeToDb[type as keyof typeof roomTypeToDb];
}

export function toDbRoomStatus(status: string) {
  return roomStatusToDb[status as keyof typeof roomStatusToDb];
}

export function toApiRoom(room: Room) {
  return {
    id: room.id,
    propertyId: room.propertyId,
    name: room.name,
    floor: room.floor,
    type: roomTypeFromDb[room.type],
    status: roomStatusFromDb[room.status],
    deposit: room.deposit,
    monthlyRent: room.monthlyRent,
    maintenanceFee: room.maintenanceFee,
    area: room.area,
    memo: room.memo ?? "",
  };
}

export function toApiTenant(tenant: Tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    phone: tenant.phone,
    email: tenant.email ?? "",
    memo: tenant.memo ?? "",
  };
}

export function toDbContractStatus(status: string) {
  return contractStatusToDb[status as keyof typeof contractStatusToDb];
}

export function toApiContract(contract: Contract) {
  return {
    id: contract.id,
    propertyId: contract.propertyId,
    roomId: contract.roomId,
    tenantId: contract.tenantId,
    startDate: contract.startDate.toISOString().slice(0, 10),
    endDate: contract.endDate.toISOString().slice(0, 10),
    deposit: contract.deposit,
    monthlyRent: contract.monthlyRent,
    maintenanceFee: contract.maintenanceFee,
    paymentDay: contract.paymentDay,
    status: contractStatusFromDb[contract.status],
    memo: contract.memo ?? "",
    attachmentName: contract.attachmentName ?? "",
    attachmentData: contract.attachmentData ?? "",
  };
}

export function toDbRentStatus(status: string) {
  return paymentStatusToDb[status as keyof typeof paymentStatusToDb];
}

export function toApiRentPayment(payment: RentPayment) {
  return {
    id: payment.id,
    contractId: payment.contractId,
    dueDate: payment.dueDate.toISOString().slice(0, 10),
    paidDate: payment.paidDate?.toISOString().slice(0, 10) ?? "",
    rentAmount: payment.rentAmount,
    maintenanceFee: payment.maintenanceFee,
    status: paymentStatusFromDb[payment.status],
    memo: payment.memo ?? "",
  };
}

export function toDbMaintenanceStatus(status: string) {
  return paymentStatusToDb[status as keyof typeof paymentStatusToDb];
}

export function toApiMaintenanceCharge(charge: MaintenanceCharge) {
  return {
    id: charge.id,
    propertyId: charge.propertyId,
    roomId: charge.roomId ?? "",
    title: charge.title,
    billingMonth: charge.billingMonth,
    dueDate: charge.dueDate.toISOString().slice(0, 10),
    amount: charge.amount,
    status: paymentStatusFromDb[charge.status],
    paidDate: charge.paidDate?.toISOString().slice(0, 10) ?? "",
    memo: charge.memo ?? "",
  };
}

export function toApiExpense(expense: Expense) {
  return {
    id: expense.id,
    propertyId: expense.propertyId,
    roomId: expense.roomId ?? "",
    title: expense.title,
    category: expense.category,
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    amount: expense.amount,
    vendor: expense.vendor ?? "",
    memo: expense.memo ?? "",
    receiptName: expense.receiptName ?? "",
    receiptData: expense.receiptData ?? "",
  };
}
