import React, { useState } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ImgPreviewProps {
  src: string;
  alt: string;
  className?: string;
  onClose?: () => void;
}

const ImgPreview: React.FC<ImgPreviewProps> = ({ src, alt, className, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleImageLoad = () => setIsLoading(false);
  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <motion.div
      className="fixed inset-0 z-5000 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <AnimatePresence>
        {isLoading && !hasError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* You can add a spinner here if you like */}
          </motion.div>
        )}
        {hasError ? (
          <div className="text-red-500 font-medium">Failed to load image</div>
        ) : (
          <motion.img
            key={src}
            src={src}
            alt={alt}
            className={`object-contain rounded-lg shadow-xl ${className} ${
              isZoomed ? 'cursor-zoom-out max-h-none max-w-none' : 'cursor-zoom-in max-h-[90vh] max-w-[90vw]'
            }`}
            style={{ display: isLoading ? 'none' : 'block' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: isZoomed ? 2 : 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={toggleZoom}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const showImagePreview = (props: Omit<ImgPreviewProps, 'onClose'>) => {
  // Check if we're in a browser environment (not SSR)
  if (typeof document === 'undefined') {
    return;
  }
  
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    unmountComponentAtNode(container);
    container.remove();
  };

  render(<ImgPreview {...props} onClose={closeHandler} />, container);
};

export default ImgPreview;
