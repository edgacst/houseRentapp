import { NavLink } from "react-router-dom";

const menus = [
  { name: "대시보드", path: "/dashboard", icon: "D" },
  { name: "부동산", path: "/properties", icon: "P" },
  { name: "호실관리", path: "/rooms", icon: "R" },
  { name: "임차인", path: "/tenants", icon: "T" },
  { name: "계약관리", path: "/contracts", icon: "C" },
  { name: "월세관리", path: "/rents", icon: "W" },
  { name: "통계", path: "/statistics", icon: "S" },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-white">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold tracking-wide">HOUSERENT</h1>
        <p className="mt-2 text-sm text-slate-400">Smart Property Management</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span className="grid h-6 w-6 place-items-center rounded bg-slate-800 text-xs">
              {menu.icon}
            </span>
            {menu.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-800 p-4">
          <p className="text-xs text-slate-400">HOUSERENT</p>
          <p className="mt-1 text-sm font-semibold">Version 1.0</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
