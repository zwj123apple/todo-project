export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
  TASKS_DND: "/tasks/dnd",
  TASK_DETAIL: "/tasks/:id",
  PROFILE: "/profile",
  STATISTICS: "/statistics",
  FILE_UPLOAD: "/files/upload",
  FILE_LIST: "/files",
  FORBIDDEN: "/403",
  ADMIN_USERS: "/admin/users",
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

export const QUERY_KEYS = {
  TASKS: "tasks",
  TASK: "task",
  TAGS: "tags",
  TAG: "tag",
  USER: "user",
  USERS: "users",
  STATISTICS: "statistics",
  NOTIFICATIONS: "notifications",
} as const;
