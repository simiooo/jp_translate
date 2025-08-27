import React, { useState } from 'react';
import { useFileUpload, FileStatusChangeEvent, CustomUploadFunction } from '~/hooks/useFileUpload';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { Upload, X, RotateCcw, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '~/lib/utils';
import { FileRecord } from '~/types/file';

const FileUploadExample: React.FC = () => {
  const [useCustomUpload, setUseCustomUpload] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  // 自定义上传函数示例
  const customUploadFunction: CustomUploadFunction = async (file: File) => {
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟随机失败
    if (Math.random() < 0.3) {
      throw new Error('自定义上传失败 - 网络错误');
    }
    
    // 模拟返回上传结果
    return {
      ID: Math.floor(Math.random() * 1000),
      FileName: file.name,
      ObjectKey: `custom/${Date.now()}_${file.name}`,
      ContentType: file.type,
      FileSize: file.size,
      URL: `https://example.com/files/${Date.now()}_${file.name}`,
      UploadedAt: new Date().toISOString(),
    };
  };

  // 状态变更处理
  const handleStatusChange = (event: FileStatusChangeEvent) => {
    const { file } = event;
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] 文件 "${file.FileName}" 状态变更: ${file.status}`;
    setStatusLog(prev => [logMessage, ...prev.slice(0, 9)]); // 保留最新10条记录
  };

  const {
    fileList,
    addFiles,
    removeFile,
    updateFile,
    clearFiles,
    retryUpload,
    uploadFile,
    loading,
  } = useFileUpload({
    customUploadFn: useCustomUpload ? customUploadFunction : undefined,
    maxCount: 5,
    accept: ['image/*', '.pdf', '.doc', '.docx'],
    maxSize: 5 * 1024 * 1024, // 5MB
    onStatusChange: handleStatusChange,
    onUploadSuccess: (fileRecord: FileRecord) => {
      toast.success(`文件上传成功: ${fileRecord.FileName}`);
    },
    onUploadError: (error: any) => {
      toast.error(`上传失败: ${error.message || '未知错误'}`);
    },
    beforeUpload: async (file: File) => {
      // 示例：检查文件名不能包含特殊字符
      if (/[<>:"/\\|?*]/.test(file.name)) {
        toast.error('文件名不能包含特殊字符');
        return false;
      }
      return true;
    },
  });

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    // 清空input以允许重复选择同一文件
    e.target.value = '';
  };

  // 拖拽处理
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            文件上传管理 Hook 示例
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 配置选项 */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomUpload}
                onChange={(e) => setUseCustomUpload(e.target.checked)}
              />
              <span>使用自定义上传函数</span>
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearFiles}
              disabled={fileList.length === 0}
            >
              清空所有文件
            </Button>
          </div>

          <Separator />

          {/* 上传区域 */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
              "hover:border-gray-400"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragOver ? '松开鼠标上传文件' : '拖拽文件到此处或点击选择'}
              </p>
              <p className="text-sm text-gray-500">
                支持图片、PDF、Word文档，最大5MB，最多5个文件
              </p>
            </div>
            
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <Button
              className="mt-4"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              选择文件
            </Button>
          </div>

          {/* 文件列表 */}
          {fileList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">文件列表 ({fileList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fileList.map((file) => (
                    <div
                      key={file.uid}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getStatusIcon(file.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.FileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.FileSize / 1024).toFixed(1)} KB
                          </p>
                          {file.error && (
                            <p className="text-xs text-red-500 mt-1">
                              {file.error}
                            </p>
                          )}
                        </div>
                        
                        <Badge variant={getStatusVariant(file.status)}>
                          {file.status}
                        </Badge>
                      </div>

                      {/* 进度条 */}
                      {file.status === '上传中' && file.percent !== undefined && (
                        <div className="w-24 mx-3">
                          <Progress value={file.percent} className="h-2" />
                          <p className="text-xs text-center mt-1">{file.percent}%</p>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex space-x-2">
                        {file.status === '上传失败' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryUpload(file.uid)}
                            disabled={loading}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.uid)}
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

          {/* 状态日志 */}
          {statusLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">状态变更日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {statusLog.map((log, index) => (
                    <p key={index} className="text-sm text-gray-600 font-mono">
                      {log}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadExample;