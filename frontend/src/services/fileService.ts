import axios from "../lib/axios";
import SparkMD5 from "spark-md5";
import type { ApiResponse } from "../types";

export interface FileUploadInit {
  filename: string;
  fileSize: number;
  mimeType: string;
  fileIdentifier: string;
  totalChunks: number;
}

export interface FileUploadResponse {
  fileIdentifier: string;
  filename: string;
  fileSize?: number;
  totalChunks?: number;
  uploadedChunks?: number;
  missingChunks?: number[];
  status: string;
  message: string;
  fileUrl?: string;
}

// 计算文件MD5
export const calculateFileMD5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks for MD5 calculation
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    };

    loadNext();
  });
};

// 初始化上传
export const initFileUpload = async (
  data: FileUploadInit,
): Promise<FileUploadResponse> => {
  const response = await axios.post<ApiResponse<FileUploadResponse>>(
    "/files/init",
    data,
  );
  return response.data.data;
};

// 上传单个分片
export const uploadChunk = async (
  fileIdentifier: string,
  chunkNumber: number,
  totalChunks: number,
  chunk: Blob,
  onProgress?: (progress: number) => void,
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("fileIdentifier", fileIdentifier);
  formData.append("chunkNumber", chunkNumber.toString());
  formData.append("totalChunks", totalChunks.toString());
  formData.append("chunk", chunk);

  const response = await axios.post<ApiResponse<FileUploadResponse>>(
    "/files/chunk",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    },
  );

  return response.data.data;
};

// 文件元数据接口
export interface FileMetadata {
  id: number;
  filename: string;
  originalFilename: string;
  fileIdentifier: string;
  fileSize: number;
  mimeType: string;
  status: string;
  totalChunks: number;
  uploadedChunks: number;
  uploadTime: string;
  filePath: string;
}

// 分页响应接口
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 获取文件列表
export const getFileList = async (
  page: number = 0,
  size: number = 20,
): Promise<PageResponse<FileMetadata>> => {
  const response = await axios.get<ApiResponse<PageResponse<FileMetadata>>>(
    "/files",
    {
      params: { page, size },
    },
  );
  return response.data.data;
};

// 下载文件
export const downloadFile = async (fileId: number, filename: string) => {
  const response = await axios.get(`/files/${fileId}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 删除文件
export const deleteFile = async (fileId: number): Promise<void> => {
  await axios.delete(`/files/${fileId}`);
};
