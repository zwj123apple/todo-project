import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";

export interface SSEMessage<T = any> {
  type: string;
  message: string;
  data?: T;
}

export interface UseEventSourceOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useEventSource(
  url: string,
  options: UseEventSourceOptions = {},
) {
  const {
    onMessage,
    onError,
    onOpen,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [error, setError] = useState<Event | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number>(0);
  const accessToken = useAuthStore((state) => state.accessToken);

  // 使用 ref 存储回调函数，避免依赖变化导致重新连接
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onOpenRef.current = onOpen;
  }, [onMessage, onError, onOpen]);

  // 手动重连函数
  const manualReconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    // 触发重新渲染，让 useEffect 重新建立连接
    setIsConnected(false);
  }, []);

  // 断开连接函数
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = 0;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // 直接在 useEffect 中管理连接
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // 如果已经有连接，不重复创建
    if (eventSourceRef.current) {
      return;
    }

    let mounted = true;
    let localReconnectTimeout: number | null = null;

    const createConnection = () => {
      if (!mounted || !accessToken) {
        return;
      }

      try {
        // EventSource 不支持自定义headers，所以我们通过URL参数传递token
        const apiBaseUrl =
          import.meta.env.VITE_API_URL || "http://localhost:8080";
        const urlWithToken = `${apiBaseUrl}${url}?token=${encodeURIComponent(accessToken)}`;
        const eventSource = new EventSource(urlWithToken);

        eventSourceRef.current = eventSource;

        eventSource.onopen = (event) => {
          if (mounted) {
            console.log("SSE连接已建立");
            setIsConnected(true);
            setError(null);
            reconnectAttemptsRef.current = 0;
            onOpenRef.current?.(event);
          }
        };

        eventSource.onmessage = (event) => {
          if (mounted) {
            console.log("收到SSE消息:", event.data);
            setLastMessage(event);
            onMessageRef.current?.(event);
          }
        };

        eventSource.onerror = (event) => {
          console.error("SSE连接错误:", event);

          if (mounted) {
            setIsConnected(false);
            setError(event);
            onErrorRef.current?.(event);
          }

          eventSource.close();
          eventSourceRef.current = null;

          // 尝试重连
          if (
            mounted &&
            reconnect &&
            reconnectAttemptsRef.current < maxReconnectAttempts
          ) {
            reconnectAttemptsRef.current += 1;
            console.log(
              `尝试重连... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            );

            localReconnectTimeout = window.setTimeout(() => {
              createConnection();
            }, reconnectInterval);
            reconnectTimeoutRef.current = localReconnectTimeout;
          }
        };

        // 监听自定义事件
        eventSource.addEventListener("connected", (event) => {
          console.log("连接确认:", (event as MessageEvent).data);
        });

        eventSource.addEventListener("task_created", (event) => {
          if (mounted) {
            console.log("任务创建:", (event as MessageEvent).data);
            setLastMessage(event as MessageEvent);
            onMessageRef.current?.(event as MessageEvent);
          }
        });

        eventSource.addEventListener("task_updated", (event) => {
          if (mounted) {
            console.log("任务更新:", (event as MessageEvent).data);
            setLastMessage(event as MessageEvent);
            onMessageRef.current?.(event as MessageEvent);
          }
        });

        eventSource.addEventListener("task_deleted", (event) => {
          if (mounted) {
            console.log("任务删除:", (event as MessageEvent).data);
            setLastMessage(event as MessageEvent);
            onMessageRef.current?.(event as MessageEvent);
          }
        });

        eventSource.addEventListener("task_status_changed", (event) => {
          if (mounted) {
            console.log("任务状态变更:", (event as MessageEvent).data);
            setLastMessage(event as MessageEvent);
            onMessageRef.current?.(event as MessageEvent);
          }
        });

        eventSource.addEventListener("heartbeat", (event) => {
          console.log("心跳:", (event as MessageEvent).data);
        });
      } catch (err) {
        console.error("创建SSE连接失败:", err);
        if (mounted) {
          setError(err as Event);
        }
      }
    };

    // 立即创建连接
    createConnection();

    // Cleanup
    return () => {
      mounted = false;

      if (localReconnectTimeout) {
        clearTimeout(localReconnectTimeout);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = 0;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [url, accessToken, reconnect, reconnectInterval, maxReconnectAttempts]);

  return {
    isConnected,
    lastMessage,
    error,
    reconnect: manualReconnect,
    disconnect,
  };
}

// 通知Hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<SSEMessage<any>[]>([]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const notification: SSEMessage<any> = {
        type: data.type || "info",
        message: data.message || "",
        data: data.task || data.taskId || data,
      };

      setNotifications((prev) => [...prev, notification]);

      // 可选：显示浏览器通知
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Todo应用通知", {
          body: notification.message,
          icon: "/vite.svg",
        });
      }
    } catch (err) {
      console.error("解析SSE消息失败:", err);
    }
  }, []);

  const { isConnected, error } = useEventSource("/api/notifications/stream", {
    onMessage: handleMessage,
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 请求浏览器通知权限
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    isConnected,
    error,
    clearNotifications,
    removeNotification,
    requestNotificationPermission,
  };
}
