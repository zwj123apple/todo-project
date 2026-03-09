export interface User {
  id: number;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  completedAt?: string;
  userId: number;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  userId: number;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  tagIds?: number[];
}

export interface TagRequest {
  name: string;
  color?: string;
}
