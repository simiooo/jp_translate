import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Spinner from './Spinner';
import { Toast } from './Toast';
import { showImagePreview } from './ImgPreview';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

interface FileRecord {
  ID: number;
  FileName: string;
  ObjectKey: string;
  ContentType: string;
  FileSize: number;
  URL: string;
  UploadedAt: string;
}

interface UploadFile extends FileRecord {
  uid: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  percent?: number;
  originFileObj?: File;
}

interface ImageUploaderProps {
  onUploadSuccess?: (file: FileRecord) => void;
  initialImageUrls?: string[];
}

export const imageUploadSchema = z.object({
  image: z.instanceof(FileList).refine(fileList => fileList.length > 0, '请选择一个文件进行上传'),
});

type ImageUploadForm = z.infer<typeof imageUploadSchema>;

export const ImageUploader = forwardRef<HTMLInputElement, ImageUploaderProps>(({
  onUploadSuccess,
  initialImageUrls = [],
}, ref) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useImperativeHandle(ref, () => fileInputRef.current!, []);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ImageUploadForm>({
    // resolver: zodResolver(imageUploadSchema),
  });

  React.useEffect(() => {
    if (initialImageUrls.length > 0) {
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
  }, [initialImageUrls]);

  const uploadImage = async (file: File, uid: string) => {
    return new Promise<{ message: string; file: FileRecord }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/files/upload');
      xhr.setRequestHeader('Authorization', localStorage.getItem('Authorization') || '');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadedFiles(prev =>
            prev.map(f => (f.uid === uid ? { ...f, percent: percent } : f))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Failed to parse response from server.'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject({ message: errorResponse.message || 'Upload failed', data: errorResponse });
          } catch {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error or request failed.'));
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

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

    try {
      const response = await uploadImage(file, uid); // Get the full response
      const fileRecord = response.file; // Extract fileRecord from the response

      setUploadedFiles(prev =>
        prev.map(f =>
          f.uid === uid
            ? {
                ...f,
                ...fileRecord,
                status: 'done',
                percent: 100,
                URL: fileRecord.URL,
              }
            : f
        )
      );
      onUploadSuccess?.(fileRecord);
      Toast.success(`文件 ${file.name} 上传成功！`);
    } catch (err: unknown) { // Use unknown for catch block
      setUploadedFiles(prev =>
        prev.map(f => (f.uid === uid ? { ...f, status: 'error', percent: 0 } : f))
      );
      let errorMessage = '未知错误';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const customError = err as { message?: string; data?: { message?: string } };
        if (typeof customError.data?.message === 'string') {
          errorMessage = customError.data.message;
        } else if (typeof customError.message === 'string') {
          errorMessage = customError.message;
        }
      }
      Toast.error(`文件 ${file.name} 上传失败: ${errorMessage}`);
      console.error('Upload error:', err);
    } finally {
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      <form onSubmit={handleSubmit(() => {})} className="w-full flex flex-col items-center">
        <Controller
          name="image"
          control={control}
          render={({ field: { onChange, onBlur, name, ref: controllerRef } }) => (
            <input
              type="file"
              ref={node => {
                controllerRef(node);
                (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }}
              accept="image/*"
              onChange={(e) => {
                onChange(e.target.files);
                handleFileChange(e);
              }}
              onBlur={onBlur}
              name={name}
              className="hidden"
              id="image-upload-input"
              multiple
            />
          )}
        />

        {!hasImages && (
          <label
            htmlFor="image-upload-input"
            className="cursor-pointer px-4 py-2 mb-4 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
          >
            {isDragOver ? '松开即可上传' : '选择图片或拖拽、粘贴到此处'}
          </label>
        )}
        {errors.image && <p className="text-red-500 text-xs italic">{errors.image.message}</p>}

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
      </form>
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';
