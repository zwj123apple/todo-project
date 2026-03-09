export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  completionTrend: Record<string, number>;
  creationTrend: Record<string, number>;
  completionRate: number;
}
