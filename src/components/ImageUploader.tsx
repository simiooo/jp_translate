import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { showImagePreview } from './ImgPreview';
import { alovaInstance } from '../utils/request';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '~/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useRequest } from 'ahooks';
import { FileRecord } from '../types/file';
import { useTranslation } from 'react-i18next';

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
 const { t } = useTranslation();
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
        toast.success(t('File {{name}} uploaded successfully!', { name: params.name }));
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
        toast.error(t('File {{name}} upload failed: {{error}}', {
          name: params[0].params.name,
          error: errorMessage
        }));
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
    setUploadedFiles(prev => {
      const newFiles = prev.filter(file => file.uid !== uid);
      onChange?.(newFiles.filter(f => f.status === 'done'));
      return newFiles;
    });
    toast.info(t('File removed from list'));
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
    <Card
      className={cn(
        "transition-all duration-300",
        isDragOver 
          ? "border-primary ring-4 ring-primary/20" 
          : "border-input hover:border-primary/50"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <CardContent className="p-4">
        

        {!hasImages && (
          <div className="flex flex-col items-center justify-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              {isDragOver ? t('Release to upload') : t('Select image')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('Or drag, drop, or paste images here')}
            </p>
          </div>
        )}

        {hasImages && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file) => (
                <Card
                  key={file.uid}
                  className="relative group overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img
                        src={file.URL || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '')}
                        alt={file.FileName}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handlePreviewClick(file)}
                      />
                      
                      {/* Status overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.status === 'uploading' && (
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2" />
                            <p className="text-xs">{file.percent || 0}%</p>
                          </div>
                        )}
                        {file.status === 'done' && (
                          <Check className="h-6 w-6 text-green-400" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="h-6 w-6 text-red-400" />
                        )}
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(file.uid);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Status badge */}
                      <div className="absolute bottom-1 left-1">
                        {file.status === 'uploading' && (
                          <Badge variant="secondary" className="text-xs">
                            {t('Uploading')}
                          </Badge>
                        )}
                        {file.status === 'done' && (
                          <Badge variant="default" className="text-xs">
                            {t('Completed')}
                          </Badge>
                        )}
                        {file.status === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            {t('Failed')}
                          </Badge>
                        )}
                      </div>

                      {/* Progress bar */}
                      {file.status === 'uploading' && file.percent !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1">
                          <Progress value={file.percent} className="h-1" />
                        </div>
                      )}
                    </div>

                    <div className="p-2">
                      <p className="text-xs text-muted-foreground truncate" title={file.FileName}>
                        {file.FileName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add more button */}
              <Card 
                className="border-dashed cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="p-0">
                  <div className="aspect-square flex flex-col items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {isDragOver ? t('Release to upload more') : t('Add image')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ImageUploader.displayName = 'ImageUploader';
