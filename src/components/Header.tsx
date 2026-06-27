import { useAppData } from "../context/AppContext";

function Header() {
  const { user, logout } = useAppData();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="mt-1 text-sm text-slate-500">
          임대 현황과 월세 수납 상태를 확인하세요.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;
