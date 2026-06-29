import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";

type ExportRow = Record<string, string | number | boolean | undefined>;

type ExportItem = {
  title: string;
  description: string;
  count: number;
  rows: ExportRow[];
  fileName: string;
};

export default function DataExport() {
  const {
    properties,
    rooms,
    tenants,
    contracts,
    rentPayments,
    maintenanceCharges,
    expenses,
  } = useAppData();

  const propertyName = (propertyId?: string) =>
    properties.find((property) => property.id === propertyId)?.name ?? "";
  const roomName = (roomId?: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "";
  const tenantName = (tenantId?: string) =>
    tenants.find((tenant) => tenant.id === tenantId)?.name ?? "";
  const contractLabel = (contractId?: string) => {
    const contract = contracts.find((item) => item.id === contractId);
    if (!contract) return "";
    return `${propertyName(contract.propertyId)} ${roomName(contract.roomId)} ${tenantName(contract.tenantId)}`;
  };

  const exportItems: ExportItem[] = [
      {
        title: "건물",
        description: "주소, 유형, 매입비용, 담당자 정보를 백업합니다.",
        count: properties.length,
        fileName: "properties",
        rows: properties.map((property) => ({
          건물명: property.name,
          주소: property.address,
          유형: property.type,
          준공연도: property.builtYear,
          층수: property.totalFloors,
          엘리베이터: property.hasElevator ? "있음" : "없음",
          주차: property.parkingAvailable ? "가능" : "불가",
          매입가: property.purchasePrice,
          취득세: property.acquisitionTax,
          중개수수료: property.brokerageFee,
          리모델링비: property.renovationCost,
          기타비용: property.otherPurchaseCost,
          대출금: property.loanAmount,
          담당자: property.managerName,
          담당자연락처: property.managerPhone,
          메모: property.memo,
        })),
      },
      {
        title: "호실",
        description: "건물별 호실, 보증금, 월세, 관리비를 백업합니다.",
        count: rooms.length,
        fileName: "rooms",
        rows: rooms.map((room) => ({
          건물명: propertyName(room.propertyId),
          호실: room.name,
          층: room.floor,
          유형: room.type,
          상태: room.status,
          보증금: room.deposit,
          월세: room.monthlyRent,
          관리비: room.maintenanceFee,
          면적: room.area,
          메모: room.memo,
        })),
      },
      {
        title: "임차인",
        description: "임차인 연락처와 메모를 백업합니다.",
        count: tenants.length,
        fileName: "tenants",
        rows: tenants.map((tenant) => ({
          이름: tenant.name,
          연락처: tenant.phone,
          이메일: tenant.email,
          메모: tenant.memo,
        })),
      },
      {
        title: "계약",
        description: "계약 기간, 보증금, 월세, 납부일을 백업합니다.",
        count: contracts.length,
        fileName: "contracts",
        rows: contracts.map((contract) => ({
          건물명: propertyName(contract.propertyId),
          호실: roomName(contract.roomId),
          임차인: tenantName(contract.tenantId),
          시작일: contract.startDate,
          종료일: contract.endDate,
          보증금: contract.deposit,
          월세: contract.monthlyRent,
          관리비: contract.maintenanceFee,
          납부일: contract.paymentDay,
          상태: contract.status,
          첨부파일: contract.attachmentName,
          메모: contract.memo,
        })),
      },
      {
        title: "월세",
        description: "월세 청구, 납부일, 미납 상태를 백업합니다.",
        count: rentPayments.length,
        fileName: "rent-payments",
        rows: rentPayments.map((payment) => ({
          계약: contractLabel(payment.contractId),
          납부예정일: payment.dueDate,
          실제납부일: payment.paidDate,
          월세: payment.rentAmount,
          관리비: payment.maintenanceFee,
          합계: payment.rentAmount + payment.maintenanceFee,
          상태: payment.status,
          메모: payment.memo,
        })),
      },
      {
        title: "지출",
        description: "수리비, 세금, 대출이자 등 지출 내역을 백업합니다.",
        count: expenses.length,
        fileName: "expenses",
        rows: expenses.map((expense) => ({
          건물명: propertyName(expense.propertyId),
          호실: roomName(expense.roomId),
          지출명: expense.title,
          분류: expense.category,
          지출일: expense.expenseDate,
          금액: expense.amount,
          거래처: expense.vendor,
          첨부파일: expense.receiptName,
          메모: expense.memo,
        })),
      },
      {
        title: "관리비",
        description: "별도 관리비 청구와 수납 상태를 백업합니다.",
        count: maintenanceCharges.length,
        fileName: "maintenance-charges",
        rows: maintenanceCharges.map((charge) => ({
          건물명: propertyName(charge.propertyId),
          호실: roomName(charge.roomId),
          제목: charge.title,
          청구월: charge.billingMonth,
          납부예정일: charge.dueDate,
          금액: charge.amount,
          상태: charge.status,
          납부일: charge.paidDate,
          메모: charge.memo,
        })),
      },
    ];

  const totalRows = exportItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-sky-600">Backup</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              데이터 내보내기
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              주요 운영 데이터를 CSV 파일로 내려받아 엑셀에서 확인하거나 백업할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportAll(exportItems)}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          >
            전체 다운로드
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="내보내기 항목" value={`${exportItems.length}개`} />
          <SummaryCard label="총 데이터" value={`${totalRows}건`} />
          <SummaryCard label="파일 형식" value="CSV" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {exportItems.map((item) => (
            <section
              key={item.fileName}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {item.count}건
                </span>
              </div>
              <button
                type="button"
                onClick={() => downloadCsv(item.fileName, item.rows)}
                disabled={item.count === 0}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {item.title} 다운로드
              </button>
            </section>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function exportAll(items: ExportItem[]) {
  items.filter((item) => item.count > 0).forEach((item, index) => {
    window.setTimeout(() => downloadCsv(item.fileName, item.rows), index * 150);
  });
}

function downloadCsv(fileName: string, rows: ExportRow[]) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${csvRows.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `houserent-${fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: ExportRow[string]) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
