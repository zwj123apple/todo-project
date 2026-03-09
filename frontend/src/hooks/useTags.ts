import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagService } from "../services/tagService";
import type { Tag, TagRequest } from "../types";
import { QUERY_KEYS } from "../config";

// 获取所有标签
export const useTags = () => {
  return useQuery<Tag[]>({
    queryKey: [QUERY_KEYS.TAGS],
    queryFn: tagService.getAllTags,
  });
};

// 创建标签
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagRequest) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TAGS] });
    },
  });
};

// 更新标签
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagRequest }) =>
      tagService.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TAGS] });
    },
  });
};

// 删除标签
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tagService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TAGS] });
    },
  });
};
