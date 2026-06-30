import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { RentPayment, RentStatus } from "../types/business";

type SmsDeposit = {
  id: string;
  raw: string;
  amount: number;
  paidDate: string;
  sender: string;
};

type SmsMatch = {
  deposit: SmsDeposit;
  candidateIds: string[];
  selectedPaymentId: string;
  status: "matched" | "ambiguous" | "unmatched";
};

const statusText: Record<RentStatus, string> = {
  paid: "납부 완료",
  unpaid: "미납",
  late: "연체",
};

const statusClass: Record<RentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-amber-50 text-amber-700",
  late: "bg-red-50 text-red-700",
};

const bankWords = [
  "국민",
  "국민은행",
  "신한",
  "신한은행",
  "우리",
  "우리은행",
  "하나",
  "하나은행",
  "농협",
  "카카오",
  "카카오뱅크",
  "토스",
  "입금",
  "출금",
  "잔액",
  "이체",
];

export default function Rents() {
  const {
    properties,
    rooms,
    tenants,
    contracts,
    rentPayments,
    upsertRentPayment,
    deleteRentPayment,
    generateMonthlyRentPayments,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RentPayment | null>(null);
  const [form, setForm] = useState<RentPayment>(createEmptyPayment());
  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsMatches, setSmsMatches] = useState<SmsMatch[]>([]);

  function createEmptyPayment(): RentPayment {
    const firstContract = contracts[0];
    return {
      id: "",
      contractId: firstContract?.id ?? "",
      dueDate: new Date().toISOString().slice(0, 10),
      paidDate: "",
      rentAmount: firstContract?.monthlyRent ?? 0,
      maintenanceFee: firstContract?.maintenanceFee ?? 0,
      status: "unpaid",
      memo: "",
    };
  }

  const openPayments = useMemo(
    () => rentPayments.filter((payment) => payment.status !== "paid"),
    [rentPayments],
  );

  const filteredPayments = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return rentPayments.filter((payment) => {
      const contract = contracts.find((item) => item.id === payment.contractId);
      const property = properties.find((item) => item.id === contract?.propertyId);
      const room = rooms.find((item) => item.id === contract?.roomId);
      const tenant = tenants.find((item) => item.id === contract?.tenantId);
      return [property?.name, room?.name, tenant?.name, payment.dueDate]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerKeyword));
    });
  }, [contracts, keyword, properties, rentPayments, rooms, tenants]);

  const paidTotal = rentPayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.rentAmount + payment.maintenanceFee, 0);
  const unpaidTotal = openPayments.reduce(
    (sum, payment) => sum + payment.rentAmount + payment.maintenanceFee,
    0,
  );

  const openForm = (payment?: RentPayment) => {
    setFormError("");
    setEditingPayment(payment ?? null);
    setForm(payment ?? createEmptyPayment());
    setIsOpen(true);
  };

  const getContractParts = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId);
    const property = properties.find((item) => item.id === contract?.propertyId);
    const room = rooms.find((item) => item.id === contract?.roomId);
    const tenant = tenants.find((item) => item.id === contract?.tenantId);
    return { contract, property, room, tenant };
  };

  const getContractLabel = (contractId: string) => {
    const { property, room, tenant } = getContractParts(contractId);
    return `${property?.name ?? "-"} ${room?.name ?? "-"} · ${tenant?.name ?? "-"}`;
  };

  const findSmsCandidates = (deposit: SmsDeposit) => {
    const normalizedRaw = normalizeText(deposit.raw);
    const normalizedSender = normalizeText(deposit.sender);

    const scoredPayments = openPayments
      .map((payment) => {
        const tenantName = normalizeText(getContractParts(payment.contractId).tenant?.name ?? "");
        const totalAmount = payment.rentAmount + payment.maintenanceFee;
        const tenantMatched =
          tenantName &&
          (normalizedRaw.includes(tenantName) || normalizedSender.includes(tenantName));
        const amountMatched = totalAmount === deposit.amount;

        return {
          payment,
          score: Number(amountMatched) * 3 + Number(tenantMatched) * 5,
        };
      })
      .filter((item) => item.score > 0);

    return scoredPayments
      .sort((a, b) => {
        if (a.score === b.score) {
          return a.payment.dueDate.localeCompare(b.payment.dueDate);
        }
        return b.score - a.score;
      })
      .map((item) => item.payment.id);
  };

  const analyzeSmsText = () => {
    const deposits = parseSmsDeposits(smsText);
    const nextMatches = deposits.map((deposit) => {
      const candidateIds = findSmsCandidates(deposit);
      return {
        deposit,
        candidateIds,
        selectedPaymentId: candidateIds[0] ?? "",
        status:
          candidateIds.length === 1
            ? "matched"
            : candidateIds.length > 1
              ? "ambiguous"
              : "unmatched",
      } satisfies SmsMatch;
    });
    setSmsMatches(nextMatches);
    setNotice(
      nextMatches.length
        ? `입금 문자 ${nextMatches.length}건을 분석했습니다.`
        : "인식된 입금 문자가 없습니다. 금액에 '원'이 포함된 문자를 붙여넣어 주세요.",
    );
  };

  const applySmsPayment = async (match: SmsMatch) => {
    const payment = rentPayments.find((item) => item.id === match.selectedPaymentId);
    if (!payment) {
      setNotice("선택한 월세 청구를 찾을 수 없습니다.");
      return;
    }

    const existingTotal = payment.rentAmount + payment.maintenanceFee;

    await upsertRentPayment({
      ...payment,
      rentAmount:
        existingTotal === 0 && match.deposit.amount > 0
          ? match.deposit.amount
          : payment.rentAmount,
      paidDate: match.deposit.paidDate,
      status: "paid",
      memo: [payment.memo, `입금 문자 자동 처리: ${match.deposit.sender || "입금자 미확인"}`]
        .filter(Boolean)
        .join("\n"),
    });
    setSmsMatches((prev) => prev.filter((item) => item.deposit.id !== match.deposit.id));
    setNotice(`${getContractLabel(payment.contractId)} 월세를 납부 완료로 처리했습니다.`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-blue-600">Rent</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              월세 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              월세와 관리비 청구, 입금 확인, 미납과 연체 상태를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            disabled={contracts.length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 월세 등록
          </button>
        </div>

        {contracts.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            월세 등록을 하려면 진행 중인 계약이 먼저 필요합니다.
          </div>
        )}

        {notice && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 청구" value={`${rentPayments.length}건`} />
          <SummaryCard
            label="납부 완료"
            value={`${rentPayments.filter((item) => item.status === "paid").length}건`}
          />
          <SummaryCard label="납부액" value={`${paidTotal.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="미납액" value={`${unpaidTotal.toLocaleString("ko-KR")}원`} />
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-blue-900">월세 자동 생성</p>
              <p className="mt-1 text-xs text-blue-700">
                선택한 월에 진행 중인 계약 기준으로 미납 청구서를 생성합니다.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="month"
                value={generateMonth}
                onChange={(event) => setGenerateMonth(event.target.value)}
                className="rounded-lg border border-blue-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                disabled={contracts.length === 0}
                onClick={async () => {
                  const count = await generateMonthlyRentPayments(generateMonth);
                  setNotice(`${generateMonth} 월세 청구 ${count}건을 생성했습니다.`);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                청구 자동 생성
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-base font-black text-slate-950">입금 문자 자동 처리</p>
              <p className="mt-1 text-sm text-slate-500">
                은행 입금 문자를 붙여넣으면 금액과 임차인 이름을 기준으로 미납 월세를 찾아 납부 처리합니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={analyzeSmsText}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                문자 분석
              </button>
              <button
                type="button"
                onClick={() => {
                  setSmsText("");
                  setSmsMatches([]);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                초기화
              </button>
            </div>
          </div>
          <textarea
            value={smsText}
            onChange={(event) => setSmsText(event.target.value)}
            placeholder={`예) [국민은행] 06/29 김동자 입금 500,000원 잔액 1,200,000원`}
            rows={5}
            className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />

          {smsMatches.length > 0 && (
            <div className="mt-4 space-y-3">
              {smsMatches.map((match) => (
                <div
                  key={match.deposit.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {match.deposit.amount.toLocaleString("ko-KR")}원 ·{" "}
                        {match.deposit.paidDate}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        입금자: {match.deposit.sender || "문자에서 확인 필요"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                        {match.deposit.raw}
                      </p>
                    </div>

                    <select
                      value={match.selectedPaymentId}
                      onChange={(event) =>
                        setSmsMatches((prev) =>
                          prev.map((item) =>
                            item.deposit.id === match.deposit.id
                              ? { ...item, selectedPaymentId: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                    >
                      <option value="">
                        {match.status === "unmatched" ? "매칭 없음" : "청구 선택"}
                      </option>
                      {match.candidateIds.map((paymentId) => {
                        const payment = rentPayments.find((item) => item.id === paymentId);
                        return (
                          <option key={paymentId} value={paymentId}>
                            {payment
                              ? `${getContractLabel(payment.contractId)} · ${payment.dueDate}`
                              : paymentId}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      disabled={!match.selectedPaymentId}
                      onClick={() => void applySmsPayment(match)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      납부 처리
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="건물, 호실, 임차인, 납부 예정일 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        {isOpen && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setFormError("");
              setIsSaving(true);
              try {
                await upsertRentPayment({
                  ...form,
                  paidDate:
                    form.status === "paid"
                      ? form.paidDate || new Date().toISOString().slice(0, 10)
                      : "",
                });
                setIsOpen(false);
                setEditingPayment(null);
              } catch (error) {
                setFormError(
                  error instanceof Error
                    ? error.message
                    : "월세 내역을 저장하지 못했습니다.",
                );
              } finally {
                setIsSaving(false);
              }
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-black text-slate-950">
              {editingPayment ? "월세 수정" : "월세 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">계약</span>
                <select
                  value={form.contractId}
                  required
                  onChange={(event) => {
                    const contract = contracts.find(
                      (item) => item.id === event.target.value,
                    );
                    setForm({
                      ...form,
                      contractId: event.target.value,
                      rentAmount: contract?.monthlyRent ?? form.rentAmount,
                      maintenanceFee:
                        contract?.maintenanceFee ?? form.maintenanceFee,
                    });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">선택</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {getContractLabel(contract.id)}
                    </option>
                  ))}
                </select>
              </label>
              <DateField
                label="납부 예정일"
                value={form.dueDate}
                onChange={(value) => setForm({ ...form, dueDate: value })}
              />
              <DateField
                label="실제 납부일"
                value={form.paidDate ?? ""}
                required={false}
                onChange={(value) => setForm({ ...form, paidDate: value })}
              />
              <NumberField
                label="월세"
                value={form.rentAmount}
                placeholder="예: 450000"
                suffix="원"
                onChange={(value) => setForm({ ...form, rentAmount: value })}
              />
              <NumberField
                label="관리비"
                value={form.maintenanceFee}
                placeholder="예: 50000"
                suffix="원"
                onChange={(value) => setForm({ ...form, maintenanceFee: value })}
              />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">납부 상태</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as RentStatus })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  {Object.entries(statusText).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">메모</span>
              <textarea
                value={form.memo}
                onChange={(event) => setForm({ ...form, memo: event.target.value })}
                placeholder="입금자명, 일부 납부, 특이사항을 입력하세요."
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            {formError && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {formError}
              </p>
            )}
            <FormActions
              isSaving={isSaving}
              onCancel={() => {
                setFormError("");
                setIsOpen(false);
                setEditingPayment(null);
              }}
            />
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-950">월세 청구 목록</h2>
              <p className="mt-1 text-sm text-slate-500">
                총 {filteredPayments.length.toLocaleString("ko-KR")}건
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="w-16 px-5 py-3">순번</th>
                  <th className="px-5 py-3">계약</th>
                  <th className="px-5 py-3">납부 예정일</th>
                  <th className="px-5 py-3">납부일</th>
                  <th className="px-5 py-3 text-right">월세</th>
                  <th className="px-5 py-3 text-right">관리비</th>
                  <th className="px-5 py-3 text-right">합계</th>
                  <th className="px-5 py-3">상태</th>
                  <th className="px-5 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      표시할 월세 청구가 없습니다.
                    </td>
                  </tr>
                )}
                {filteredPayments.map((payment, index) => (
                  <tr key={payment.id} className="align-middle hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-black text-slate-400">{index + 1}</td>
                    <td className="max-w-[280px] px-5 py-4">
                      <p className="truncate font-bold text-slate-900">
                        {getContractLabel(payment.contractId)}
                      </p>
                      {payment.memo && (
                        <p className="mt-1 truncate text-xs text-slate-500">{payment.memo}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{payment.dueDate}</td>
                    <td className="px-5 py-4 text-slate-500">{payment.paidDate || "-"}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-700">
                      {payment.rentAmount.toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-700">
                      {payment.maintenanceFee.toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-950">
                      {(payment.rentAmount + payment.maintenanceFee).toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[payment.status]}`}
                      >
                        {statusText[payment.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {payment.status !== "paid" && (
                          <button
                            onClick={() =>
                              void upsertRentPayment({
                                ...payment,
                                status: "paid",
                                paidDate: new Date().toISOString().slice(0, 10),
                              })
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            납부
                          </button>
                        )}
                        <button
                          onClick={() => openForm(payment)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => void deleteRentPayment(payment.id)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function parseSmsDeposits(text: string): SmsDeposit[] {
  const chunks = text
    .split(/\n\s*\n/)
    .flatMap((chunk) => (chunk.includes("\n") ? chunk.split("\n") : [chunk]))
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks
    .map((raw, index) => {
      const amount = extractAmount(raw);
      if (!amount) {
        return null;
      }

      return {
        id: `${Date.now()}-${index}`,
        raw,
        amount,
        paidDate: extractDate(raw),
        sender: extractSender(raw),
      };
    })
    .filter((item): item is SmsDeposit => Boolean(item));
}

function extractAmount(text: string) {
  const matches = [...text.matchAll(/([0-9][0-9,]*)\s*원/g)];
  if (!matches.length) {
    return 0;
  }

  const depositMatch =
    matches.find((match) => {
      const start = Math.max(0, (match.index ?? 0) - 12);
      const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 12);
      return /입금|받음|이체/.test(text.slice(start, end));
    }) ?? matches[0];

  return Number(depositMatch[1].replace(/,/g, ""));
}

function extractDate(text: string) {
  const currentYear = new Date().getFullYear();
  const fullDate = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (fullDate) {
    return formatDate(Number(fullDate[1]), Number(fullDate[2]), Number(fullDate[3]));
  }

  const shortDate = text.match(/(\d{1,2})[./-](\d{1,2})/);
  if (shortDate) {
    return formatDate(currentYear, Number(shortDate[1]), Number(shortDate[2]));
  }

  return new Date().toISOString().slice(0, 10);
}

function extractSender(text: string) {
  const explicit = text.match(/입금(?:자|인)?\s*[: ]\s*([가-힣A-Za-z0-9]+)/);
  if (explicit) {
    return explicit[1];
  }

  const beforeAmount = text.match(/^([가-힣A-Za-z]{2,12})\s+[0-9][0-9,]*\s*원/);
  if (beforeAmount && !bankWords.includes(beforeAmount[1])) {
    return beforeAmount[1];
  }

  const beforeDeposit = text.match(/([가-힣A-Za-z]{2,12})\s*(?:님)?\s*(?:입금|이체)/);
  if (beforeDeposit && !bankWords.includes(beforeDeposit[1])) {
    return beforeDeposit[1];
  }

  const afterAmount = text.match(/원\s*([가-힣A-Za-z]{2,12})/);
  if (afterAmount && !bankWords.includes(afterAmount[1])) {
    return afterAmount[1];
  }

  return "";
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeText(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

function DateField({
  label,
  value,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type="date"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  placeholder: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="relative mt-2">
        <input
          type="number"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 ${
            suffix ? "pr-12" : ""
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function FormActions({
  isSaving = false,
  onCancel,
}: {
  isSaving?: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
      >
        취소
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSaving ? "저장 중" : "저장"}
      </button>
    </div>
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
