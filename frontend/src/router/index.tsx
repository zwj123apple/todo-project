import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { ROUTES } from "../config";

// 页面组件
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import TasksPage from "../pages/TasksPage";
import TasksPageWithDnD from "../pages/TasksPageWithDnD";
import TaskDetailPage from "../pages/TaskDetailPage";
import StatisticsPage from "../pages/StatisticsPage";
import FileUploadPage from "../pages/FileUploadPage";
import FileListPage from "../pages/FileListPage";
import ProfilePage from "../pages/ProfilePage";
import ForbiddenPage from "../pages/ForbiddenPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import Layout from "../components/Layout";

// 路由守卫
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to={ROUTES.DASHBOARD} />
  );
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* 403 无权限页面 - 公开访问 */}
        <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

        {/* 受保护的路由 */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.TASKS} element={<TasksPage />} />
          <Route path={ROUTES.TASKS_DND} element={<TasksPageWithDnD />} />
          <Route path={ROUTES.TASK_DETAIL} element={<TaskDetailPage />} />
          <Route path={ROUTES.STATISTICS} element={<StatisticsPage />} />
          <Route path={ROUTES.FILE_UPLOAD} element={<FileUploadPage />} />
          <Route path={ROUTES.FILE_LIST} element={<FileListPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
