import { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Progress,
  Space,
  Typography,
  message,
  Alert,
  Flex,
  Divider,
} from "antd";
import type { UploadProps, UploadFile as AntdUploadFile } from "antd";
import {
  UploadOutlined,
  FileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  calculateFileMD5,
  initFileUpload,
  uploadChunk,
} from "../services/fileService";

const { Title, Text } = Typography;

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export default function FileUploadPage() {
  const [fileList, setFileList] = useState<AntdUploadFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<
    Map<string, UploadingFile>
  >(new Map());

  const handleUpload = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;

    // 添加到上传列表
    setUploadingFiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(fileId, {
        file,
        progress: 0,
        status: "uploading",
      });
      return newMap;
    });

    try {
      // 计算文件MD5
      const fileIdentifier = await calculateFileMD5(file);
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 初始化上传
      const initResponse = await initFileUpload({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        fileIdentifier,
        totalChunks,
      });

      // 检查是否已经上传完成
      if (initResponse.status === "COMPLETED") {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.set(fileId, {
            file,
            progress: 100,
            status: "success",
          });
          return newMap;
        });
        message.success(`${file.name} 上传成功！`);
        return;
      }

      // 上传分片
      const missingChunks = initResponse.missingChunks || [];
      for (let i = 0; i < missingChunks.length; i++) {
        const chunkNumber = missingChunks[i];
        const start = chunkNumber * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(
          fileIdentifier,
          chunkNumber,
          totalChunks,
          chunk,
          (chunkProgress) => {
            // 更新进度
            const overallProgress = Math.round(
              ((i + chunkProgress / 100) / missingChunks.length) * 100,
            );
            setUploadingFiles((prev) => {
              const newMap = new Map(prev);
              const fileInfo = newMap.get(fileId);
              if (fileInfo) {
                newMap.set(fileId, {
                  ...fileInfo,
                  progress: overallProgress,
                });
              }
              return newMap;
            });
          },
        );
      }

      // 上传成功
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileId, {
          file,
          progress: 100,
          status: "success",
        });
        return newMap;
      });

      message.success(`${file.name} 上传成功！`);
    } catch (error) {
      // 上传失败
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        const fileInfo = newMap.get(fileId);
        if (fileInfo) {
          newMap.set(fileId, {
            ...fileInfo,
            status: "error",
            error: error instanceof Error ? error.message : "上传失败",
          });
        }
        return newMap;
      });

      message.error(`${file.name} 上传失败`);
    }
  };

  const customRequest: UploadProps["customRequest"] = ({ file, onSuccess }) => {
    handleUpload(file as File);
    setTimeout(() => {
      onSuccess?.("ok");
    }, 0);
  };

  const handleRemove = (fileId: string) => {
    setUploadingFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  const uploadProps: UploadProps = {
    customRequest,
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    multiple: true,
    showUploadList: false,
  };

  return (
    <div className="p-6 space-y-6">
      <Title level={2}>文件上传</Title>

      <Card>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            title="支持大文件分片上传"
            description="文件会被自动分片上传，支持断点续传，实时显示上传进度。"
            type="info"
            showIcon
          />

          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} size="large" type="primary">
              选择文件上传
            </Button>
          </Upload>

          {uploadingFiles.size > 0 && (
            <Card title="上传列表" type="inner">
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                {Array.from(uploadingFiles.entries()).map(
                  ([fileId, fileInfo], index) => (
                    <div key={fileId}>
                      {index > 0 && <Divider style={{ margin: "12px 0" }} />}
                      <Flex gap="middle" align="start">
                        <FileOutlined style={{ fontSize: 24, marginTop: 4 }} />
                        <Flex
                          vertical
                          gap="small"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <Text strong style={{ fontSize: 16 }}>
                            {fileInfo.file.name}
                          </Text>
                          <Text type="secondary">
                            大小:{" "}
                            {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                          {fileInfo.status === "uploading" && (
                            <>
                              <Progress
                                percent={fileInfo.progress}
                                status="active"
                                strokeColor={{
                                  "0%": "#108ee9",
                                  "100%": "#87d068",
                                }}
                              />
                              <Text type="secondary">
                                正在上传... {fileInfo.progress}%
                              </Text>
                            </>
                          )}
                          {fileInfo.status === "success" && (
                            <>
                              <Progress
                                percent={100}
                                status="success"
                                strokeColor="#52c41a"
                              />
                              <Text type="success">上传成功</Text>
                            </>
                          )}
                          {fileInfo.status === "error" && (
                            <>
                              <Progress
                                percent={fileInfo.progress}
                                status="exception"
                              />
                              <Text type="danger">{fileInfo.error}</Text>
                            </>
                          )}
                        </Flex>
                        <Flex gap="small" align="center">
                          {fileInfo.status === "success" && (
                            <CheckCircleOutlined
                              style={{ color: "#52c41a", fontSize: 20 }}
                            />
                          )}
                          {fileInfo.status === "error" && (
                            <CloseCircleOutlined
                              style={{ color: "#ff4d4f", fontSize: 20 }}
                            />
                          )}
                          <Button
                            size="small"
                            danger={fileInfo.status === "uploading"}
                            onClick={() => handleRemove(fileId)}
                          >
                            {fileInfo.status === "uploading" ? "取消" : "移除"}
                          </Button>
                        </Flex>
                      </Flex>
                    </div>
                  ),
                )}
              </Space>
            </Card>
          )}
        </Space>
      </Card>

      <Card title="使用说明">
        <Space orientation="vertical" size="small">
          <Text>• 支持多文件同时上传</Text>
          <Text>• 大文件自动分片上传（默认分片大小 2MB）</Text>
          <Text>• 实时显示上传进度</Text>
          <Text>• 支持断点续传（刷新页面后可继续上传）</Text>
          <Text>• 上传成功后文件信息会保存到数据库</Text>
        </Space>
      </Card>
    </div>
  );
}
