# React & TypeScript 面试宝典 ⚛️

## 📚 核心知识点

### Q1: React Hooks详解

**答案**:

#### 常用Hooks

**1. useState - 状态管理**

```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(false);

// 函数式更新（避免闭包陷阱）
setTasks((prev) => [...prev, newTask]);
```

**2. useEffect - 副作用**

```typescript
// 组件挂载时执行
useEffect(() => {
  fetchTasks();
}, []); // 空依赖数组

// 依赖变化时执行
useEffect(() => {
  if (userId) {
    fetchUserTasks(userId);
  }
}, [userId]); // userId变化时执行

// 清理副作用
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // 组件卸载时清理
}, []);
```

**3. useCallback - 缓存函数**

```typescript
// ❌ 每次渲染都创建新函数
const handleClick = () => {
  console.log(count);
};

// ✅ 缓存函数，减少子组件重渲染
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
```

**4. useMemo - 缓存计算结果**

```typescript
const expensiveValue = useMemo(() => {
  return tasks.filter((t) => t.status === "DONE").length;
}, [tasks]); // tasks变化时才重新计算
```

**5. 自定义Hook - 项目实例**

```typescript
// hooks/useTasks.ts
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAllTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, fetchTasks };
}
```

---

### Q2: TypeScript类型系统

**答案**:

#### 类型定义

```typescript
// 1. 基础类型
interface Task {
  id: number;
  title: string;
  description?: string; // 可选属性
  status: "TODO" | "IN_PROGRESS" | "DONE"; // 联合类型
  tags: Tag[];
  createdAt: string;
}

// 2. 泛型
interface ApiResponse<T> {
  success: boolean;
  message: string;
  T;
}

// 使用
const response: ApiResponse<Task[]> = await api.get("/tasks");

// 3. 工具类型
type TaskRequest = Omit<Task, "id" | "createdAt">; // 排除字段
type PartialTask = Partial<Task>; // 所有字段可选
type RequiredTask = Required<Task>; // 所有字段必选
type ReadonlyTask = Readonly<Task>; // 所有字段只读

// 4. 类型守卫
function isTask(obj: any): obj is Task {
  return obj && typeof obj.id === "number" && typeof obj.title === "string";
}
```

---

### Q3: 状态管理 - Zustand

**答案**:

#### 项目实现

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => set({ user }),
}));

// 使用
function Profile() {
  const { user, logout } = useAuthStore();

  return <div>{user?.username}</div>;
}
```

#### Zustand vs Redux

| 特性               | Zustand    | Redux    |
| ------------------ | ---------- | -------- |
| **代码量**         | 少         | 多       |
| **学习曲线**       | 低         | 高       |
| **TypeScript支持** | 好         | 好       |
| **中间件**         | 简单       | 丰富     |
| **适用场景**       | 中小型项目 | 大型项目 |

---

### Q4: React性能优化

**答案**:

#### 优化技巧

**1. React.memo - 避免无用渲染**

```typescript
const TaskCard = React.memo(({ task }: { task: Task }) => {
  return <div>{task.title}</div>;
});
```

**2. 虚拟列表 - 大数据渲染**

```typescript
import { FixedSizeList } from 'react-window';

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <TaskCard task={tasks[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

**3. 懒加载 - 代码分割**

```typescript
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminPage />
    </Suspense>
  );
}
```

**4. 防抖和节流**

```typescript
import { debounce } from "lodash";

const handleSearch = debounce((query: string) => {
  // 搜索逻辑
}, 300);
```

---

### Q5: React Router实现

**答案**:

```typescript
// router/index.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/tasks/:id', element: <TaskDetailPage /> },
      {
        path: '/admin',
        element: (
          <PermissionGuard roles={['ADMIN']}>
            <AdminPage />
          </PermissionGuard>
        ),
      },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
]);

// 权限守卫
function PermissionGuard({ roles, children }: Props) {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/403" />;
  }

  return <>{children}</>;
}
```

---

## 🎯 高频面试题

### 1. React的diff算法原理？

**答**:

- 同层比较（不跨层）
- 通过key识别节点
- 类型不同直接替换
- 时间复杂度O(n)

### 2. useState和useReducer的区别？

**答**:

- useState: 简单状态
- useReducer: 复杂状态逻辑
- useReducer适合：多个子值、状态依赖前一个状态

### 3. 如何避免组件重复渲染？

**答**:

- React.memo包装组件
- useCallback缓存函数
- useMemo缓存计算结果
- 合理拆分组件

### 4. TypeScript的好处？

**答**:

- 类型安全，编译时发现错误
- 更好的IDE支持
- 代码可维护性高
- 重构更容易

### 5. 如何处理异步错误？

**答**:

```typescript
try {
  const data = await fetchData();
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(error.response?.data);
  }
}
```

---

**Good Luck! 🚀**
