import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useFileUpload, UseFileUploadOptions, UploadFileItem } from '~/hooks/useFileUpload';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import { Input } from '~/components/ui/input';
import { Upload, X, RotateCcw, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '~/lib/utils';

// 组件 props 接口
export interface FileUploaderProps extends UseFileUploadOptions {
  className?: string;
  disabled?: boolean;
  showFileList?: boolean;
  dragUpload?: boolean;
  pasteUpload?: boolean;
  placeholder?: string;
  multiple?: boolean;
}

// 组件 ref 接口
export interface FileUploaderRef {
  getFiles: () => UploadFileItem[];
  clearFiles: () => void;
  addFiles: (files: File[]) => Promise<void>;
  triggerFileInput: () => void;
}

export const FileUploader = forwardRef<FileUploaderRef, FileUploaderProps>(({
  className,
  disabled = false,
  showFileList = true,
  dragUpload = true,
  pasteUpload = true,
  placeholder = '拖拽文件到此处或点击选择',
  multiple = true,
  ...hookOptions
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    fileList,
    addFiles,
    removeFile,
    clearFiles,
    retryUpload,
    loading,
  } = useFileUpload(hookOptions);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getFiles: () => fileList,
    clearFiles,
    addFiles,
    triggerFileInput: () => fileInputRef.current?.click(),
  }));

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
    // 清空input以允许重复选择同一文件
    e.target.value = '';
  };

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragUpload || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragUpload || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragUpload || disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragUpload || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  // 粘贴事件处理
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!pasteUpload || disabled) return;
    
    const items = e.clipboardData.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    
    if (files.length > 0) {
      addFiles(files);
    }
  };

  // 状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case '上传成功':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case '上传失败':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case '上传中':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // 状态颜色
  const getStatusVariant = (status: string) => {
    switch (status) {
      case '上传成功':
        return 'default';
      case '上传失败':
        return 'destructive';
      case '上传中':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // 获取接受的文件类型字符串
  const getAcceptString = () => {
    if (!hookOptions.accept || hookOptions.accept.length === 0) {
      return undefined;
    }
    return hookOptions.accept.join(',');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 上传区域 */}
      <Card
        className={cn(
          "transition-all duration-300",
          isDragOver && dragUpload
            ? "border-primary ring-4 ring-primary/20" 
            : "border-input hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={pasteUpload ? 0 : undefined}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                {isDragOver && dragUpload ? '松开鼠标上传文件' : placeholder}
              </p>
              
              {(dragUpload || pasteUpload) && (
                <p className="text-sm text-muted-foreground">
                  {dragUpload && pasteUpload && '支持拖拽和粘贴上传'}
                  {dragUpload && !pasteUpload && '支持拖拽上传'}
                  {!dragUpload && pasteUpload && '支持粘贴上传'}
                </p>
              )}
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || loading}
              className="mt-4"
            >
              {loading ? '上传中...' : '选择文件'}
            </Button>

            {/* 显示限制信息 */}
            {(hookOptions.maxCount || hookOptions.maxSize || hookOptions.accept) && (
              <div className="text-xs text-muted-foreground text-center space-y-1">
                {hookOptions.maxCount && (
                  <p>最多上传 {hookOptions.maxCount} 个文件</p>
                )}
                {hookOptions.maxSize && (
                  <p>单个文件最大 {(hookOptions.maxSize / 1024 / 1024).toFixed(1)}MB</p>
                )}
                {hookOptions.accept && hookOptions.accept.length > 0 && (
                  <p>支持格式: {hookOptions.accept.join(', ')}</p>
                )}
              </div>
            )}
          </div>

          {/* 隐藏的文件输入 */}
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={multiple}
            accept={getAcceptString()}
            onChange={handleFileChange}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* 文件列表 */}
      {showFileList && fileList.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                文件列表 ({fileList.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFiles}
                disabled={disabled}
              >
                清空
              </Button>
            </div>

            <div className="space-y-3">
              {fileList.map((file) => (
                <div
                  key={file.uid}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.FileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.FileSize / 1024).toFixed(1)} KB
                      </p>
                      {file.error && (
                        <p className="text-xs text-red-500 mt-1">
                          错误: {file.error}
                        </p>
                      )}
                    </div>
                    
                    <Badge variant={getStatusVariant(file.status) as any}>
                      {file.status}
                    </Badge>
                  </div>

                  {/* 进度条 */}
                  {file.status === '上传中' && file.percent !== undefined && (
                    <div className="w-20 mx-3">
                      <Progress value={file.percent} className="h-2" />
                      <p className="text-xs text-center mt-1">{file.percent}%</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex space-x-2 ml-3">
                    {file.status === '上传失败' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryUpload(file.uid)}
                        disabled={disabled || loading}
                        title="重试上传"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.uid)}
                      disabled={disabled}
                      title="删除文件"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

FileUploader.displayName = 'FileUploader';

export default FileUploader;