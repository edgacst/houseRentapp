import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Contracts from "./pages/Contracts";
import Rents from "./pages/Rents";
import Statistics from "./pages/Statistics";
import { AppProvider } from "./context/AppContext";
import Auth from "./pages/Auth";
import { useAppData } from "./context/AppContext";

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
        HOUSERENT 준비 중
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
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/rents" element={<Rents />} />
        <Route path="/statistics" element={<Statistics />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
