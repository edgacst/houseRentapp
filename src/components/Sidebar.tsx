import { NavLink } from "react-router-dom";
import { useAppData } from "../context/AppContext";

const menus = [
  { name: "대시보드", path: "/dashboard", icon: "D" },
  { name: "부동산", path: "/properties", icon: "P" },
  { name: "호실관리", path: "/rooms", icon: "R" },
  { name: "임차인", path: "/tenants", icon: "T" },
  { name: "계약관리", path: "/contracts", icon: "C" },
  { name: "월세관리", path: "/rents", icon: "W" },
  { name: "지출관리", path: "/expenses", icon: "E" },
  { name: "관리비", path: "/maintenance", icon: "M" },
  { name: "통계", path: "/statistics", icon: "S" },
  { name: "계정", path: "/account", icon: "A" },
];

function Sidebar() {
  const { user, logout } = useAppData();

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
            HR
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">HOUSERENT</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Rental operations
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-8 w-8 place-items-center rounded-md text-xs ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {menu.icon}
                </span>
                {menu.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">현재 단계</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            인증 + DB + 수익/지출 관리
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div className="h-2 w-5/6 rounded-full bg-blue-600" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-black text-blue-700">
              {user?.name?.slice(0, 1) ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
