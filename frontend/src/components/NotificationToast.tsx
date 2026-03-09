import { useEffect } from "react";
import { useNotifications } from "../hooks/useEventSource";

export function NotificationToast() {
  const { notifications, removeNotification, requestNotificationPermission } =
    useNotifications();

  useEffect(() => {
    // 请求浏览器通知权限
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // 自动移除通知
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(0);
      }, 5000); // 5秒后自动移除第一个通知

      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* 通知列表 */}
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`min-w-[300px] max-w-md bg-white rounded-lg shadow-lg p-4 border-l-4 animate-slide-in ${
            notification.type === "task_created"
              ? "border-blue-500"
              : notification.type === "task_updated"
                ? "border-yellow-500"
                : notification.type === "task_deleted"
                  ? "border-red-500"
                  : notification.type === "task_status_changed"
                    ? "border-green-500"
                    : "border-gray-500"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {notification.type === "task_created" && (
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                )}
                {notification.type === "task_updated" && (
                  <svg
                    className="w-5 h-5 text-yellow-500"
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
                )}
                {notification.type === "task_deleted" && (
                  <svg
                    className="w-5 h-5 text-red-500"
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
                )}
                {notification.type === "task_status_changed" && (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <p className="font-semibold text-gray-900">
                  {notification.type === "task_created" && "新任务"}
                  {notification.type === "task_updated" && "任务更新"}
                  {notification.type === "task_deleted" && "任务删除"}
                  {notification.type === "task_status_changed" && "状态变更"}
                </p>
              </div>
              <p className="text-sm text-gray-600">{notification.message}</p>
              {notification.data?.task && (
                <p className="text-xs text-gray-500 mt-1">
                  {notification.data.task.title}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(index)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
