import { useState, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTasks } from "../hooks/useTasks";
import DraggableTaskCard from "../components/DraggableTaskCard";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import type { Task } from "../types";

const TasksPageComplete = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [enableDragDrop, setEnableDragDrop] = useState(false);
  const [enableVirtualScroll, setEnableVirtualScroll] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const { data: tasks = [], isLoading, error } = useTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  // 虚拟列表配置
  const rowVirtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

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

    // 这里可以添加拖拽排序的逻辑
    console.log("Dragged", active.id, "to", over.id);
    setActiveTask(null);
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

  // 渲染任务列表内容
  const renderTaskList = () => {
    if (enableVirtualScroll) {
      return (
        <div
          ref={parentRef}
          className="h-[600px] overflow-auto"
          style={{ contain: "strict" }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const task = filteredTasks[virtualRow.index];
              return (
                <div
                  key={task.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {enableDragDrop ? (
                    <DraggableTaskCard task={task} />
                  ) : (
                    <TaskCard task={task} onEdit={handleEdit} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (enableDragDrop) {
      return (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={handleEdit} />
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            任务列表（完整功能版）
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {tasks.length} 个任务
            {filteredTasks.length !== tasks.length &&
              ` (显示 ${filteredTasks.length} 个)`}
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
        <div className="flex flex-col gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 状态筛选和功能开关 */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部 ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter("TODO")}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === "TODO"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              待办 ({groupedTasks.TODO.length})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              进行中 ({groupedTasks.IN_PROGRESS.length})
            </button>
            <button
              onClick={() => setStatusFilter("DONE")}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === "DONE"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              已完成 ({groupedTasks.DONE.length})
            </button>

            {/* 分隔线 */}
            <div className="h-8 w-px bg-gray-300 mx-2"></div>

            {/* 拖拽排序开关 */}
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={enableDragDrop}
                onChange={(e) => setEnableDragDrop(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">🎯 拖拽排序</span>
            </label>

            {/* 虚拟滚动开关 */}
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={enableVirtualScroll}
                onChange={(e) => setEnableVirtualScroll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">⚡ 虚拟滚动</span>
            </label>
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
        renderTaskList()
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

export default TasksPageComplete;
