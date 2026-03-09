import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import type { Task } from "../types";

const TasksPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tasks = [], isLoading, error } = useTasks();

  // 筛选任务
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 按状态分组
  const groupedTasks = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">加载任务失败，请刷新重试</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务列表</h1>
          <p className="text-sm text-gray-500 mt-1">
            ✅ 支持编辑、删除、搜索、筛选功能
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          创建任务
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-md ${
                statusFilter === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部 ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter("TODO")}
              className={`px-4 py-2 rounded-md ${
                statusFilter === "TODO"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              待办 ({groupedTasks.TODO.length})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`px-4 py-2 rounded-md ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              进行中 ({groupedTasks.IN_PROGRESS.length})
            </button>
            <button
              onClick={() => setStatusFilter("DONE")}
              className={`px-4 py-2 rounded-md ${
                statusFilter === "DONE"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              已完成 ({groupedTasks.DONE.length})
            </button>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            没有找到任务
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter
              ? "尝试调整筛选条件"
              : "开始创建你的第一个任务吧"}
          </p>
          {!searchQuery && !statusFilter && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              创建任务
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* 创建任务Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* 编辑任务Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}
    </div>
  );
};

export default TasksPage;
