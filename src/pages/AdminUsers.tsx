import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { fetchAdminUsers, type AdminUserSummary } from "../lib/api";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setUsers(await fetchAdminUsers());
      } catch (err) {
        setError(err instanceof Error ? err.message : "회원 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.role]
        .some((value) => value.toLowerCase().includes(lowerKeyword)),
    );
  }, [keyword, users]);

  const totals = users.reduce(
    (sum, user) => ({
      properties: sum.properties + user.counts.properties,
      rooms: sum.rooms + user.counts.rooms,
      contracts: sum.contracts + user.counts.contracts,
      expenses: sum.expenses + user.counts.expenses,
    }),
    { properties: 0, rooms: 0, contracts: 0, expenses: 0 },
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold text-violet-600">Admin</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            회원관리
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            서비스에 가입한 회원과 각 회원의 등록 데이터를 확인합니다.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 회원" value={`${users.length}명`} />
          <SummaryCard label="등록 건물" value={`${totals.properties}개`} />
          <SummaryCard label="등록 호실" value={`${totals.rooms}개`} />
          <SummaryCard label="계약" value={`${totals.contracts}건`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 이메일, 역할 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.2fr_1fr_repeat(5,0.6fr)] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black text-slate-500">
            <span>회원</span>
            <span>가입일</span>
            <span className="text-right">건물</span>
            <span className="text-right">호실</span>
            <span className="text-right">임차인</span>
            <span className="text-right">계약</span>
            <span className="text-right">지출</span>
          </div>
          {isLoading && (
            <p className="p-6 text-sm text-slate-500">회원 정보를 불러오는 중입니다.</p>
          )}
          {!isLoading && filteredUsers.length === 0 && (
            <p className="p-6 text-sm text-slate-500">표시할 회원이 없습니다.</p>
          )}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1.2fr_1fr_repeat(5,0.6fr)] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-black text-slate-950">{user.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                      user.role === "admin"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.role === "admin" ? "관리자" : "사용자"}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <span className="font-semibold text-slate-600">{user.createdAt}</span>
              <Count value={user.counts.properties} />
              <Count value={user.counts.rooms} />
              <Count value={user.counts.tenants} />
              <Count value={user.counts.contracts} />
              <Count value={user.counts.expenses} />
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

function Count({ value }: { value: number }) {
  return <span className="text-right font-black text-slate-950">{value}</span>;
}
