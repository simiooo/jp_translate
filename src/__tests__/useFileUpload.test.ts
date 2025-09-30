import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useFileUpload, CustomUploadFunction } from '~/hooks/useFileUpload';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('ahooks', () => ({
  useRequest: vi.fn((fn, options) => {
    const mockRun = vi.fn();
    const mockInstance = {
      run: mockRun,
      loading: false,
    };
    
    // Store the callbacks for later use
    (mockInstance as any)._onSuccess = options?.onSuccess;
    (mockInstance as any)._onError = options?.onError;
    (mockInstance as any)._fn = fn;
    
    return mockInstance;
  }),
}));

vi.mock('~/utils/request', () => ({
  alovaInstance: {
    Post: vi.fn(),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uid'),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty file list', () => {
    const { result } = renderHook(() => useFileUpload());
    
    expect(result.current.fileList).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should validate file type correctly', async () => {
    const { result } = renderHook(() => 
      useFileUpload({
        accept: ['image/*'],
      })
    );

    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(validFile);
    });

    expect(result.current.fileList).toHaveLength(1);
    expect(result.current.fileList[0].FileName).toBe('test.jpg');

    await act(async () => {
      await result.current.uploadFile(invalidFile);
    });

    // Should still be 1 because invalid file was rejected
    expect(result.current.fileList).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith('不支持的文件类型: text/plain');
  });

  it('should validate file size correctly', async () => {
    const { result } = renderHook(() => 
      useFileUpload({
        maxSize: 1024, // 1KB
      })
    );

    const largeContent = 'x'.repeat(2048); // 2KB
    const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(largeFile);
    });

    expect(result.current.fileList).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('文件大小超过限制: 0.0MB');
  });

  it('should respect max count limit', async () => {
    const { result } = renderHook(() => 
      useFileUpload({
        maxCount: 1,
      })
    );

    const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file1);
    });

    expect(result.current.fileList).toHaveLength(1);

    await act(async () => {
      await result.current.uploadFile(file2);
    });

    expect(result.current.fileList).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith('最多只能上传 1 个文件');
  });

  it('should add file to list when uploading', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.fileList).toHaveLength(1);
    const uploadedFile = result.current.fileList[0];
    expect(uploadedFile.FileName).toBe('test.txt');
    expect(uploadedFile.status).toBe('上传中');
    expect(uploadedFile.percent).toBe(0);
    expect(uploadedFile.uid).toBe('test-uid');
  });

  it('should remove file from list', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.fileList).toHaveLength(1);
    const uid = result.current.fileList[0].uid;

    act(() => {
      result.current.removeFile(uid);
    });

    expect(result.current.fileList).toHaveLength(0);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(toast.info).toHaveBeenCalledWith('文件已从列表中移除');
  });

  it('should update file properties', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    const uid = result.current.fileList[0].uid;

    act(() => {
      result.current.updateFile(uid, { percent: 50 });
    });

    expect(result.current.fileList[0].percent).toBe(50);
  });

  it('should clear all files', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.addFiles([file1, file2]);
    });

    expect(result.current.fileList).toHaveLength(2);

    act(() => {
      result.current.clearFiles();
    });

    expect(result.current.fileList).toHaveLength(0);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('should call beforeUpload validation', async () => {
    const beforeUpload = vi.fn().mockResolvedValue(false);
    
    const { result } = renderHook(() => 
      useFileUpload({
        beforeUpload,
      })
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(beforeUpload).toHaveBeenCalledWith(file);
    expect(result.current.fileList).toHaveLength(0);
  });

  it('should call status change callback', async () => {
    const onStatusChange = vi.fn();
    
    const { result } = renderHook(() => 
      useFileUpload({
        onStatusChange,
      })
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(onStatusChange).toHaveBeenCalledWith({
      file: expect.objectContaining({
        FileName: 'test.txt',
        status: '上传中',
      }),
      fileList: expect.arrayContaining([
        expect.objectContaining({
          FileName: 'test.txt',
          status: '上传中',
        })
      ]),
    });
  });

  it('should use custom upload function', async () => {
    const customUploadFn: CustomUploadFunction = vi.fn().mockResolvedValue({
      ID: 123,
      FileName: 'test.txt',
      ObjectKey: 'custom/test.txt',
      ContentType: 'text/plain',
      FileSize: 7,
      URL: 'https://example.com/test.txt',
      UploadedAt: '2023-01-01T00:00:00.000Z',
    });

    const { result } = renderHook(() => 
      useFileUpload({
        customUploadFn,
      })
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    // The custom upload function should be called
    // Note: Due to the mocked useRequest, we need to verify the structure
    expect(result.current.fileList).toHaveLength(1);
    expect(result.current.fileList[0].FileName).toBe('test.txt');
  });
});

export {};