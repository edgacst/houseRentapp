import type {
  Contract,
  Expense,
  MaintenanceCharge,
  RentPayment,
  Tenant,
} from "../types/business";
import type { Property } from "../types/property";
import type { Room } from "../types/room";

export type AlertLevel = "danger" | "warning" | "info";
export type AlertKind = "rent" | "contract" | "vacancy" | "expense" | "maintenance";

export type AppAlert = {
  id: string;
  kind: AlertKind;
  level: AlertLevel;
  title: string;
  description: string;
  date?: string;
  amount?: number;
  href: string;
};

type AlertSource = {
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  rentPayments: RentPayment[];
  maintenanceCharges: MaintenanceCharge[];
  expenses: Expense[];
};

const dayMs = 1000 * 60 * 60 * 24;

export function buildAlerts({
  properties,
  rooms,
  tenants,
  contracts,
  rentPayments,
  maintenanceCharges,
  expenses,
}: AlertSource) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const currentMonth = todayKey.slice(0, 7);
  const previousMonth = getPreviousMonth(currentMonth);

  const propertyName = (propertyId?: string) =>
    properties.find((property) => property.id === propertyId)?.name ?? "미등록 건물";
  const roomName = (roomId?: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "호실 미지정";
  const tenantName = (tenantId?: string) =>
    tenants.find((tenant) => tenant.id === tenantId)?.name ?? "임차인 미연결";

  const alerts: AppAlert[] = [];

  rentPayments
    .filter((payment) => payment.status !== "paid")
    .forEach((payment) => {
      const contract = contracts.find((item) => item.id === payment.contractId);
      const daysOverdue = Math.ceil(
        (today.getTime() - new Date(payment.dueDate).getTime()) / dayMs,
      );
      const isLate = payment.status === "late" || payment.dueDate < todayKey;
      alerts.push({
        id: `rent-${payment.id}`,
        kind: "rent",
        level: isLate ? "danger" : "warning",
        title: isLate ? "월세 연체" : "월세 미납",
        description: `${propertyName(contract?.propertyId)} ${roomName(contract?.roomId)} · ${tenantName(contract?.tenantId)} · ${Math.max(daysOverdue, 0)}일 경과`,
        date: payment.dueDate,
        amount: payment.rentAmount + payment.maintenanceFee,
        href: "/rents",
      });
    });

  maintenanceCharges
    .filter((charge) => charge.status !== "paid")
    .forEach((charge) => {
      const isLate = charge.status === "late" || charge.dueDate < todayKey;
      alerts.push({
        id: `maintenance-${charge.id}`,
        kind: "maintenance",
        level: isLate ? "danger" : "warning",
        title: isLate ? "관리비 연체" : "관리비 미납",
        description: `${propertyName(charge.propertyId)} ${roomName(charge.roomId)} · ${charge.title}`,
        date: charge.dueDate,
        amount: charge.amount,
        href: "/maintenance",
      });
    });

  contracts
    .filter((contract) => contract.status === "active")
    .forEach((contract) => {
      const daysLeft = Math.ceil(
        (new Date(contract.endDate).getTime() - today.getTime()) / dayMs,
      );
      if (daysLeft < 0 || daysLeft > 90) return;

      alerts.push({
        id: `contract-${contract.id}`,
        kind: "contract",
        level: daysLeft <= 30 ? "danger" : daysLeft <= 60 ? "warning" : "info",
        title: `계약 만료 D-${daysLeft}`,
        description: `${propertyName(contract.propertyId)} ${roomName(contract.roomId)} · ${tenantName(contract.tenantId)}`,
        date: contract.endDate,
        href: "/contracts",
      });
    });

  rooms
    .filter((room) => room.status === "vacant")
    .forEach((room) => {
      alerts.push({
        id: `vacancy-${room.id}`,
        kind: "vacancy",
        level: "info",
        title: "공실 상태",
        description: `${propertyName(room.propertyId)} ${room.name} · 예상 월세 ${room.monthlyRent.toLocaleString("ko-KR")}원`,
        amount: room.monthlyRent + room.maintenanceFee,
        href: "/rooms",
      });
    });

  const currentExpense = expenses
    .filter((expense) => expense.expenseDate.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const previousExpense = expenses
    .filter((expense) => expense.expenseDate.startsWith(previousMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);
  if (currentExpense > 0 && previousExpense > 0 && currentExpense >= previousExpense * 1.3) {
    alerts.push({
      id: `expense-${currentMonth}`,
      kind: "expense",
      level: "warning",
      title: "이번 달 지출 증가",
      description: `전월 대비 ${Math.round((currentExpense / previousExpense - 1) * 100)}% 증가했습니다.`,
      amount: currentExpense,
      href: "/expenses",
    });
  }

  return alerts.sort((a, b) => {
    const levelOrder = { danger: 0, warning: 1, info: 2 };
    if (levelOrder[a.level] !== levelOrder[b.level]) {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    return (a.date ?? "").localeCompare(b.date ?? "");
  });
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
