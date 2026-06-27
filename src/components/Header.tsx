import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="mt-1 text-sm text-slate-500">
          임대 현황과 월세 수납 상태를 확인하세요.
        </p>
      </div>

      <Link
        to="/properties"
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        + 건물 등록
      </Link>
    </header>
  );
}

export default Header;
