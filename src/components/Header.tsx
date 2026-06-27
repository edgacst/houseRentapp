function Header() {
  return (
    <header className="border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="mt-1 text-sm text-slate-500">
          임대 현황과 월세 수납 상태를 확인하세요.
        </p>
      </div>
    </header>
  );
}

export default Header;
