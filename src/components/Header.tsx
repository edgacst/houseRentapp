function Header() {
  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          {today}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          임대 현황 대시보드
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          공실, 계약, 월세 수납 흐름을 한 화면에서 확인하세요.
        </p>
      </div>
    </header>
  );
}

export default Header;
