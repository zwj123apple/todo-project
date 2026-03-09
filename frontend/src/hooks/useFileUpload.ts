import { useState, useCallback, useRef } from "react";
import {
  calculateFileMD5,
  initFileUpload,
  uploadChunk,
} from "../services/fileService";
import type { FileUploadResponse } from "../services/fileService";

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  chunkProgress: Record<number, number>;
}

export interface UseFileUploadOptions {
  onSuccess?: (response: FileUploadResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    chunkProgress: {},
  });
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadStateRef = useRef<{
    file: File | null;
    fileIdentifier: string | null;
    missingChunks: number[];
    totalChunks: number;
  }>({
    file: null,
    fileIdentifier: null,
    missingChunks: [],
    totalChunks: 0,
  });

  const updateProgress = useCallback(
    (chunkNumber: number, chunkProgress: number) => {
      setProgress((prev) => {
        const newChunkProgress = {
          ...prev.chunkProgress,
          [chunkNumber]: chunkProgress,
        };

        const totalProgress = Object.values(newChunkProgress).reduce(
          (sum, p) => sum + p,
          0,
        );
        const avgProgress = totalProgress / uploadStateRef.current.totalChunks;

        const newProgress = {
          ...prev,
          chunkProgress: newChunkProgress,
          percentage: Math.round(avgProgress),
        };

        options.onProgress?.(newProgress);
        return newProgress;
      });
    },
    [options],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        setError(null);
        setPaused(false);

        // 计算文件MD5作为唯一标识
        const fileIdentifier = await calculateFileMD5(file);
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        uploadStateRef.current = {
          file,
          fileIdentifier,
          missingChunks: [],
          totalChunks,
        };

        // 初始化上传
        const initResponse = await initFileUpload({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          fileIdentifier,
          totalChunks,
        });

        // 检查是否有未完成的分片（断点续传）
        const missingChunks = initResponse.missingChunks || [];
        uploadStateRef.current.missingChunks = missingChunks;

        if (missingChunks.length === 0 && initResponse.status === "COMPLETED") {
          // 文件已完全上传
          setUploading(false);
          options.onSuccess?.(initResponse);
          return;
        }

        // 上传缺失的分片
        for (const chunkNumber of missingChunks) {
          if (paused) {
            break;
          }

          const start = chunkNumber * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const response = await uploadChunk(
            fileIdentifier,
            chunkNumber,
            totalChunks,
            chunk,
            (chunkProgress) => {
              updateProgress(chunkNumber, chunkProgress);
            },
          );

          if (response.status === "COMPLETED") {
            setUploading(false);
            options.onSuccess?.(response);
            return;
          }
        }

        setUploading(false);
      } catch (err) {
        const error = err as Error;
        setError(error);
        setUploading(false);
        options.onError?.(error);
      }
    },
    [paused, updateProgress, options],
  );

  const pause = useCallback(() => {
    setPaused(true);
    abortControllerRef.current?.abort();
  }, []);

  const resume = useCallback(async () => {
    if (
      !uploadStateRef.current.file ||
      !uploadStateRef.current.fileIdentifier
    ) {
      return;
    }

    setPaused(false);
    await uploadFile(uploadStateRef.current.file);
  }, [uploadFile]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setUploading(false);
    setPaused(false);
    setProgress({
      loaded: 0,
      total: 0,
      percentage: 0,
      chunkProgress: {},
    });
    uploadStateRef.current = {
      file: null,
      fileIdentifier: null,
      missingChunks: [],
      totalChunks: 0,
    };
  }, []);

  return {
    uploadFile,
    uploading,
    progress,
    paused,
    error,
    pause,
    resume,
    cancel,
  };
}
