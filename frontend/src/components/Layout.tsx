import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout as AntLayout, Menu, Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  CheckSquareOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../stores/authStore";
import { usePermission } from "../hooks/usePermission";
import { ROUTES } from "../config";
import { NotificationToast } from "./NotificationToast";

const { Header, Content, Sider } = AntLayout;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { isAdmin } = usePermission();

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  const baseMenuItems: MenuProps["items"] = [
    {
      key: ROUTES.DASHBOARD,
      icon: <DashboardOutlined />,
      label: "仪表盘",
      onClick: () => navigate(ROUTES.DASHBOARD),
    },
    {
      key: "tasks",
      icon: <CheckSquareOutlined />,
      label: "任务管理",
      children: [
        {
          key: ROUTES.TASKS,
          label: "任务列表",
          onClick: () => navigate(ROUTES.TASKS),
        },
        {
          key: ROUTES.TASKS_DND,
          label: "拖拽排序",
          onClick: () => navigate(ROUTES.TASKS_DND),
        },
      ],
    },
    {
      key: ROUTES.STATISTICS,
      icon: <BarChartOutlined />,
      label: "数据统计",
      onClick: () => navigate(ROUTES.STATISTICS),
    },
    {
      key: "files",
      icon: <CloudUploadOutlined />,
      label: "文件管理",
      children: [
        {
          key: ROUTES.FILE_UPLOAD,
          label: "文件上传",
          onClick: () => navigate(ROUTES.FILE_UPLOAD),
        },
        {
          key: ROUTES.FILE_LIST,
          label: "文件列表",
          onClick: () => navigate(ROUTES.FILE_LIST),
        },
      ],
    },
  ];

  // 管理员菜单项
  const adminMenuItems: MenuProps["items"] = isAdmin()
    ? [
        {
          type: "divider",
        },
        {
          key: "admin",
          icon: <TeamOutlined />,
          label: "管理员",
          children: [
            {
              key: ROUTES.ADMIN_USERS,
              label: "用户管理",
              onClick: () => navigate(ROUTES.ADMIN_USERS),
            },
          ],
        },
      ]
    : [];

  // 合并菜单项
  const menuItems: MenuProps["items"] = [...baseMenuItems, ...adminMenuItems];

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
      onClick: () => navigate(ROUTES.PROFILE),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
      danger: true,
    },
  ];

  // 获取当前路由对应的菜单key
  const selectedKey = location.pathname;

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          TodoPro
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <AntLayout style={{ marginLeft: 200 }}>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
        <NotificationToast />
      </AntLayout>
    </AntLayout>
  );
}
