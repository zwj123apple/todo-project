import apiClient from "../lib/axios";
import type { ApiResponse, Task, TaskRequest } from "../types";

export const taskService = {
  getAllTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>("/tasks");
    return response.data.data;
  },

  getTasksByStatus: async (status: string): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      `/tasks/status/${status}`,
    );
    return response.data.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  createTask: async (data: TaskRequest): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>("/tasks", data);
    return response.data.data;
  },

  updateTask: async (id: number, data: TaskRequest): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<Task>>(
      `/tasks/${id}`,
      data,
    );
    return response.data.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
