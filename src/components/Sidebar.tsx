import { NavLink } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useAppData } from "../context/AppContext";
import { buildAlerts } from "../lib/alerts";

const menus = [
  { name: "대시보드", path: "/dashboard", icon: "D" },
  { name: "알림센터", path: "/alerts", icon: "N" },
  { name: "부동산", path: "/properties", icon: "P" },
  { name: "호실관리", path: "/rooms", icon: "R" },
  { name: "임차인", path: "/tenants", icon: "T" },
  { name: "계약관리", path: "/contracts", icon: "C" },
  { name: "월세관리", path: "/rents", icon: "W" },
  { name: "지출관리", path: "/expenses", icon: "E" },
  { name: "관리비", path: "/maintenance", icon: "M" },
  { name: "문서함", path: "/documents", icon: "F" },
  { name: "통계", path: "/statistics", icon: "S" },
  { name: "내보내기", path: "/export", icon: "X" },
  { name: "계정", path: "/account", icon: "A" },
];

const adminMenus = [
  { name: "회원관리", path: "/admin/users", icon: "U" },
];

function Sidebar() {
  const data = useAppData();
  const { user, logout } = data;
  const alertCount = buildAlerts(data).length;

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="border-b border-slate-100 p-6">
        <BrandLogo />
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {[...menus, ...(user?.role === "admin" ? adminMenus : [])].map((menu) => (
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
                <span className="min-w-0 flex-1 truncate">{menu.name}</span>
                {menu.path === "/alerts" && alertCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                      isActive
                        ? "bg-white text-slate-950"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {alertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 p-4">
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
