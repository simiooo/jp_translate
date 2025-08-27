# 文件上传管理 Hook 和组件使用文档

## 概述

本项目提供了一个功能完整的文件上传管理解决方案，包含：

- `useFileUpload` - 文件上传管理 Hook
- `FileUploader` - 基于 Hook 的文件上传组件
- 完整的测试用例和使用示例

## useFileUpload Hook

### 基本用法

```tsx
import { useFileUpload } from '~/hooks/useFileUpload';

const MyComponent = () => {
  const {
    fileList,
    addFiles,
    removeFile,
    clearFiles,
    uploadFile,
    retryUpload,
    loading,
  } = useFileUpload({
    maxCount: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: ['image/*', '.pdf'],
  });

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          addFiles(files);
        }} 
      />
      
      {fileList.map(file => (
        <div key={file.uid}>
          <span>{file.FileName} - {file.status}</span>
          {file.status === '上传失败' && (
            <button onClick={() => retryUpload(file.uid)}>重试</button>
          )}
          <button onClick={() => removeFile(file.uid)}>删除</button>
        </div>
      ))}
    </div>
  );
};
```

### 配置选项

```tsx
interface UseFileUploadOptions {
  // 自定义上传函数
  customUploadFn?: (file: File) => Promise<FileRecord>;
  
  // 最大文件数量
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
  onUploadError?: (error: any, fileItem: UploadFileItem) => void;
  
  // 文件上传前验证
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
}
```

### 返回值

```tsx
interface UseFileUploadReturn {
  fileList: UploadFileItem[];           // 文件列表
  addFiles: (files: File[]) => Promise<void>;  // 批量添加文件
  removeFile: (uid: string) => void;    // 删除文件
  updateFile: (uid: string, updates: Partial<UploadFileItem>) => void;  // 更新文件
  clearFiles: () => void;               // 清空文件列表
  retryUpload: (uid: string) => Promise<void>;  // 重试上传
  uploadFile: (file: File) => Promise<void>;    // 上传单个文件
  loading: boolean;                     // 是否正在上传
}
```

### 文件状态

每个文件包含以下状态之一：
- `待上传` - 文件已添加但未开始上传
- `上传中` - 正在上传
- `上传失败` - 上传失败
- `上传成功` - 上传成功

### 高级用法

#### 1. 自定义上传函数

```tsx
const customUpload = async (file: File): Promise<FileRecord> => {
  // 自定义上传逻辑
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/custom-upload', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return result.file;
};

const { fileList, addFiles } = useFileUpload({
  customUploadFn: customUpload,
});
```

#### 2. 状态监听

```tsx
const handleStatusChange = (event: FileStatusChangeEvent) => {
  console.log(`文件 ${event.file.FileName} 状态变更为: ${event.file.status}`);
  console.log('当前文件列表:', event.fileList);
};

const { fileList } = useFileUpload({
  onStatusChange: handleStatusChange,
});
```

#### 3. 文件验证

```tsx
const { fileList } = useFileUpload({
  beforeUpload: async (file: File) => {
    // 检查文件名
    if (file.name.includes('temp')) {
      alert('不允许上传临时文件');
      return false;
    }
    
    // 异步验证
    const isValid = await validateFileOnServer(file);
    return isValid;
  },
});
```

## FileUploader 组件

### 基本用法

```tsx
import FileUploader from '~/components/FileUploader';

const MyPage = () => {
  return (
    <FileUploader
      maxCount={5}
      maxSize={5 * 1024 * 1024} // 5MB
      accept={['image/*', '.pdf', '.doc']}
      onUploadSuccess={(file) => {
        console.log('上传成功:', file);
      }}
    />
  );
};
```

### 组件属性

```tsx
interface FileUploaderProps extends UseFileUploadOptions {
  className?: string;          // 自定义样式
  disabled?: boolean;          // 是否禁用
  showFileList?: boolean;      // 是否显示文件列表
  dragUpload?: boolean;        // 是否支持拖拽上传
  pasteUpload?: boolean;       // 是否支持粘贴上传
  placeholder?: string;        // 占位符文本
  multiple?: boolean;          // 是否支持多选
}
```

### 使用 Ref

```tsx
import { useRef } from 'react';
import FileUploader, { FileUploaderRef } from '~/components/FileUploader';

const MyPage = () => {
  const uploaderRef = useRef<FileUploaderRef>(null);

  const handleClear = () => {
    uploaderRef.current?.clearFiles();
  };

  const handleGetFiles = () => {
    const files = uploaderRef.current?.getFiles();
    console.log('当前文件:', files);
  };

  return (
    <div>
      <FileUploader ref={uploaderRef} />
      <button onClick={handleClear}>清空文件</button>
      <button onClick={handleGetFiles}>获取文件</button>
    </div>
  );
};
```

### 高级配置示例

```tsx
<FileUploader
  // 基础配置
  maxCount={3}
  maxSize={2 * 1024 * 1024}
  accept={['image/jpeg', 'image/png', '.pdf']}
  
  // UI 配置
  showFileList={true}
  dragUpload={true}
  pasteUpload={true}
  placeholder="拖拽图片或PDF文件到这里"
  
  // 事件处理
  onUploadSuccess={(file) => {
    console.log('文件上传成功:', file.FileName);
  }}
  
  onUploadError={(error, fileItem) => {
    console.error('上传失败:', error, fileItem.FileName);
  }}
  
  onStatusChange={(event) => {
    console.log('状态变更:', event.file.status);
  }}
  
  // 自定义验证
  beforeUpload={async (file) => {
    if (file.size === 0) {
      alert('不能上传空文件');
      return false;
    }
    return true;
  }}
  
  // 自定义上传逻辑
  customUploadFn={async (file) => {
    // 你的上传逻辑
    return await uploadToCustomServer(file);
  }}
/>
```

## 测试

运行测试：

```bash
# 运行所有测试
pnpm test

# 运行文件上传相关测试
pnpm test useFileUpload

# 查看测试覆盖率
pnpm test --coverage
```

## 示例页面

项目中包含了完整的示例页面 `FileUploadExample.tsx`，展示了所有功能的使用方法。

## 注意事项

1. **文件大小限制**: 默认最大文件大小为 10MB，可通过 `maxSize` 配置
2. **文件类型验证**: 使用 `accept` 数组配置允许的文件类型
3. **内存管理**: 组件会自动清理创建的 blob URL，避免内存泄漏
4. **错误处理**: 提供了完善的错误处理和用户提示
5. **类型安全**: 使用 TypeScript 提供完整的类型定义

## 扩展和自定义

### 自定义状态显示

你可以通过监听 `onStatusChange` 事件来自定义状态显示：

```tsx
const MyUploader = () => {
  const [statusLog, setStatusLog] = useState<string[]>([]);

  return (
    <FileUploader
      onStatusChange={(event) => {
        const message = `${event.file.FileName}: ${event.file.status}`;
        setStatusLog(prev => [message, ...prev.slice(0, 9)]);
      }}
    />
  );
};
```

### 与表单集成

```tsx
import { useForm } from 'react-hook-form';

const FormWithUpload = () => {
  const form = useForm();
  const uploaderRef = useRef<FileUploaderRef>(null);

  const onSubmit = (data) => {
    const files = uploaderRef.current?.getFiles() || [];
    const successFiles = files.filter(f => f.status === '上传成功');
    
    console.log('表单数据:', data);
    console.log('上传的文件:', successFiles);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 其他表单字段 */}
      <FileUploader ref={uploaderRef} />
      <button type="submit">提交</button>
    </form>
  );
};
```

这个文件上传管理解决方案提供了完整的功能，包括状态管理、进度跟踪、错误处理和事件通知，可以满足大多数文件上传需求。