import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "../services/taskService";
import type { Task, TaskRequest } from "../types";
import { QUERY_KEYS } from "../config";

// 获取所有任务
export const useTasks = () => {
  return useQuery<Task[]>({
    queryKey: [QUERY_KEYS.TASKS],
    queryFn: taskService.getAllTasks,
  });
};

// 按状态获取任务
export const useTasksByStatus = (status: string) => {
  return useQuery<Task[]>({
    queryKey: [QUERY_KEYS.TASKS, status],
    queryFn: () => taskService.getTasksByStatus(status),
    enabled: !!status,
  });
};

// 获取单个任务
export const useTask = (id: number) => {
  return useQuery<Task>({
    queryKey: [QUERY_KEYS.TASK, id],
    queryFn: () => taskService.getTaskById(id),
    enabled: !!id,
  });
};

// 创建任务
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskRequest) => taskService.createTask(data),
    onSuccess: () => {
      // 使任务列表缓存失效，重新获取
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });
};

// 更新任务
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskRequest }) =>
      taskService.updateTask(id, data),
    onSuccess: (_, variables) => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASK, variables.id],
      });
    },
    // 乐观更新
    onMutate: async ({ id, data }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.TASK, id] });

      // 保存之前的数据以便回滚
      const previousTask = queryClient.getQueryData([QUERY_KEYS.TASK, id]);

      // 乐观地更新缓存
      queryClient.setQueryData(
        [QUERY_KEYS.TASK, id],
        (old: Task | undefined) => {
          if (!old) return old;
          return { ...old, ...data };
        },
      );

      return { previousTask };
    },
    // 如果mutation失败，使用context中的值回滚
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          [QUERY_KEYS.TASK, variables.id],
          context.previousTask,
        );
      }
    },
  });
};

// 删除任务
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    },
  });
};
