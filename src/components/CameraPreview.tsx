// src/components/CameraPreview.tsx
import { HTMLAttributes } from 'react';

interface CameraPreviewProps extends HTMLAttributes<HTMLDivElement> {
  aspectRatio?: number;
}

export default function CameraPreview({
  children,
//   aspectRatio = 16/9,
  className,
  ...props
}: CameraPreviewProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg ${className}`}

      {...props}
    >
      <div className="relative w-full h-full">
        {children}
        <div className="absolute inset-0 rounded-lg pointer-events-none" />
      </div>
    </div>
  );
}