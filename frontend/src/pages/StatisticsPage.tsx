import { useState } from "react";
import { Card, Row, Col, Statistic, Select, Spin } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { statisticsService } from "../services/statisticsService";
import type { TaskStatistics } from "../types/statistics";

const COLORS = {
  TODO: "#1890ff",
  IN_PROGRESS: "#faad14",
  DONE: "#52c41a",
  LOW: "#13c2c2",
  MEDIUM: "#faad14",
  HIGH: "#ff4d4f",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "待办",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "低优先级",
  MEDIUM: "中优先级",
  HIGH: "高优先级",
};

export default function StatisticsPage() {
  const [days, setDays] = useState<number>(30);

  const { data: statistics, isLoading } = useQuery<TaskStatistics>({
    queryKey: ["statistics", days],
    queryFn: () => statisticsService.getTaskStatistics(days),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  // 准备图表数据
  const statusData = Object.entries(statistics.statusDistribution).map(
    ([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value: value,
      color: COLORS[key as keyof typeof COLORS],
    }),
  );

  const priorityData = Object.entries(statistics.priorityDistribution).map(
    ([key, value]) => ({
      name: PRIORITY_LABELS[key] || key,
      value: value,
      color: COLORS[key as keyof typeof COLORS],
    }),
  );

  // 趋势数据
  const trendData = Object.entries(statistics.creationTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, created]) => ({
      date: date.substring(5), // 只显示月-日
      创建: created,
      完成: statistics.completionTrend[date] || 0,
    }));

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和时间选择器 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">数据统计</h1>
        <Select
          value={days}
          onChange={setDays}
          style={{ width: 120 }}
          options={[
            { label: "最近7天", value: 7 },
            { label: "最近30天", value: 30 },
            { label: "最近90天", value: 90 },
          ]}
        />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={statistics.totalTasks}
              prefix={<FileTextOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics.completedTasks}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statistics.inProgressTasks}
              prefix={<SyncOutlined spin />}
              styles={{ content: { color: "#faad14" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待办"
              value={statistics.pendingTasks}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 完成率卡片 */}
      <Card>
        <Statistic
          title="完成率"
          value={statistics.completionRate}
          precision={2}
          suffix="%"
          styles={{
            content: {
              color:
                statistics.completionRate >= 70
                  ? "#52c41a"
                  : statistics.completionRate >= 40
                    ? "#faad14"
                    : "#ff4d4f",
            },
          }}
        />
      </Card>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 任务状态分布 - 饼图 */}
        <Col xs={24} lg={12}>
          <Card title="任务状态分布" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 优先级分布 - 柱状图 */}
        <Col xs={24} lg={12}>
          <Card title="优先级分布" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="任务数">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 任务趋势 - 折线图 */}
        <Col xs={24}>
          <Card title={`任务趋势（最近${days}天）`}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="创建"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="完成"
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
