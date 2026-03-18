import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  message,
  Popconfirm,
  Tag,
  Pagination,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFileList,
  downloadFile,
  deleteFile,
  type FileMetadata,
} from "../services/fileService";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

export default function FileListPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const queryClient = useQueryClient();

  // 获取文件列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["files", page, pageSize],
    queryFn: () => getFileList(page, pageSize),
  });

  // 组件挂载时自动刷新数据
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 删除文件
  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      message.success("文件删除成功");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => {
      message.error("文件删除失败");
    },
  });

  // 下载文件
  const handleDownload = async (file: FileMetadata) => {
    try {
      await downloadFile(file.id, file.originalFilename);
      message.success("下载成功");
    } catch (error: any) {
      console.log(error);
      message.error("下载失败");
    }
  };

  // 删除文件
  const handleDelete = (fileId: number) => {
    deleteMutation.mutate(fileId);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN");
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Tag color="success">已完成</Tag>;
      case "UPLOADING":
        return <Tag color="processing">上传中</Tag>;
      case "FAILED":
        return <Tag color="error">失败</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // 表格列定义
  const columns: ColumnsType<FileMetadata> = [
    {
      title: "文件名",
      dataIndex: "originalFilename",
      key: "originalFilename",
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <FileOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "文件大小",
      dataIndex: "fileSize",
      key: "fileSize",
      width: 120,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string, record: FileMetadata) => (
        <Space direction="vertical" size="small">
          {getStatusTag(status)}
          {status === "UPLOADING" && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.uploadedChunks}/{record.totalChunks} 分片
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "上传时间",
      dataIndex: "uploadTime",
      key: "uploadTime",
      width: 180,
      render: (date: string) => formatDate(date),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_: unknown, record: FileMetadata) => (
        <Space>
          {record.status === "COMPLETED" && (
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            >
              下载
            </Button>
          )}
          <Popconfirm
            title="确认删除"
            description="确定要删除这个文件吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>文件管理</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.content || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />

        {data && (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={page + 1}
              pageSize={pageSize}
              total={data.totalElements}
              onChange={(newPage, newPageSize) => {
                setPage(newPage - 1);
                setPageSize(newPageSize);
              }}
              showSizeChanger
              showTotal={(total) => `共 ${total} 个文件`}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
