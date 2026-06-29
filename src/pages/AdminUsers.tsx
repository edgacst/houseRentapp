import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  fetchAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  type AdminUserSummary,
} from "../lib/api";

const roleText = {
  admin: "관리자",
  user: "사용자",
} as const;

const statusText = {
  active: "정상",
  suspended: "정지",
  withdrawn: "탈퇴",
} as const;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const nextUsers = await fetchAdminUsers();
      setUsers(nextUsers);
      setSelectedId((current) => current || nextUsers[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.role, user.status].some((value) =>
        value.toLowerCase().includes(lowerKeyword),
      ),
    );
  }, [keyword, users]);

  const selectedUser =
    users.find((user) => user.id === selectedId) ?? filteredUsers[0] ?? null;

  const totals = users.reduce(
    (sum, user) => ({
      properties: sum.properties + user.counts.properties,
      rooms: sum.rooms + user.counts.rooms,
      contracts: sum.contracts + user.counts.contracts,
      expenses: sum.expenses + user.counts.expenses,
    }),
    { properties: 0, rooms: 0, contracts: 0, expenses: 0 },
  );

  const updateSelectedUser = async (
    user: AdminUserSummary,
    data: Pick<AdminUserSummary, "role" | "status">,
  ) => {
    setError("");
    setNotice("");
    try {
      const updated = await updateAdminUser(user.id, data);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`${updated.name} 회원 정보를 변경했습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원 정보를 변경하지 못했습니다.");
    }
  };

  const resetPasswordForSelectedUser = async () => {
    if (!selectedUser || !resetPassword) return;
    setError("");
    setNotice("");
    try {
      await resetAdminUserPassword(selectedUser.id, resetPassword);
      setResetPassword("");
      setNotice(`${selectedUser.name} 비밀번호를 초기화했습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호를 초기화하지 못했습니다.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold text-violet-600">Admin</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            회원관리
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            가입 회원의 상태, 권한, 등록 데이터와 비밀번호 초기화를 관리합니다.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="전체 회원" value={`${users.length}명`} />
          <SummaryCard label="등록 건물" value={`${totals.properties}개`} />
          <SummaryCard label="등록 호실" value={`${totals.rooms}개`} />
          <SummaryCard label="계약" value={`${totals.contracts}건`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="이름, 이메일, 역할, 상태 검색"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr_repeat(3,0.45fr)] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black text-slate-500">
              <span>회원</span>
              <span>상태</span>
              <span>가입일</span>
              <span className="text-right">건물</span>
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
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedId(user.id)}
                className={`grid w-full grid-cols-[1.3fr_0.7fr_0.7fr_repeat(3,0.45fr)] gap-3 border-b border-slate-100 px-5 py-4 text-left text-sm last:border-b-0 ${
                  selectedUser?.id === user.id ? "bg-violet-50/60" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-black text-slate-950">{user.name}</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <StatusBadge status={user.status} />
                <span className="font-semibold text-slate-600">{user.createdAt}</span>
                <Count value={user.counts.properties} />
                <Count value={user.counts.contracts} />
                <Count value={user.counts.expenses} />
              </button>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedUser ? (
              <p className="text-sm text-slate-500">회원을 선택하세요.</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-bold text-slate-500">회원 상세</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {selectedUser.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
                  <div className="mt-3 flex gap-2">
                    <RoleBadge role={selectedUser.role} />
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DetailMetric label="건물" value={selectedUser.counts.properties} />
                  <DetailMetric label="호실" value={selectedUser.counts.rooms} />
                  <DetailMetric label="임차인" value={selectedUser.counts.tenants} />
                  <DetailMetric label="계약" value={selectedUser.counts.contracts} />
                  <DetailMetric label="월세" value={selectedUser.counts.rentPayments} />
                  <DetailMetric label="지출" value={selectedUser.counts.expenses} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">권한</span>
                    <select
                      value={selectedUser.role}
                      onChange={(event) =>
                        void updateSelectedUser(selectedUser, {
                          role: event.target.value as AdminUserSummary["role"],
                          status: selectedUser.status,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                    >
                      <option value="admin">관리자</option>
                      <option value="user">사용자</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">상태</span>
                    <select
                      value={selectedUser.status}
                      onChange={(event) =>
                        void updateSelectedUser(selectedUser, {
                          role: selectedUser.role,
                          status: event.target.value as AdminUserSummary["status"],
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                    >
                      <option value="active">정상</option>
                      <option value="suspended">정지</option>
                      <option value="withdrawn">탈퇴</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">비밀번호 초기화</p>
                  <p className="mt-1 text-xs text-slate-500">
                    새 비밀번호를 입력하면 해당 회원은 새 비밀번호로 로그인합니다.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      placeholder="8자 이상 새 비밀번호"
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      disabled={resetPassword.length < 8}
                      onClick={() => void resetPasswordForSelectedUser()}
                      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
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

function RoleBadge({ role }: { role: AdminUserSummary["role"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
        role === "admin"
          ? "bg-violet-50 text-violet-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {roleText[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminUserSummary["status"] }) {
  const className =
    status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : status === "suspended"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-black ${className}`}>
      {statusText[status]}
    </span>
  );
}

function Count({ value }: { value: number }) {
  return <span className="text-right font-black text-slate-950">{value}</span>;
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
