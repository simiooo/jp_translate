import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Spinner from './Spinner';
import { Toast } from './Toast';
import { showImagePreview } from './ImgPreview';
import { alovaInstance } from '../utils/request';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useRequest } from 'ahooks';
import { FileRecord } from '../types/file'; // Import FileRecord

export interface UploadFile extends FileRecord {
  uid: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  percent?: number;
  originFileObj?: File;
}

export interface ImageUploaderRef {
  getUploadedFiles: () => UploadFile[];
  clearFiles: () => void;
  triggerFileInput: () => void;
}

interface ImageUploaderProps {
  onUploadSuccess?: (file: FileRecord) => void;
  initialImageUrls?: string[];
  value?: FileRecord[]; // New prop for controlled component
  onChange?: (files: FileRecord[]) => void; // New prop for controlled component
}

export const ImageUploader = forwardRef<ImageUploaderRef, ImageUploaderProps>(({
  onUploadSuccess,
  initialImageUrls = [],
  value, // Destructure new prop
  onChange, // Destructure new prop
}, ref) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useImperativeHandle(ref, () => ({
    getUploadedFiles: () => uploadedFiles.filter(f => f.status === 'done'),
    clearFiles: () => setUploadedFiles([]),
    triggerFileInput: () => fileInputRef.current?.click(),
  }));

  React.useEffect(() => {
    if (value) {
      setUploadedFiles(value.map(file => ({
        ...file,
        uid: uuidv4(),
        status: 'done',
      })));
    } else if (initialImageUrls.length > 0) {
      setUploadedFiles(initialImageUrls.map((url, index) => ({
        ID: index,
        FileName: url.substring(url.lastIndexOf('/') + 1),
        ObjectKey: url,
        ContentType: 'image/*',
        FileSize: 0,
        URL: url,
        UploadedAt: new Date().toISOString(),
        uid: uuidv4(),
        status: 'done',
      })));
    }
  }, [initialImageUrls, value]);

  const { run: uploadImageRequest } = useRequest(
    async ({fileToUpload, params}: {fileToUpload:File, params: {uid: string; name: string} }) => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const response = await alovaInstance.Post<{file: FileRecord}>('/api/files/upload', formData);
      return {file: response.file, params} // Assuming response.file contains the FileRecord
    },
    {
      manual: true, // We will trigger it manually
      onSuccess: ({file: result, params}) => {
        const fileRecord = result;
        const { uid }  = params;

        setUploadedFiles(prev => {
          const updatedFiles = prev.map(f => {
            if (f.uid === uid) {
              return {
                ...f,
                ...fileRecord,
                status: 'done',
                percent: 100,
              } as UploadFile;
            }
            return f;
          });
          onChange?.(updatedFiles.filter(f => f.status === 'done'));
          return updatedFiles;
        });
        onUploadSuccess?.(fileRecord);
        Toast.success(`文件 ${params.name} 上传成功！`);
      },
      onError: (error, params) => {
        
        const { uid } = params[0].params;
        setUploadedFiles(prev => {
          const updatedFiles = prev.map(f => {
            if (f.uid === uid) {
              return { ...f, status: 'error', percent: 0 } as UploadFile;
            }
            return f;
          });
          onChange?.(updatedFiles.filter(f => f.status === 'done'));
          return updatedFiles;
        });
        let errorMessage = '未知错误';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const customError = error as { message?: string; data?: { message?: string } };
          if (typeof customError.data?.message === 'string') {
            errorMessage = customError.data.message;
          } else if (typeof customError.message === 'string') {
            errorMessage = customError.message;
          }
        }
        Toast.error(`文件 ${params[0].params.name} 上传失败: ${errorMessage}`);
        console.error('Upload error:', error);
      },
    }
  );

  const handleUploadFile = async (file: File) => {
    const uid = uuidv4();
    const newUploadFile: UploadFile = {
      ID: 0,
      FileName: file.name,
      ObjectKey: '',
      ContentType: file.type,
      FileSize: file.size,
      URL: URL.createObjectURL(file),
      UploadedAt: new Date().toISOString(),
      uid: uid,
      status: 'uploading',
      percent: 0,
      originFileObj: file,
    };

    setUploadedFiles(prev => [...prev, newUploadFile]);

    // Trigger the upload using ahooks' useRequest run function
    uploadImageRequest({fileToUpload: file, params: { uid, name: file.name }}, ); // Pass file and uid/name for callbacks
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => handleUploadFile(file));
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleUploadFile(file);
        }
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleUploadFile(file);
        }
      }
    }
  };

  const handleRemove = (uid: string) => {
    setUploadedFiles(prev => prev.filter(file => file.uid !== uid));
    Toast.info('文件已从列表中移除');
  };

  const handlePreviewClick = (file: UploadFile) => {
    if (file.status === 'done' && file.URL) {
      showImagePreview({ src: file.URL, alt: file.FileName || '预览图片' });
    } else if (file.originFileObj) {
      showImagePreview({ src: URL.createObjectURL(file.originFileObj), alt: file.FileName || '预览图片' });
    }
  };

  const hasImages = uploadedFiles.length > 0;

  return (
    <div
      className={`flex flex-col items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 ${isDragOver ? 'border-blue-500 ring-4 ring-blue-200 dark:ring-blue-800' : 'border-gray-300 dark:border-gray-700'} focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload-input"
        multiple
      />

      {!hasImages && (
        <label
          htmlFor="image-upload-input"
          className="cursor-pointer px-4 py-2 mb-4 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
        >
          {isDragOver ? '松开即可上传' : '选择图片或拖拽、粘贴到此处'}
        </label>
      )}

      <AnimatePresence>
        {hasImages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full"
          >
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.uid}
                className="relative w-24 h-24 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={file.URL || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '')}
                  alt={file.FileName}
                  className="max-w-full max-h-full object-contain cursor-pointer"
                />

                <div 
                  onClick={() => handlePreviewClick(file)}
                
                className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1">
                  <span className="text-white text-xs text-center break-all mb-1">{file.FileName}</span>
                  {file.status === 'uploading' && (
                    <>
                      <Spinner loading={true} />
                      <span className="text-white text-xs mt-1">{file.percent}%</span>
                      <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700 mt-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${file.percent}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  {file.status === 'done' && (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  {file.status === 'error' && (
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(file.uid);
                    }}
                    className="absolute top-1 right-1 text-white bg-red-500 rounded-full p-0.5 hover:bg-red-600 transition-colors duration-200"
                    title="移除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
            <motion.label
              htmlFor="image-upload-input"
              className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs mt-1">{isDragOver ? '松开即可上传' : '添加图片'}</span>
            </motion.label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';
