import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ConfigPage } from './pages/ConfigPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EpiPage } from './pages/EpiPage';
import { DailyPage } from './pages/DailyPage';
import { BadgesPage } from './pages/BadgesPage';
import { HRPage } from './pages/HRPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './components/auth/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/funcionarios" element={<EmployeesPage />} />
          <Route path="/rh" element={<HRPage />} />
          <Route path="/epi" element={<EpiPage />} />
          <Route path="/diarias" element={<DailyPage />} />
          <Route path="/crachas" element={<BadgesPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/notificacoes" element={<NotificationsPage />} />
          <Route path="/configuracoes" element={<ConfigPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
