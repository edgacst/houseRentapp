import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useAppData } from "./context/AppContext";
import Account from "./pages/Account";
import AdminUsers from "./pages/AdminUsers";
import Alerts from "./pages/Alerts";
import Auth from "./pages/Auth";
import Contracts from "./pages/Contracts";
import Dashboard from "./pages/Dashboard";
import DataExport from "./pages/DataExport";
import Documents from "./pages/Documents";
import Expenses from "./pages/Expenses";
import Maintenance from "./pages/Maintenance";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Rents from "./pages/Rents";
import Rooms from "./pages/Rooms";
import Statistics from "./pages/Statistics";
import Tenants from "./pages/Tenants";

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

function AppRoutes() {
  const { user, isBootstrapping } = useAppData();

  if (isBootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">
        하우스렌트 준비 중
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/rents" element={<Rents />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/export" element={<DataExport />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
