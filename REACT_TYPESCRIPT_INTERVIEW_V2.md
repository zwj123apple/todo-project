# React & TypeScript 面试指南（精简版）

## 一、React 核心概念

### 1. 组件与生命周期

**类组件生命周期**

```typescript
class MyComponent extends React.Component {
  // 挂载阶段
  constructor() → componentDidMount()

  // 更新阶段
  shouldComponentUpdate() → componentDidUpdate()

  // 卸载阶段
  componentWillUnmount()
}
```

**函数组件与 Hooks**

```typescript
function MyComponent() {
  // useState - 状态管理
  const [count, setCount] = useState(0);

  // useEffect - 副作用处理
  useEffect(() => {
    // 挂载和更新时执行
    return () => {
      // 卸载时清理
    };
  }, [依赖项]);

  // useCallback - 缓存函数
  const memoizedCallback = useCallback(() => {
    doSomething(a, b);
  }, [a, b]);

  // useMemo - 缓存计算结果
  const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
}
```

### 2. 状态管理

**本地状态管理**

```typescript
// Zustand Store 示例
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

**全局状态管理模式**

- Context API: 适合中小型应用
- Redux/Zustand: 适合大型应用
- React Query: 适合服务器状态管理

### 3. 性能优化

**React.memo**

```typescript
const MyComponent = React.memo(({ data }: Props) => {
  return <div>{data}</div>;
}, (prevProps, nextProps) => {
  // 返回 true 则不重新渲染
  return prevProps.data === nextProps.data;
});
```

**代码分割**

```typescript
// 懒加载
const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 4. 自定义 Hooks

```typescript
// 自定义 Hook 示例
function useTasks() {
  const queryClient = useQueryClient();

  const { tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: taskService.getTasks,
  });

  const createMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createMutation.mutate,
  };
}
```

## 二、TypeScript 核心

### 1. 类型系统

**基础类型**

```typescript
// 基本类型
let name: string = "John";
let age: number = 25;
let isActive: boolean = true;
let items: number[] = [1, 2, 3];
let tuple: [string, number] = ["hello", 10];

// 联合类型
type Status = "pending" | "success" | "error";

// 泛型
function identity<T>(arg: T): T {
  return arg;
}

// 接口
interface User {
  id: number;
  name: string;
  email?: string; // 可选属性
  readonly createdAt: Date; // 只读属性
}
```

**高级类型**

```typescript
// 工具类型
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 使用示例
interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
}

type TaskUpdate = Partial<Task>; // 所有属性可选
type TaskCreate = Omit<Task, "id">; // 排除 id
```

### 2. React TypeScript 模式

**组件类型定义**

```typescript
// 函数组件
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary' }) => {
  return <button onClick={onClick}>{children}</button>;
};

// 带泛型的组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <>{items.map(renderItem)}</>;
}
```

**事件处理类型**

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget);
};
```

## 三、React Query

### 核心概念

```typescript
// 查询数据
const { data, isLoading, error } = useQuery({
  queryKey: ["tasks", userId],
  queryFn: () => fetchTasks(userId),
  staleTime: 5000, // 数据新鲜度
  cacheTime: 10000, // 缓存时间
});

// 修改数据
const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
  onError: (error) => {
    console.error(error);
  },
});

// 乐观更新
const updateMutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    await queryClient.cancelQueries({ queryKey: ["tasks"] });
    const previous = queryClient.getQueryData(["tasks"]);
    queryClient.setQueryData(["tasks"], (old: Task[]) =>
      old.map((task) => (task.id === newTask.id ? newTask : task)),
    );
    return { previous };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(["tasks"], context.previous);
  },
});
```

## 四、常见面试题

### 1. React 渲染优化

**问题：如何避免不必要的重新渲染？**

答案：

1. 使用 React.memo 包装组件
2. 使用 useCallback 缓存函数
3. 使用 useMemo 缓存计算结果
4. 合理使用 key 属性
5. 避免在渲染中创建新对象/数组

### 2. useEffect vs useLayoutEffect

**useEffect**：异步执行，在浏览器绘制后执行
**useLayoutEffect**：同步执行，在浏览器绘制前执行

使用场景：

- useEffect: 大多数副作用（数据获取、订阅）
- useLayoutEffect: DOM 测量、同步 DOM 更新

### 3. React 18 新特性

- **Automatic Batching**：自动批处理更新
- **Transitions**：区分紧急和非紧急更新
- **Suspense SSR**：服务端渲染改进
- **Concurrent Rendering**：并发渲染

```typescript
// Transitions 示例
import { useTransition } from "react";

function App() {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);

  const handleClick = () => {
    startTransition(() => {
      setCount((c) => c + 1); // 非紧急更新
    });
  };
}
```

### 4. TypeScript 泛型约束

```typescript
// 约束泛型必须包含某些属性
interface HasId {
  id: number;
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}

// 约束键名
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## 五、项目实战模式

### 1. 错误边界

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 2. 权限控制

```typescript
// 权限 Hook
function usePermission(permission: string) {
  const { user } = useAuthStore();
  return user?.permissions?.includes(permission) ?? false;
}

// 权限守卫组件
function PermissionGuard({ permission, children }: Props) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <Navigate to="/forbidden" />;
  }

  return <>{children}</>;
}
```

### 3. 路由配置

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'tasks',
        element: (
          <PermissionGuard permission="task:read">
            <TasksPage />
          </PermissionGuard>
        ),
      },
    ],
  },
]);
```

## 六、面试准备建议

### 技术深度

1. 理解 React 虚拟 DOM 和 Diff 算法
2. 掌握 Hooks 实现原理（闭包、链表）
3. 熟悉 TypeScript 类型系统
4. 了解前端性能优化策略

### 项目经验

1. 准备 2-3 个完整项目案例
2. 能够说明技术选型理由
3. 描述遇到的问题和解决方案
4. 量化项目成果（性能提升、用户增长等）

### 代码能力

1. 手写常见 Hooks（useDebounce、useThrottle）
2. 实现常见组件（Modal、InfiniteScroll）
3. 算法基础（数组、字符串、树）

---

**重点记忆**：

- React 性能优化三剑客：React.memo、useCallback、useMemo
- TypeScript 四大工具类型：Partial、Required、Pick、Omit
- React Query 核心：useQuery、useMutation、queryClient
- 自定义 Hooks 设计原则：单一职责、可复用、可测试
