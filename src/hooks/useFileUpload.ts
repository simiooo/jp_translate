import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRequest } from 'ahooks';
import { toast } from 'sonner';
import { alovaInstance, getErrorMessage, isStandardizedError } from '~/utils/request';
import { FileRecord } from '~/types/file';
import humps from 'humps'
import { useTranslation } from 'react-i18next';
// 文件状态类型
export type FileStatus = '待上传' | '上传中' | '上传失败' | '上传成功';

// 扩展的文件接口，包含上传状态和进度
export interface UploadFileItem extends FileRecord {
  uid: string;
  status: FileStatus;
  percent?: number;
  originFileObj?: File;
  error?: string;
}

// 文件状态变更事件类型
export interface FileStatusChangeEvent {
  file: UploadFileItem;
  fileList: UploadFileItem[];
}

// 自定义上传函数类型
export interface CustomUploadFunction {
  (file: File): Promise<FileRecord>;
}

// Hook 配置选项
export interface UseFileUploadOptions {
  // 自定义上传函数
  customUploadFn?: CustomUploadFunction;
  // 最大文件数量限制
  maxCount?: number;
  // 允许的文件类型
  accept?: string[];
  // 最大文件大小（字节）
  maxSize?: number;
  // 状态变更回调
  onStatusChange?: (event: FileStatusChangeEvent) => void;
  // 上传成功回调
  onUploadSuccess?: (file: FileRecord, fileItem: UploadFileItem) => void;
  // 上传失败回调
  onUploadError?: (error: unknown, fileItem: UploadFileItem) => void;
  // 文件添加前的验证函数
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
}

// Hook 返回值类型
export interface UseFileUploadReturn {
  fileList: UploadFileItem[];
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (uid: string) => void;
  updateFile: (uid: string, updates: Partial<UploadFileItem>) => void;
  clearFiles: () => void;
  retryUpload: (uid: string) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  loading: boolean;
}

// 默认上传函数
const defaultUploadFunction: CustomUploadFunction = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await alovaInstance.Post<{file: FileRecord}>('/api/files/upload', formData);
    return response.file;
  } catch (error) {
    console.error('File upload error:', error);
    
    // Handle standardized error format
    if (isStandardizedError(error)) {
      switch (error.code) {
        case 1502: // ErrCodeFileTooLarge
        case 1510: // ErrCodeFileSizeExceeded
          throw new Error('File size exceeds the maximum allowed limit');
        case 1503: // ErrCodeUnsupportedFileType
        case 1511: // ErrCodeInvalidFileType
          throw new Error('Unsupported file type');
        case 1504: // ErrCodeFileUploadFailed
          throw new Error('File upload failed');
        case 1512: // ErrCodeFileProcessingError
          throw new Error('Failed to process file');
        default:
          throw new Error(getErrorMessage(error) || 'File upload failed');
      }
    }
    throw error;
  }
};

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const { t } = useTranslation();
  const {
    customUploadFn = defaultUploadFunction,
    maxCount = 10,
    accept = [],
    maxSize = 10 * 1024 * 1024, // 10MB
    onStatusChange,
    onUploadSuccess,
    onUploadError,
    beforeUpload,
  } = options;

  const [fileList, setFileList] = useState<UploadFileItem[]>([]);
  const fileListRef = useRef<UploadFileItem[]>([]);

  // 更新文件列表的辅助函数
  const updateFileList = useCallback((updater: (list: UploadFileItem[]) => UploadFileItem[]) => {
    setFileList(prevList => {
      const newList = updater(prevList);
      fileListRef.current = newList;
      return newList;
    });
  }, []);

  // 触发状态变更事件
  const triggerStatusChange = useCallback((file: UploadFileItem) => {
    if (onStatusChange) {
      onStatusChange({
        file,
        fileList: fileListRef.current,
      });
    }
  }, [onStatusChange]);

  // 使用 ahooks 的 useRequest 管理上传请求
  const { run: executeUpload, loading } = useRequest(
    async ({ file, uid }: { file: File; uid: string }) => {
      const result = await customUploadFn(file);
      return { result, uid };
    },
    {
      manual: true,
      onSuccess: ({ result, uid }) => {
        updateFileList(prevList => {
          return prevList.map(item => {
            if (item.uid === uid) {
              const updatedItem = {
                ...item,
                ...humps.pascalizeKeys(result ?? {}) ,
                status: '上传成功' as FileStatus,
                percent: 100,
                error: undefined,
              };
              triggerStatusChange(updatedItem);
              onUploadSuccess?.(result, updatedItem);
              return updatedItem;
            }
            return item;
          });
        });
        toast.success(t("File {{name}} uploaded successfully!", { name: fileListRef.current.find(f => f.uid === uid)?.FileName }));
      },
      onError: (error, [{ uid, file }]) => {
        updateFileList(prevList => {
          return prevList.map(item => {
            if (item.uid === uid) {
              const errorMessage = getErrorMessage(error);
              const updatedItem = {
                ...item,
                status: '上传失败' as FileStatus,
                percent: 0,
                error: errorMessage,
              };
              triggerStatusChange(updatedItem);
              onUploadError?.(error, updatedItem);
              return updatedItem;
            }
            return item;
          });
        });
        const fileName = fileListRef.current.find(f => f.uid === uid)?.FileName || file.name;
        toast.error(t("File {{name}} upload failed: {{error}}", { name: fileName, error: getErrorMessage(error) }));
      },
    }
  );

  // 错误信息提取函数
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'object' && error !== null) {
      const customError = error as { message?: string; data?: { message?: string } };
      if (typeof customError.data?.message === 'string') {
        return customError.data.message;
      } else if (typeof customError.message === 'string') {
        return customError.message;
      }
    }
    return '未知错误';
  };

  // 文件验证函数
  const validateFile = async (file: File): Promise<boolean> => {
    // 检查文件类型
    if (accept.length > 0) {
      const isAcceptable = accept.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });
      if (!isAcceptable) {
        toast.error(t("Error: {{error}}", { error: `不支持的文件类型: ${file.type}` }));
        return false;
      }
    }

    // 检查文件大小
    if (file.size > maxSize) {
      toast.error(t("Error: {{error}}", { error: `文件大小超过限制: ${(maxSize / 1024 / 1024).toFixed(1)}MB` }));
      return false;
    }

    // 自定义验证
    if (beforeUpload) {
      try {
        const isValid = await beforeUpload(file);
        if (!isValid) {
          return false;
        }
      } catch (error) {
        toast.error(t("Error: {{error}}", { error: `文件验证失败: ${getErrorMessage(error)}` }));
        return false;
      }
    }

    return true;
  };

  // 上传单个文件
  const uploadFile = useCallback(async (file: File) => {
    const isValid = await validateFile(file);
    if (!isValid) {
      return;
    }

    // 检查数量限制
    if (fileListRef.current.length >= maxCount) {
      toast.error(t("Maximum {{count}} files", { count: maxCount }));
      return;
    }

    const uid = uuidv4();
    const fileItem: UploadFileItem = {
      ID: 0,
      FileName: file.name,
      ObjectKey: '',
      ContentType: file.type,
      FileSize: file.size,
      URL: URL.createObjectURL(file),
      UploadedAt: new Date().toISOString(),
      uid,
      status: '上传中',
      percent: 0,
      originFileObj: file,
    };

    // 添加到文件列表
    updateFileList(prevList => {
      const newList = [...prevList, fileItem];
      triggerStatusChange(fileItem);
      return newList;
    });

    // 执行上传
    executeUpload({ file, uid });
  }, [validateFile, maxCount, executeUpload, updateFileList, triggerStatusChange]);

  // 批量添加文件
  const addFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  // 删除文件
  const removeFile = useCallback((uid: string) => {
    updateFileList(prevList => {
      const fileToRemove = prevList.find(f => f.uid === uid);
      const newList = prevList.filter(f => f.uid !== uid);
      
      if (fileToRemove) {
        // 清理 blob URL
        if (fileToRemove.URL && fileToRemove.URL.startsWith('blob:')) {
          URL.revokeObjectURL(fileToRemove.URL);
        }
        
        const removedItem = { ...fileToRemove, status: '待上传' as FileStatus };
        triggerStatusChange(removedItem);
      }
      
      return newList;
    });
    toast.info(t("File removed from list"));
  }, [updateFileList, triggerStatusChange]);

  // 更新文件信息
  const updateFile = useCallback((uid: string, updates: Partial<UploadFileItem>) => {
    updateFileList(prevList => {
      return prevList.map(item => {
        if (item.uid === uid) {
          const updatedItem = { ...item, ...updates };
          triggerStatusChange(updatedItem);
          return updatedItem;
        }
        return item;
      });
    });
  }, [updateFileList, triggerStatusChange]);

  // 清空文件列表
  const clearFiles = useCallback(() => {
    // 清理所有 blob URLs
    fileListRef.current.forEach(file => {
      if (file.URL && file.URL.startsWith('blob:')) {
        URL.revokeObjectURL(file.URL);
      }
    });
    
    setFileList([]);
    fileListRef.current = [];
  }, []);

  // 重试上传
  const retryUpload = useCallback(async (uid: string) => {
    const fileItem = fileListRef.current.find(f => f.uid === uid);
    if (!fileItem || !fileItem.originFileObj) {
      toast.error(t("File not found for retry"));
      return;
    }

    // 更新状态为上传中
    updateFile(uid, { status: '上传中', percent: 0, error: undefined });

    // 重新执行上传
    executeUpload({ file: fileItem.originFileObj, uid });
  }, [updateFile, executeUpload]);

  return {
    fileList,
    addFiles,
    removeFile,
    updateFile,
    clearFiles,
    retryUpload,
    uploadFile,
    loading,
  };
};