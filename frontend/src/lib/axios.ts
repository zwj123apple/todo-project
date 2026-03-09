import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "../config";

// 创建axios实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// 响应拦截器 - Token刷新逻辑
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // 403：无权限，跳转403页面
    if (error.response?.status === 403) {
      window.location.href = "/403";
      return Promise.reject(error);
    }

    // 401：token过期或无效，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        // 没有refreshToken，直接退出登录
        localStorage.clear();

        import("react-hot-toast").then((mod) => {
          mod.toast.error("请先登录", {
            duration: 2000,
            position: "top-center",
          });
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 800);

        return Promise.reject(error);
      }

      try {
        // 调用刷新token接口
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // 保存新token
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // 更新原请求的token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // 处理队列中的请求
        processQueue(null, accessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新token失败，清除本地存储并跳转到登录页
        processQueue(refreshError as AxiosError, null);
        localStorage.clear();

        // 显示友好的toast提示
        import("react-hot-toast").then((mod) => {
          mod.toast.error("登录已过期，请重新登录", {
            duration: 3000,
            position: "top-center",
          });
        });

        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
