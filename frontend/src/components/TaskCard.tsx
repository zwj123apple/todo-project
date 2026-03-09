import type { Task } from "../types";
import { useUpdateTask, useDeleteTask } from "../hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const statusColors = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    DONE: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const priorityColors = {
    LOW: "border-l-gray-400",
    MEDIUM: "border-l-blue-400",
    HIGH: "border-l-orange-400",
    URGENT: "border-l-red-400",
  };

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate({
      id: task.id,
      data: { ...task, status: newStatus },
    });
  };

  const handleDelete = () => {
    if (confirm("确定要删除这个任务吗？")) {
      deleteTask.mutate(task.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${priorityColors[task.priority]} hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-gray-400 hover:text-blue-600 p-1"
              title="编辑任务"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 p-1"
            title="删除任务"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {task.tags.map((tag) => (
          <span
            key={tag.id}
            className="px-2 py-1 text-xs rounded-full"
            style={{ backgroundColor: tag.color + "20", color: tag.color }}
          >
            {tag.name}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}
        >
          <option value="TODO">待办</option>
          <option value="IN_PROGRESS">进行中</option>
          <option value="DONE">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">{task.priority}</span>
          {task.dueDate && (
            <span>
              截止:{" "}
              {new Date(task.dueDate).toLocaleDateString("zh-CN", {
                month: "numeric",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
