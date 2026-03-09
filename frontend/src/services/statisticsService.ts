import axiosInstance from "../lib/axios";
import type { TaskStatistics } from "../types/statistics";

export const statisticsService = {
  getTaskStatistics: async (days?: number): Promise<TaskStatistics> => {
    const params = days ? { days } : {};
    const response = await axiosInstance.get<{ data: TaskStatistics }>(
      "/statistics/tasks",
      { params },
    );
    return response.data.data;
  },
};
