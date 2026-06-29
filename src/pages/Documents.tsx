import { useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";

type DocumentKind = "property_image" | "property_document" | "contract" | "receipt";

type ManagedDocument = {
  id: string;
  kind: DocumentKind;
  name: string;
  data: string;
  owner: string;
  detail: string;
  date?: string;
};

const kindText: Record<DocumentKind, string> = {
  property_image: "건물 사진",
  property_document: "건물 문서",
  contract: "계약서",
  receipt: "영수증",
};

const kindClass: Record<DocumentKind, string> = {
  property_image: "bg-blue-50 text-blue-700",
  property_document: "bg-slate-100 text-slate-700",
  contract: "bg-violet-50 text-violet-700",
  receipt: "bg-emerald-50 text-emerald-700",
};

export default function Documents() {
  const { properties, rooms, tenants, contracts, expenses } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [kind, setKind] = useState<"all" | DocumentKind>("all");

  const roomName = (roomId?: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "";
  const tenantName = (tenantId?: string) =>
    tenants.find((tenant) => tenant.id === tenantId)?.name ?? "";
  const propertyName = (propertyId?: string) =>
    properties.find((property) => property.id === propertyId)?.name ?? "미등록 건물";

  const propertyDocuments = properties.flatMap((property) => {
    const images = (property.imageNames ?? []).map((name, index) => ({
      id: `property-image-${property.id}-${index}`,
      kind: "property_image" as const,
      name,
      data: property.imageDataList?.[index] ?? "",
      owner: property.name,
      detail: property.address,
    }));
    const docs = (property.documentNames ?? []).map((name, index) => ({
      id: `property-document-${property.id}-${index}`,
      kind: "property_document" as const,
      name,
      data: property.documentDataList?.[index] ?? "",
      owner: property.name,
      detail: "등기부, 건축물대장, 기타 건물 문서",
    }));
    return [...images, ...docs];
  });

  const contractDocuments = contracts
    .filter((contract) => contract.attachmentName && contract.attachmentData)
    .map((contract) => ({
      id: `contract-${contract.id}`,
      kind: "contract" as const,
      name: contract.attachmentName ?? "계약서",
      data: contract.attachmentData ?? "",
      owner: propertyName(contract.propertyId),
      detail: `${roomName(contract.roomId)} · ${tenantName(contract.tenantId)} · ${contract.startDate}~${contract.endDate}`,
      date: contract.startDate,
    }));

  const receiptDocuments = expenses
    .filter((expense) => expense.receiptName && expense.receiptData)
    .map((expense) => ({
      id: `expense-${expense.id}`,
      kind: "receipt" as const,
      name: expense.receiptName ?? "영수증",
      data: expense.receiptData ?? "",
      owner: propertyName(expense.propertyId),
      detail: `${expense.title} · ${expense.amount.toLocaleString("ko-KR")}원`,
      date: expense.expenseDate,
    }));

  const documents: ManagedDocument[] = [
    ...propertyDocuments,
    ...contractDocuments,
    ...receiptDocuments,
  ].filter((document) => Boolean(document.data));

  const filteredDocuments = documents.filter((document) => {
    const lowerKeyword = keyword.toLowerCase();
    const matchesKind = kind === "all" || document.kind === kind;
    const matchesKeyword = [
      document.name,
      document.owner,
      document.detail,
      kindText[document.kind],
    ].some((value) => value.toLowerCase().includes(lowerKeyword));
    return matchesKind && matchesKeyword;
  });

  const counts = documents.reduce(
    (result, document) => ({
      ...result,
      [document.kind]: result[document.kind] + 1,
    }),
    {
      property_image: 0,
      property_document: 0,
      contract: 0,
      receipt: 0,
    } as Record<DocumentKind, number>,
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold text-violet-600">Documents</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            문서함
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            건물 사진, 건물 문서, 계약서, 영수증을 게시판 형식으로 확인합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <SummaryCard label="전체 파일" value={`${documents.length}개`} />
          <SummaryCard label="건물 사진" value={`${counts.property_image}개`} />
          <SummaryCard label="건물 문서" value={`${counts.property_document}개`} />
          <SummaryCard label="계약서" value={`${counts.contract}개`} />
          <SummaryCard label="영수증" value={`${counts.receipt}개`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[180px_1fr]">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as typeof kind)}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            >
              <option value="all">전체 종류</option>
              <option value="property_image">건물 사진</option>
              <option value="property_document">건물 문서</option>
              <option value="contract">계약서</option>
              <option value="receipt">영수증</option>
            </select>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="파일명, 건물명, 임차인, 설명 검색"
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[150px_1fr_180px_1.4fr_120px_100px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black text-slate-500">
            <span>종류</span>
            <span>파일명</span>
            <span>대상</span>
            <span>설명</span>
            <span>날짜</span>
            <span className="text-right">관리</span>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              표시할 문서가 없습니다.
            </div>
          )}

          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="grid grid-cols-[150px_1fr_180px_1.4fr_120px_100px] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
            >
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-black ${kindClass[document.kind]}`}
              >
                {kindText[document.kind]}
              </span>
              <span className="min-w-0 truncate font-black text-slate-950">
                {document.name}
              </span>
              <span className="min-w-0 truncate font-semibold text-slate-700">
                {document.owner}
              </span>
              <span className="min-w-0 truncate text-slate-500">
                {document.detail}
              </span>
              <span className="text-slate-500">{document.date || "-"}</span>
              <a
                href={document.data}
                download={document.name}
                className="rounded-lg bg-slate-950 px-3 py-2 text-center text-xs font-bold text-white"
              >
                내려받기
              </a>
            </div>
          ))}
        </section>
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
