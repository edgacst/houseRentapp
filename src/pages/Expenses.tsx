import { useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Expense, ExpenseCategory } from "../types/business";

const categoryText: Record<ExpenseCategory, string> = {
  repair: "수리비",
  tax: "세금",
  loan_interest: "대출이자",
  insurance: "보험료",
  brokerage: "중개수수료",
  cleaning: "청소비",
  utility: "공과금",
  management: "관리비 대납",
  supplies: "비품",
  other: "기타",
};

const currentYear = String(new Date().getFullYear());

export default function Expenses() {
  const {
    properties,
    rooms,
    expenses,
    upsertExpense,
    deleteExpense,
  } = useAppData();
  const [keyword, setKeyword] = useState("");
  const [year, setYear] = useState(currentYear);
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<Expense>(createEmptyExpense());

  function createEmptyExpense(): Expense {
    return {
      id: "",
      propertyId: properties[0]?.id ?? "",
      roomId: "",
      title: "",
      category: "repair",
      expenseDate: new Date().toISOString().slice(0, 10),
      amount: 0,
      vendor: "",
      memo: "",
      receiptName: "",
      receiptData: "",
    };
  }

  const filteredExpenses = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return expenses.filter((expense) => {
      const property = properties.find((item) => item.id === expense.propertyId);
      const room = rooms.find((item) => item.id === expense.roomId);
      const matchesYear = expense.expenseDate.startsWith(year);
      const matchesKeyword = [
        expense.title,
        categoryText[expense.category],
        expense.vendor,
        property?.name,
        room?.name,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerKeyword));
      return matchesYear && matchesKeyword;
    });
  }, [expenses, keyword, properties, rooms, year]);

  const annualTotal = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const repairTotal = filteredExpenses
    .filter((expense) => expense.category === "repair")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const taxAndInterestTotal = filteredExpenses
    .filter((expense) => ["tax", "loan_interest"].includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const openForm = (expense?: Expense) => {
    setEditingExpense(expense ?? null);
    setForm(expense ?? createEmptyExpense());
    setIsOpen(true);
  };

  const propertyRooms = rooms.filter((room) => room.propertyId === form.propertyId);

  const getPropertyName = (propertyId: string) =>
    properties.find((property) => property.id === propertyId)?.name ?? "미등록 건물";

  const getRoomName = (roomId?: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "전체 건물";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-rose-600">Expenses</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              지출관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              수리비, 세금, 대출이자, 보험료 등 임대 운영 지출을 기록합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openForm()}
            disabled={properties.length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            + 지출 등록
          </button>
        </div>

        {properties.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            지출을 등록하려면 건물이 먼저 필요합니다.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label={`${year}년 총지출`} value={`${annualTotal.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="수리비" value={`${repairTotal.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="세금+이자" value={`${taxAndInterestTotal.toLocaleString("ko-KR")}원`} />
          <SummaryCard label="지출 건수" value={`${filteredExpenses.length}건`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="건물, 호실, 지출명, 거래처, 분류 검색"
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {isOpen && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await upsertExpense(form);
              setIsOpen(false);
              setEditingExpense(null);
            }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-black text-slate-950">
              {editingExpense ? "지출 수정" : "지출 등록"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="건물"
                value={form.propertyId}
                required
                onChange={(value) =>
                  setForm({ ...form, propertyId: value, roomId: "" })
                }
                options={properties.map((property) => ({
                  value: property.id,
                  label: property.name,
                }))}
              />
              <SelectField
                label="호실"
                value={form.roomId ?? ""}
                onChange={(value) => setForm({ ...form, roomId: value })}
                options={[
                  { value: "", label: "전체 건물" },
                  ...propertyRooms.map((room) => ({
                    value: room.id,
                    label: room.name,
                  })),
                ]}
              />
              <SelectField
                label="분류"
                value={form.category}
                required
                onChange={(value) =>
                  setForm({ ...form, category: value as ExpenseCategory })
                }
                options={Object.entries(categoryText).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <TextField
                label="지출명"
                value={form.title}
                placeholder="예: 102호 싱크대 수리"
                required
                onChange={(value) => setForm({ ...form, title: value })}
              />
              <DateField
                label="지출일"
                value={form.expenseDate}
                onChange={(value) => setForm({ ...form, expenseDate: value })}
              />
              <NumberField
                label="금액"
                value={form.amount}
                placeholder="예: 150000"
                onChange={(value) => setForm({ ...form, amount: value })}
              />
              <TextField
                label="거래처"
                value={form.vendor ?? ""}
                placeholder="예: 홍길동설비"
                onChange={(value) => setForm({ ...form, vendor: value })}
              />
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  영수증 첨부
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () =>
                      setForm({
                        ...form,
                        receiptName: file.name,
                        receiptData: String(reader.result),
                      });
                    reader.readAsDataURL(file);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700 focus:border-slate-900"
                />
                {form.receiptName && (
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    첨부됨: {form.receiptName}
                  </p>
                )}
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">메모</span>
              <textarea
                value={form.memo ?? ""}
                onChange={(event) => setForm({ ...form, memo: event.target.value })}
                placeholder="지출 사유, 처리 내용, 참고사항"
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setEditingExpense(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                저장
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {filteredExpenses.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              등록된 지출이 없습니다.
            </div>
          )}
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                      {categoryText[expense.category]}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {expense.expenseDate}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-black text-slate-950">
                    {expense.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {getPropertyName(expense.propertyId)} · {getRoomName(expense.roomId)}
                    {expense.vendor ? ` · ${expense.vendor}` : ""}
                  </p>
                  {expense.receiptName && (
                    <p className="mt-2 text-xs font-bold text-blue-600">
                      첨부파일: {expense.receiptName}
                    </p>
                  )}
                  {expense.memo && (
                    <p className="mt-2 whitespace-pre-line text-xs text-slate-500">
                      {expense.memo}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <p className="mr-2 text-lg font-black text-slate-950">
                    {expense.amount.toLocaleString("ko-KR")}원
                  </p>
                  <button
                    type="button"
                    onClick={() => openForm(expense)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteExpense(expense.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
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

function TextField({
  label,
  value,
  placeholder,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type="date"
        value={value}
        required
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
  onChange,
}: {
  label: string;
  value: number;
  placeholder?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="relative mt-2">
        <input
          type="number"
          value={value}
          required
          placeholder={placeholder}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-slate-900"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
          원
        </span>
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      >
        {!required && <option value="">선택 안 함</option>}
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
