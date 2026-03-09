import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTasks, useUpdateTask } from "../hooks/useTasks";
import DraggableTaskCard from "../components/DraggableTaskCard";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import type { Task } from "../types";

const TasksPageWithDnD = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading, error } = useTasks();
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移动后才开始拖拽
      },
    }),
  );

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
    TODO: filteredTasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: filteredTasks.filter((t) => t.status === "DONE"),
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask) {
      setActiveTask(null);
      return;
    }

    // 如果拖拽到另一个任务上，更新状态为目标任务的状态
    if (overTask && activeTask.status !== overTask.status) {
      updateTask.mutate({
        id: activeTask.id,
        data: { ...activeTask, status: overTask.status },
      });
    }

    setActiveTask(null);
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="px-4 py-6">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            任务列表（拖拽排序）
          </h1>
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
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
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

        {/* 任务列表（支持拖拽） */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-sm font-medium text-gray-900">没有找到任务</h3>
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
          <SortableContext
            items={filteredTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <DraggableTaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        )}

        {/* 拖拽预览 */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>

        {/* 创建任务Modal */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </DndContext>
  );
};

export default TasksPageWithDnD;
