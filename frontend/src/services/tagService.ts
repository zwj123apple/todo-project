import apiClient from "../lib/axios";
import type { ApiResponse, Tag, TagRequest } from "../types";

export const tagService = {
  getAllTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>("/tags");
    return response.data.data;
  },

  getTagById: async (id: number): Promise<Tag> => {
    const response = await apiClient.get<ApiResponse<Tag>>(`/tags/${id}`);
    return response.data.data;
  },

  createTag: async (data: TagRequest): Promise<Tag> => {
    const response = await apiClient.post<ApiResponse<Tag>>("/tags", data);
    return response.data.data;
  },

  updateTag: async (id: number, data: TagRequest): Promise<Tag> => {
    const response = await apiClient.put<ApiResponse<Tag>>(`/tags/${id}`, data);
    return response.data.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },
};
